from typing import List
from fastapi import APIRouter, Query, HTTPException

from app.api.dependencies.repositories import TagRepositoryDep
from app.api.dependencies.auth import CurrentOrgDep, CurrentWorkspaceDep, PublicWorkspaceDep
from app.schemas.tag import TagResponse, TagCreate, TagUpdate, TagTreeNode

router = APIRouter()
public_router = APIRouter()


#############################################################################
#############################################################################
@router.get("/{slug}", response_model=List[TagResponse])
async def get_tags(
    db_org: CurrentOrgDep,
    db_workspace: CurrentWorkspaceDep,
    tag_repo: TagRepositoryDep,
):
    return await tag_repo.get_by_workspace(workspace_id=db_workspace.id)


#############################################################################
#############################################################################
@router.post("/{slug}", response_model=List[TagResponse])
async def add_tag(
    db_org: CurrentOrgDep,
    db_workspace: CurrentWorkspaceDep,
    tag_repo: TagRepositoryDep,
    payload: TagCreate,
):
    tags = await tag_repo.upsert_path(
        workspace_id=db_workspace.id,
        path=payload.path,
        label=payload.label,
        description=payload.description,
    )
    await tag_repo.db.commit()
    return tags


#############################################################################
#############################################################################
@router.patch("/{slug}", response_model=TagResponse)
async def update_tag(
    db_org: CurrentOrgDep,
    db_workspace: CurrentWorkspaceDep,
    tag_repo: TagRepositoryDep,
    path: str = Query(..., pattern=r"^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)*$"),
    payload: TagUpdate = ...,
):
    tag = await tag_repo.update_tag(
        workspace_id=db_workspace.id,
        path=path,
        label=payload.label,
        description=payload.description,
    )
    if not tag:
        raise HTTPException(404, "Tag not found")
    await tag_repo.db.commit()
    await tag_repo.db.refresh(tag)
    return tag


#############################################################################
#############################################################################
@router.delete("/{slug}", response_model=List[TagResponse])
async def delete_tag(
    db_org: CurrentOrgDep,
    db_workspace: CurrentWorkspaceDep,
    tag_repo: TagRepositoryDep,
    path: str = Query(..., pattern=r"^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)*$"),
):
    await tag_repo.delete_subtree(workspace_id=db_workspace.id, path=path)
    await tag_repo.db.commit()
    return await tag_repo.get_by_workspace(workspace_id=db_workspace.id)


#############################################################################
#############################################################################
@public_router.get("/", response_model=List[TagTreeNode])
async def get_tags_tree(
    db_workspace: PublicWorkspaceDep,
    tag_repo: TagRepositoryDep,
):
    return await tag_repo.get_tree(workspace_id=db_workspace.id)
