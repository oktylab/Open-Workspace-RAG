import uuid
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.repositories.base_repository import BaseRepository
from app.models.document import Document
from app.models.enums import LanguageEnum

class DocumentRepository(BaseRepository[Document]):

    #################################################################################
    #################################################################################
    def __init__(self, db: AsyncSession):
        super().__init__(Document, db)

    #################################################################################
    #################################################################################
    async def get_by_url_and_org(self, url: str, org_id: uuid.UUID) -> Optional[Document]:
        result = await self.db.execute(
            select(self.model).where(
                self.model.url == url,
                self.model.organization_id == org_id
            )
        )
        return result.scalar_one_or_none()

    #################################################################################
    #################################################################################
    def create(
        self, 
        organization_id: uuid.UUID, 
        url: str, 
        lang: LanguageEnum, 
        content_hash: str, 
        title: Optional[str] = None, 
        tags: Optional[List[str]] = None, 
        suggestions: Optional[List[str]] = None
    ) -> Document:

        new_doc = self.model(
            organization_id=organization_id,
            url=url,
            title=title,
            lang=lang,
            content_hash=content_hash,
            tags=tags or [],
            suggestions=suggestions or []
        )
        self.db.add(new_doc)
        return new_doc