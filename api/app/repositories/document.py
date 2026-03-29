import uuid
from typing import Optional, List, Dict, Set, Collection, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy import select, text, delete, update, func
from app.repositories.base_repository import BaseRepository
from app.models.document import Document
from app.models.job_document import JobDocument
from app.schemas.enums import LanguageEnum, JobDocumentAction

class DocumentRepository(BaseRepository[Document]):

    def __init__(self, db: AsyncSession):
        super().__init__(Document, db)

    #################################################################################
    #################################################################################
    async def get_by_url_and_workspace(self, url: str, workspace_id: uuid.UUID) -> Optional[Document]:
        result = await self.db.execute(
            select(self.model).where(
                self.model.url == url,
                self.model.workspace_id == workspace_id
            )
        )
        return result.scalar_one_or_none()


    #################################################################################
    #################################################################################
    async def get_hashes_by_urls(
        self, 
        workspace_id: uuid.UUID, 
        urls: List[str]
    ) -> Dict[str, str]:

        stmt = select(self.model.url, self.model.content_hash).where(
            self.model.workspace_id == workspace_id,
            self.model.url.in_(urls)
        )
        result = await self.db.execute(stmt)
        return {row.url: row.content_hash for row in result}

    async def get_by_id_with_chunks(
        self,
        workspace_id: uuid.UUID,
        document_id: uuid.UUID
    ) -> Optional[Document]:

        stmt = (
            select(self.model)
            .where(
                self.model.workspace_id == workspace_id,
                self.model.id == document_id
            )
            .options(selectinload(self.model.chunks), selectinload(self.model.tag))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    #################################################################################
    #################################################################################
    async def get_all_by_workspace_paginated(
        self, 
        workspace_id: uuid.UUID,
        skip: int,
        limit: int,
        document_ids: Optional[Collection[uuid.UUID]] = None,
        job_ids: Optional[Collection[uuid.UUID]] = None,
        is_approved: Optional[bool] = None,
        langs: Optional[Collection[LanguageEnum]] = None,
        actions: Optional[Collection[JobDocumentAction]] = None,
        query: Optional[str] = None
    ) -> tuple[List[Document], int, dict[str, int]]:

        # 1. Base statement for items and total count
        stmt = select(self.model).where(self.model.workspace_id == workspace_id)

        if document_ids:
            stmt = stmt.where(self.model.id.in_(document_ids))
        
        if is_approved is not None:
            stmt = stmt.where(self.model.is_approved == is_approved)
            
        if langs:
            stmt = stmt.where(self.model.lang.in_(langs))

        if query:
            stmt = stmt.where(
                (self.model.url.ilike(f"%{query}%")) | 
                (self.model.title.ilike(f"%{query}%"))
            )

        if job_ids or actions:
            stmt = stmt.join(JobDocument, JobDocument.document_id == self.model.id)
            if job_ids:
                stmt = stmt.where(JobDocument.job_id.in_(job_ids))
            if actions:
                stmt = stmt.where(JobDocument.action.in_(actions))                
            stmt = stmt.distinct()

        # 2. Get total count for the filtered results
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = await self.db.scalar(count_stmt) or 0

        # 3. Get language distribution for the entire workspace (not affected by other filters except workspace)
        # The user said "number of documents in all the db of that langauge" 
        # but likely means within the workspace context.
        lang_stmt = (
            select(self.model.lang, func.count())
            .where(self.model.workspace_id == workspace_id)
            .group_by(self.model.lang)
        )
        lang_res = await self.db.execute(lang_stmt)
        language_counts = {str(row[0].value): row[1] for row in lang_res.all()}

        # 4. Final paginated items statement
        stmt = (
            stmt.options(selectinload(self.model.chunks), selectinload(self.model.tag))
            .order_by(self.model.created_at.desc(), self.model.id.desc())
            .offset(skip)
            .limit(limit)
        )
        
        result = await self.db.execute(stmt)
        items = result.scalars().all()
        
        return list(items), total, language_counts
    
    #################################################################################
    #################################################################################
    def create(
        self,
        workspace_id: uuid.UUID,
        url: str,
        lang: LanguageEnum,
        content_hash: str,
        job_id: Optional[uuid.UUID] = None,
        action: JobDocumentAction = JobDocumentAction.CREATED,
        is_approved: bool = True,
        title: Optional[str] = None,
        tag_id: Optional[uuid.UUID] = None,
    ) -> Document:

        db_document = self.model(
            workspace_id=workspace_id,
            url=url,
            title=title,
            lang=lang,
            content_hash=content_hash,
            is_approved=is_approved,
            tag_id=tag_id,
        )

        if job_id:
            db_jobdocument = JobDocument(job_id=job_id, action=action)
            db_document.document_jobs.append(db_jobdocument)


        self.db.add(db_document)
        return db_document


    #################################################################################
    #################################################################################
    async def upsert_for_job(
        self,
        workspace_id: uuid.UUID,
        url: str,
        title: str,
        lang: LanguageEnum,
        content_hash: str,
        job_id: uuid.UUID,
    ) -> Document:

        db_document = await self.get_by_url_and_workspace(url, workspace_id)
        
        if db_document:
            db_document.content_hash = content_hash
            db_document.title = title
            db_document.lang = lang
            db_document.updated_at = func.now()
            action = JobDocumentAction.UPDATED
        else:
            db_document = self.model(
                workspace_id=workspace_id,
                url=url,
                title=title,
                lang=lang,
                content_hash=content_hash,
                tag_id=None,
                is_approved=False
            )
            self.db.add(db_document)
            action = JobDocumentAction.CREATED


        await self.db.flush() 
        db_jobdocument = JobDocument(
            job_id=job_id, 
            document_id=db_document.id,
            action=action
        )
        await self.db.merge(db_jobdocument)
        
        return db_document        
    

    #################################################################################
    #################################################################################
    async def bulk_label_documents(
        self,
        document_ids: List[uuid.UUID]
    ) -> None:
        """
        Auto-assign the best matching tag to each document based on
        cosine similarity between chunk embeddings and tag embeddings.
        """
        query = text("""
            WITH scoring AS (
                SELECT
                    c.document_id,
                    t.id AS tag_id,
                    t.path::text AS tag_path,
                    (c.embedding <=> t.embedding) AS distance,
                    (0.04 + 0.025 * ln(GREATEST(length(c.content), 1))) AS threshold
                FROM chunks c
                JOIN documents d ON c.document_id = d.id
                JOIN tags t ON t.workspace_id = d.workspace_id
                WHERE d.id = ANY(:document_ids)
                  AND t.embedding IS NOT NULL
            ),
            document_best_matches AS (
                SELECT
                    document_id,
                    tag_id,
                    tag_path,
                    MIN(distance) AS best_distance,
                    MAX(threshold) AS calculated_threshold
                FROM scoring
                GROUP BY document_id, tag_id, tag_path
            ),
            best_match AS (
                SELECT DISTINCT ON (document_id)
                    document_id,
                    tag_id
                FROM document_best_matches
                WHERE best_distance < calculated_threshold
                ORDER BY document_id, best_distance ASC
            )
            UPDATE documents d
            SET tag_id = m.tag_id
            FROM best_match m
            WHERE d.id = m.document_id
        """)
        await self.db.execute(query, {"document_ids": document_ids})

    #################################################################################
    #################################################################################
    async def delete_by_ids_and_workspace(self, document_ids: List[uuid.UUID], workspace_id: uuid.UUID):
        stmt = delete(self.model).where(
            self.model.id.in_(document_ids),
            self.model.workspace_id == workspace_id
        )
        await self.db.execute(stmt)

    #################################################################################
    #################################################################################
    async def update_approval_status(self, document_ids: List[uuid.UUID], workspace_id: uuid.UUID, is_approved: bool):
        stmt = update(self.model).where(
            self.model.id.in_(document_ids),
            self.model.workspace_id == workspace_id
        ).values(is_approved=is_approved)
        await self.db.execute(stmt)