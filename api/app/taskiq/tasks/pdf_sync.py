import uuid, asyncio
import pymupdf
import pymupdf4llm
from taskiq import TaskiqDepends
from sqlalchemy.ext.asyncio import AsyncSession

from app.taskiq.broker import broker
from app.taskiq.dependencies.repositories import JobRepositoryDep, StorageRepositoryDep
from app.taskiq.tasks.shared import PagePayload, process_and_store_documents_task, _batched, BATCH_SIZE
from app.core.connections import get_db
from app.schemas.job_params import PDFJobConfig, PDFJobResult, PDFFileResult, JobSummary
from app.schemas.enums import JobStatus
from app.utils.text import get_language_enum, get_content_hash


################################################################################
################################################################################
@broker.task
async def process_pdf_job_task(
    job_id: str,
    job_repo: JobRepositoryDep,
    storage_repo: StorageRepositoryDep,
    db: AsyncSession = TaskiqDepends(get_db),
) -> dict:
    job_uuid = uuid.UUID(job_id)

    db_job = await job_repo.get_by_id(job_uuid)
    db_job.status = JobStatus.STARTED
    await db.commit()

    config: PDFJobConfig = db_job.config  # type: ignore

    file_results: list[PDFFileResult] = []
    valid_pages: list[PagePayload] = []

    for key in config.storage_keys:
        filename = key.split("/")[-1]
        try:
            pdf_bytes, _ = await storage_repo.download_file(config.bucket, key)

            doc = pymupdf.Document(stream=pdf_bytes, filetype="pdf")
            num_pages = len(doc)
            content = pymupdf4llm.to_markdown(doc)

            if not content.strip():
                file_results.append(PDFFileResult(
                    key=key,
                    filename=filename,
                    pages=num_pages,
                    error="No content extracted"
                ))
                continue

            lang = get_language_enum(content)
            content_hash = get_content_hash(content)

            valid_pages.append(PagePayload(
                url=key,
                title=filename,
                content=content,
                content_hash=content_hash,
                lang=lang,
                workspace_id=str(db_job.workspace_id),
            ))
            file_results.append(PDFFileResult(key=key, filename=filename, pages=num_pages))

        except Exception as e:
            file_results.append(PDFFileResult(key=key, filename=filename, pages=0, error=str(e)))

    handles = [
        await process_and_store_documents_task.kiq(pages=batch, job_id=job_uuid)
        for batch in _batched(valid_pages, BATCH_SIZE)
    ]
    await asyncio.gather(*[h.wait_result() for h in handles])

    succeeded = sum(1 for f in file_results if not f.error)
    failed    = sum(1 for f in file_results if f.error)

    db_job.status = JobStatus.SUCCESS if succeeded > 0 else JobStatus.FAILURE
    db_job.result = PDFJobResult(
        files=file_results,
        summary=JobSummary(
            total=len(file_results),
            succeeded=succeeded,
            failed=failed,
            skipped=0,
        )
    )

    await db.commit()
    return db_job.result
