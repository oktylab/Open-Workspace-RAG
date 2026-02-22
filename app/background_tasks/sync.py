from app.taskiq.broker import broker
from app.background_tasks.crawler import crawl_site_task
from app.background_tasks.scraper import scrape_and_store_url_task

@broker.task
async def sync_site_task(
    url: str, 
    org_slug: str, 
    max_pages: int = 100
) -> dict:

    crawler_task = await crawl_site_task.kiq(url=url, max_pages=max_pages)
    crawler_result = await crawler_task.wait_result()
    unique_urls = crawler_result.return_value

    queued_tasks = []
    
    for page_url in unique_urls:
        task_info = await scrape_and_store_url_task.kiq(url=page_url, org_slug=org_slug)
        queued_tasks.append(task_info.task_id)

    return {
        "status": "success",
        "message": f"Successfully mapped site and queued {len(queued_tasks)} extraction tasks.",
        "total_urls_found": len(unique_urls),
        "urls": unique_urls,
        "queued_task_ids": queued_tasks
    }