from fastapi import APIRouter
from app.core.embeddings import get_embedding_model
from app.background_tasks.crawler import crawl_site_task
from app.background_tasks.scraper import scrape_and_store_url_task

router = APIRouter()

##########################################################################################
##########################################################################################
@router.get("/test")
async def test(
    url: str,
    max_pages: int,
    org_slug: str
):
    # task_handle = await crawl_site_task.kiq(url=url, max_pages=max_pages)
    task_handle = await scrape_and_store_url_task.kiq(url=url, org_slug=org_slug)
    result = await task_handle.wait_result()
    
    return {
        "task_id": task_handle.task_id,
        "worker_output": result.return_value
    }

##########################################################################################
##########################################################################################
@router.post("/vectorize")
async def get_vector(text: str):
    model = get_embedding_model()
    embeddings = list(model.embed([text]))
    vector = embeddings[0].tolist()
    
    return {
        "text": text,
        "dimensions": len(vector),
        "vector": vector
    }