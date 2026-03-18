from fastapi import APIRouter
from app.api.routers import organization, workspace, tags, document, chat, job, test

# (Requires Auth & Strict CORS)
admin_router = APIRouter()
admin_router.include_router(organization.router, prefix="/organizations", tags=["Organizations"])
admin_router.include_router(workspace.router, prefix="/workspaces", tags=["Workspaces"])
admin_router.include_router(document.router, prefix="/documents", tags=["Documents"])
admin_router.include_router(job.router, prefix="/jobs", tags=["Jobs"])
admin_router.include_router(tags.router, prefix="/tags", tags=["Tags"])
admin_router.include_router(test.router, prefix="/tests", tags=["Tests"])

# (API Key Auth & Open CORS)
public_router = APIRouter()
public_router.include_router(chat.router, prefix="/chat", tags=["Chat"])