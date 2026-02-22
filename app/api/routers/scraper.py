from fastapi import APIRouter
from app.background_tasks.sync import sync_site_task

router = APIRouter()

##########################################################################################
##########################################################################################
@router.post("/scrap")
async def scrap(
    url: str,
    max_pages: int,
    org_slug: str,
):
    task_handle = await sync_site_task.kiq(url=url, max_pages=max_pages, org_slug=org_slug)    
    result = await task_handle.wait_result()    
    return {
        "task_id": task_handle.task_id,
        "worker_output": result.return_value
    }