import asyncio, json, uuid, unicodedata, re, secrets
from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse

from app.api.dependencies.repositories import JobRepositoryDep, StorageRepositoryDep
from app.api.dependencies.auth import CurrentOrgDep, CurrentWorkspaceDep
from app.schemas.job import PaginatedJobResponse, JobResponse
from app.schemas.job_params import URLJobConfig, PDFJobConfig
from app.schemas.enums import JobStatus
from app.core.settings import settings
from app.taskiq.tasks.url_sync import sync_site_task
from app.taskiq.tasks.pdf_sync import process_pdf_job_task
from typing import List, Optional

router = APIRouter()


###################################################################################################
###################################################################################################
@router.get("/{slug}", response_model=PaginatedJobResponse)
async def get_workspace_jobs(
    db_org: CurrentOrgDep,
    db_workspace: CurrentWorkspaceDep,
    job_repo: JobRepositoryDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[List[JobStatus]] = Query(None)
):
    db_jobs, total = await job_repo.get_by_workspace(
        workspace_id=db_workspace.id,
        skip=skip,
        limit=limit,
        statuses=status
    )
    return PaginatedJobResponse(items=db_jobs, total=total, skip=skip, limit=limit)


###################################################################################################
###################################################################################################
@router.get("/{slug}/{job_id}", response_model=JobResponse)
async def get_job(
    db_org: CurrentOrgDep,
    db_workspace: CurrentWorkspaceDep,
    job_repo: JobRepositoryDep,
    job_id: uuid.UUID
):
    db_job = await job_repo.get_by_id(job_id)
    if not db_job or db_job.workspace_id != db_workspace.id:
        raise HTTPException(404, "Job not found in this workspace")
    return db_job


###################################################################################################
###################################################################################################
@router.post("/{slug}/url", response_model=JobResponse)
async def create_url_job(
    db_org: CurrentOrgDep,
    db_workspace: CurrentWorkspaceDep,
    config: URLJobConfig,
    job_repo: JobRepositoryDep
):
    db_job = job_repo.create(workspace_id=db_workspace.id, config=config)
    await job_repo.db.commit()

    task = await sync_site_task.kiq(job_id=str(db_job.id))

    db_job.task_id = task.task_id
    db_job.status = JobStatus.PENDING

    await job_repo.db.commit()
    await job_repo.db.refresh(db_job)
    return db_job


###################################################################################################
###################################################################################################
def _normalize_org_name(name: str) -> str:
    """Lowercase, strip accents and diacritics, keep only a-z0-9 and hyphens."""
    nfd = unicodedata.normalize("NFD", name)
    ascii_only = nfd.encode("ascii", "ignore").decode("ascii")
    lowered = ascii_only.lower()
    return re.sub(r"[^a-z0-9]+", "-", lowered).strip("-")


@router.post("/{slug}/pdf", response_model=JobResponse)
async def create_pdf_job(
    db_organization: CurrentOrgDep,
    db_workspace: CurrentWorkspaceDep,
    job_repo: JobRepositoryDep,
    storage_repo: StorageRepositoryDep,
    files: List[UploadFile] = File(...),
):
    if not files:
        raise HTTPException(400, "At least one PDF file is required")

    org_prefix = _normalize_org_name(db_organization.name)
    storage_keys: List[str] = []

    for file in files:
        file_id = secrets.token_hex(10)
        key = f"{org_prefix}/{db_workspace.slug}/{settings.PDF_FOLDER}/{file_id}.pdf"
        data = await file.read()
        await storage_repo.upload_file(
            bucket_name=settings.FILES_BUCKET,
            key=key,
            data=data,
            content_type="application/pdf",
        )
        storage_keys.append(key)

    config = PDFJobConfig(storage_keys=storage_keys, bucket=settings.FILES_BUCKET)
    db_job = job_repo.create(workspace_id=db_workspace.id, config=config)
    await job_repo.db.commit()

    task = await process_pdf_job_task.kiq(job_id=str(db_job.id))

    db_job.task_id = task.task_id
    db_job.status = JobStatus.PENDING

    await job_repo.db.commit()
    await job_repo.db.refresh(db_job)
    return db_job


###################################################################################################
###################################################################################################
@router.patch("/{slug}/{job_id}", response_model=JobResponse)
async def update_url_job(
    db_org: CurrentOrgDep,
    db_workspace: CurrentWorkspaceDep,
    job_id: uuid.UUID,
    config: URLJobConfig,
    job_repo: JobRepositoryDep
):
    db_job = await job_repo.get_by_id(job_id)
    if not db_job or db_job.workspace_id != db_workspace.id:
        raise HTTPException(404, "Job not found in this workspace")

    if db_job.status == JobStatus.STARTED:
        raise HTTPException(400, "Cannot update a job while it is actively running")

    db_job.config = config
    await job_repo.db.commit()
    await job_repo.db.refresh(db_job)
    return db_job


###################################################################################################
###################################################################################################
@router.post("/{slug}/run", response_model=List[JobResponse])
async def run_jobs(
    db_org: CurrentOrgDep,
    db_workspace: CurrentWorkspaceDep,
    job_ids: List[uuid.UUID],
    job_repo: JobRepositoryDep
):
    db_jobs = []
    for job_id in job_ids:
        db_job = await job_repo.get_by_id(job_id)
        if not db_job or db_job.workspace_id != db_workspace.id:
            raise HTTPException(404, "Job not found in this workspace")
        if db_job.status == JobStatus.STARTED:
            raise HTTPException(400, f"Cannot run job {job_id} while it is actively running")
        db_jobs.append(db_job)

    result_jobs = []
    for db_job in db_jobs:
        db_job.status = JobStatus.PENDING

        if db_job.config and db_job.config.type == "pdf":
            task = await process_pdf_job_task.kiq(job_id=str(db_job.id))
        else:
            task = await sync_site_task.kiq(job_id=str(db_job.id))

        db_job.task_id = task.task_id
        await job_repo.db.commit()
        await job_repo.db.refresh(db_job)
        result_jobs.append(db_job)

    return result_jobs


###################################################################################################
###################################################################################################
@router.delete("/{slug}")
async def delete_jobs(
    db_org: CurrentOrgDep,
    db_workspace: CurrentWorkspaceDep,
    job_ids: List[uuid.UUID],
    job_repo: JobRepositoryDep
):
    deleted = await job_repo.delete_many(job_ids=job_ids, workspace_id=db_workspace.id)
    await job_repo.db.commit()
    return {"detail": f"{deleted} jobs deleted successfully"}


###################################################################################################
###################################################################################################
@router.get("/{slug}/{job_id}/progress")
async def job_progress(
    slug: str,
    job_id: uuid.UUID,
    job_repo: JobRepositoryDep
):
    async def event_stream():
        while True:
            db_job = await job_repo.get_by_id(job_id)

            if not db_job:
                yield f"data: {json.dumps({'error': 'Job not found'})}\n\n"
                break

            await job_repo.db.refresh(db_job)

            job_response = JobResponse.model_validate(db_job)
            yield f"data: {job_response.model_dump_json()}\n\n"

            if db_job.status in [JobStatus.SUCCESS, JobStatus.FAILURE]:
                await asyncio.sleep(60)
                break

            await asyncio.sleep(1)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
