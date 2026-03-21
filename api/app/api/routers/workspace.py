from typing import List
from fastapi import APIRouter, HTTPException, status

from app.api.dependencies.repositories import WorkspaceRepositoryDep
from app.api.dependencies.auth import CurrentOrgDep, CurrentWorkspaceDep
from app.schemas.workspace import (
    WorkspaceCreate, 
    WorkspaceResponse, 
    WorkspaceUpdate,
)
from app.core.security import generate_workspace_api_key

router = APIRouter()

#############################################################################
#############################################################################
@router.get("/", response_model=List[WorkspaceResponse])
async def get_workspaces(
    db_org: CurrentOrgDep,
    workspace_repo: WorkspaceRepositoryDep
):
    return await workspace_repo.get_all_by_org(db_org.id)

#############################################################################
#############################################################################
@router.post("/", status_code=status.HTTP_201_CREATED, response_model=WorkspaceResponse)
async def create_workspace(
    data: WorkspaceCreate,
    db_org: CurrentOrgDep,
    workspace_repo: WorkspaceRepositoryDep
):
    existing = await workspace_repo.get_by_slug_and_org(
        organization_id=db_org.id,
        slug=data.slug
    )
    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"Workspace with slug '{data.slug}' already exists."
        )

    db_workspace = workspace_repo.create(
        organization_id=db_org.id,
        slug=data.slug,
        name=data.name,
        url=str(data.url),
        allowed_origins=data.allowed_origins
    )
    await workspace_repo.db.commit()
    
    return db_workspace

#############################################################################
#############################################################################
@router.get("/{slug}", response_model=WorkspaceResponse)
async def get_workspace(
    db_org: CurrentOrgDep,
    db_workspace: CurrentWorkspaceDep,
):
    return db_workspace

#############################################################################
#############################################################################
@router.patch("/{slug}", response_model=WorkspaceResponse)
async def update_workspace(
    db_org: CurrentOrgDep,
    db_workspace: CurrentWorkspaceDep,
    data: WorkspaceUpdate,
    workspace_repo: WorkspaceRepositoryDep
):

    if data.slug and data.slug != db_workspace.slug:
        conflict = await workspace_repo.get_by_slug_and_org(
            organization_id=db_org.id,
            slug=data.slug
        )
        
        if conflict:
            raise HTTPException(
                status_code=400, 
                detail="Slug already taken"
            )
        db_workspace.slug = data.slug

    if data.name:
        db_workspace.name = data.name
    if data.url:
        db_workspace.url = str(data.url)
    
    if data.allowed_origins : 
        db_workspace.allowed_origins = data.allowed_origins
    
    if data.regenerate_api_key : 
        db_workspace.api_key = generate_workspace_api_key()

    await workspace_repo.db.commit()
    return db_workspace

#############################################################################
#############################################################################
@router.delete("/{slug}")
async def delete_workspace(
    db_org: CurrentOrgDep,
    db_workspace: CurrentWorkspaceDep,
    workspace_repo: WorkspaceRepositoryDep
):
    await workspace_repo.db.delete(db_workspace)
    await workspace_repo.db.commit()
    return {
        "status": "deleted",
        "info": f"Workspace '{db_workspace.name}' has been deleted."
    }