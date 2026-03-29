from typing import List, Optional, Set
from fastapi import APIRouter, Query
from app.api.dependencies.repositories import DocumentRepositoryDep
from app.api.dependencies.auth import CurrentOrgDep, CurrentWorkspaceDep
from app.schemas.document import PaginatedDocumentResponse, DocumentResponseWithChunks, DocumentUpdate
from app.schemas.enums import LanguageEnum, JobDocumentAction

import uuid

router = APIRouter()

#############################################################################
#############################################################################
@router.get("/{slug}", response_model=PaginatedDocumentResponse)
async def get_documents(
    db_org: CurrentOrgDep,
    db_workspace: CurrentWorkspaceDep,
    document_repo: DocumentRepositoryDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    document_ids: Optional[Set[uuid.UUID]] = Query(None),
    job_ids: Optional[Set[uuid.UUID]] = Query(None),
    is_approved: Optional[bool] = Query(None),
    langs: Optional[Set[LanguageEnum]] = Query(None),
    actions: Optional[Set[JobDocumentAction]] = Query(None),
    q: Optional[str] = Query(None)
):
    db_documents, total, lang_counts = await document_repo.get_all_by_workspace_paginated(
        workspace_id=db_workspace.id,
        skip=skip,
        limit=limit,
        document_ids=document_ids,
        job_ids=job_ids,
        is_approved=is_approved,
        langs=langs,
        actions=actions,
        query=q
    )
    
    return PaginatedDocumentResponse(
        items=db_documents, 
        total=total, 
        skip=skip, 
        limit=limit,
        language_counts=lang_counts
    )



#############################################################################
#############################################################################
@router.get("/{slug}/{document_id}", response_model=DocumentResponseWithChunks)
async def get_document(
    db_org: CurrentOrgDep,
    db_workspace: CurrentWorkspaceDep,
    document_repo: DocumentRepositoryDep,
    document_id: uuid.UUID,
):
    db_document = await document_repo.get_by_id_with_chunks(
        workspace_id=db_workspace.id,
        document_id=document_id,
    )
    
    return db_document


#############################################################################
#############################################################################
@router.delete("/{slug}")
async def delete_documents(
    db_org: CurrentOrgDep,
    db_workspace: CurrentWorkspaceDep,
    document_repo: DocumentRepositoryDep,
    document_ids: List[uuid.UUID]
):
    await document_repo.delete_by_ids_and_workspace(document_ids, db_workspace.id)
    await document_repo.db.commit()
    return {"detail": "Documents deleted successfully"}

#############################################################################
#############################################################################
@router.patch("/{slug}/approval")
async def set_documents_approval(
    db_org: CurrentOrgDep,
    db_workspace: CurrentWorkspaceDep,
    document_repo: DocumentRepositoryDep,
    document_ids: List[uuid.UUID],
    is_approved: bool = Query(...)
):
    await document_repo.update_approval_status(document_ids, db_workspace.id, is_approved)
    await document_repo.db.commit()
    return {"detail": "Documents approval updated"}

#############################################################################
#############################################################################
@router.patch("/{slug}/{document_id}", response_model=DocumentResponseWithChunks)
async def update_document(
    db_org: CurrentOrgDep,
    db_workspace: CurrentWorkspaceDep,
    document_repo: DocumentRepositoryDep,
    document_id: uuid.UUID,
    payload: DocumentUpdate,
):
    from fastapi import HTTPException
    db_doc = await document_repo.get_by_id_with_chunks(
        workspace_id=db_workspace.id,
        document_id=document_id,
    )
    if not db_doc:
        raise HTTPException(404, "Document not found")

    if payload.title is not None:
        db_doc.title = payload.title
    if payload.tag_id is not None:
        db_doc.tag_id = payload.tag_id

    await document_repo.db.commit()
    await document_repo.db.refresh(db_doc)
    return db_doc