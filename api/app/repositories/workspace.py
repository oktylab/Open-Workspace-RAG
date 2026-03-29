import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.workspace import Workspace
from app.repositories.base_repository import BaseRepository

class WorkspaceRepository(BaseRepository[Workspace]):

    def __init__(self, db: AsyncSession):
        super().__init__(Workspace, db)

    #############################################################################
    #############################################################################
    def create(
        self,
        organization_id: uuid.UUID,
        slug: str,
        name: str,
        url: str,
        allowed_origins: List[str] = []
    ) -> Workspace:

        workspace = Workspace(
            organization_id=organization_id,
            slug=slug,
            name=name,
            url=url,
            allowed_origins=allowed_origins
        )
        self.db.add(workspace)
        return workspace

    #############################################################################
    #############################################################################
    async def get_by_slug_and_org(
        self, 
        slug: str, 
        organization_id: uuid.UUID
    ) -> Optional[Workspace]:

        result = await self.db.execute(
            select(self.model).where(
                func.lower(self.model.slug) == slug.lower().strip(),
                self.model.organization_id == organization_id
            )
        )
        return result.scalar_one_or_none()


    #############################################################################
    #############################################################################
    async def get_by_api_key(self, api_key: str) -> Optional[Workspace]:
        result = await self.db.execute(
            select(self.model).where(self.model.api_key == api_key)
        )
        return result.scalar_one_or_none()
    #############################################################################
    #############################################################################
    async def get_all_by_org(
        self, 
        organization_id: uuid.UUID
    ) -> List[Workspace]:

        result = await self.db.execute(
            select(self.model).where(self.model.organization_id == organization_id)
        )
        return list(result.scalars().all())
    


