from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.repositories.base_repository import BaseRepository
from app.models.organization import Organization

class OrganizationRepository(BaseRepository[Organization]):

    #################################################################################
    #################################################################################
    def __init__(self, db: AsyncSession):
        super().__init__(Organization, db)

    #################################################################################
    #################################################################################
    async def get_by_slug(self, slug: str) -> Optional[Organization]:
        result = await self.db.execute(
            select(self.model).where(self.model.slug == slug)
        )
        return result.scalar_one_or_none()