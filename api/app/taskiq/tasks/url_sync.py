import uuid, asyncio
from typing import Dict, List, Tuple, Union
from taskiq import TaskiqDepends
from sqlalchemy.ext.asyncio import AsyncSession

from app.taskiq.broker import broker
from app.taskiq.dependencies.repositories import DocumentRepositoryDep, JobRepositoryDep
from app.taskiq.tasks.shared import PagePayload, process_and_store_documents_task, _batched, BATCH_SIZE
from app.core.connections import get_db
from app.schemas.job_params import URLJobConfig, URLJobResult, JobPageResult, JobSummary
from app.schemas.enums import JobStatus, LanguageEnum
from app.utils.text import get_language_enum, get_content_hash
from app.utils.scraper import scrape_deep_crawl
from crawl4ai.models import CrawlResult


##################################################################################
##################################################################################
def evaluate_page_result(
    result: CrawlResult,
    config: URLJobConfig,
    existing_hashes: Dict[str, str],
    workspace_id: str
) -> Tuple[str, Union[JobPageResult, PagePayload]]:
    url = result.url.rstrip('/')

    # 1. Crawler Failures
    if not result.success:
        return "FAIL", JobPageResult(
            url=url,
            error=result.error_message or "Unknown crawler error",
        )

    # 2. Content Extraction
    content = result.markdown.fit_markdown if result.markdown else None
    if not content:
        return "SKIP", JobPageResult(
            url=url,
            reason="Page returned no content"
        )

    meta = result.metadata or {}
    title = meta.get("title") or meta.get("og:title") or "Untitled"

    # 3. Quality Gates
    word_count = len(content.split())
    if word_count < config.filtering.word_count_threshold:
        return "SKIP", JobPageResult(
            url=url,
            reason=f"Low word count ({word_count})"
        )

    lang = get_language_enum(content)
    if config.filtering.languages and lang not in config.filtering.languages:
        return "SKIP", JobPageResult(
            url=url,
            reason=f"Language '{lang}' not in allowed list"
        )

    # 4. Check against pre-fetched DB hashes
    content_hash = get_content_hash(content)
    db_hash = existing_hashes.get(url)

    if db_hash and db_hash == content_hash:
        return "SKIP", JobPageResult(
            url=url,
            title=title,
            reason="Content unchanged"
        )

    # 5. Success
    return "PROCESS", PagePayload(
        url=url,
        title=title,
        content=content,
        content_hash=content_hash,
        lang=lang,
        workspace_id=workspace_id
    )


################################################################################
################################################################################
@broker.task
async def sync_site_task(
    job_id: str,
    job_repo: JobRepositoryDep,
    doc_repo: DocumentRepositoryDep,
    db: AsyncSession = TaskiqDepends(get_db),
) -> dict:
    job_uuid = uuid.UUID(job_id)

    db_job = await job_repo.get_by_id(job_uuid)
    db_job.status = JobStatus.STARTED
    await db.commit()

    config: URLJobConfig = db_job.config  # type: ignore

    raw_results = await scrape_deep_crawl(config=config)

    unique_results_map = {r.url.rstrip('/'): r for r in raw_results}

    existing_hashes = await doc_repo.get_hashes_by_urls(
        workspace_id=db_job.workspace_id,
        urls=list(unique_results_map.keys())
    )

    failed_pages  = []
    skipped_pages = []
    valid_pages   = []

    for result in unique_results_map.values():
        state, info = evaluate_page_result(
            result=result,
            config=config,
            existing_hashes=existing_hashes,
            workspace_id=str(db_job.workspace_id)
        )

        if state == "FAIL":
            failed_pages.append(info)
        elif state == "SKIP":
            skipped_pages.append(info)
        else:
            valid_pages.append(info)

    handles = [
        await process_and_store_documents_task.kiq(pages=batch, job_id=job_uuid)
        for batch in _batched(valid_pages, BATCH_SIZE)
    ]
    await asyncio.gather(*[h.wait_result() for h in handles])

    db_job.status = JobStatus.SUCCESS if (not raw_results or valid_pages) else JobStatus.FAILURE
    db_job.result = URLJobResult(
        failed=failed_pages,
        skipped=skipped_pages,
        summary=JobSummary(
            total=len(raw_results),
            succeeded=len(valid_pages),
            failed=len(failed_pages),
            skipped=len(skipped_pages)
        )
    )

    await db.commit()
    return db_job.result
