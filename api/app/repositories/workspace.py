import uuid, json
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, func
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
        url: str
    ) -> Workspace:

        workspace = Workspace(
            organization_id=organization_id, 
            slug=slug, 
            name=name, 
            url=url
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
    


    #############################################################################
    #############################################################################
    async def get_tags(self, workspace_id: uuid.UUID) -> List[str]:
        query = text("SELECT tags::text[] FROM workspaces WHERE id = :id")
        result = await self.db.execute(query, {"id": workspace_id})
        return result.scalar_one_or_none() or[]

    #############################################################################
    #############################################################################
    async def sync_tags_and_embeddings(
        self, 
        workspace_id: uuid.UUID, 
        tags: List[str], 
        embeddings: dict
    ) -> List[str]:
        query = text("""
            UPDATE workspaces
            SET 
                tags = (
                    SELECT array_agg(DISTINCT t ORDER BY t)
                    FROM unnest(tags || CAST(:tags AS ltree[])) AS t
                ),
                tags_embeddings = COALESCE(tags_embeddings, '{}'::jsonb) || CAST(:embeddings AS jsonb)
            WHERE id = :id
            RETURNING tags::text[];
        """)
        
        result = await self.db.execute(query, {
            "id": workspace_id,
            "tags": tags,
            "embeddings": json.dumps(embeddings)
        })
        
        return result.scalar_one()

    #############################################################################
    #############################################################################
    async def remove_tag_hierarchy(self, workspace_id: uuid.UUID, path: str) -> List[str]:
        query = text("""
            UPDATE workspaces 
            SET 
                tags = ARRAY(
                    SELECT t FROM unnest(tags) AS t 
                    WHERE NOT (t <@ CAST(:path AS ltree))
                ),
                tags_embeddings = COALESCE(
                    (
                        SELECT jsonb_object_agg(key, value)
                        FROM jsonb_each(tags_embeddings)
                        WHERE NOT (CAST(key AS ltree) <@ CAST(:path AS ltree))
                    ),
                    '{}'::jsonb
                )
            WHERE id = :id
              AND EXISTS (SELECT 1 FROM unnest(tags) AS t WHERE t <@ CAST(:path AS ltree))
            RETURNING tags::text[];
        """)
        
        result = await self.db.execute(query, {"path": path, "id": workspace_id})
        updated_tags = result.scalar_one_or_none()
        
        if updated_tags is None:
            current_query = text("SELECT tags::text[] FROM workspaces WHERE id = :id")
            res = await self.db.execute(current_query, {"id": workspace_id})
            return res.scalar_one_or_none() or []
            
        return updated_tags
            
    #############################################################################
    #############################################################################
    async def rename_sync_hierarchy(
        self, 
        workspace_id: uuid.UUID, 
        old_path: str, 
        new_path: str,
        new_ancestors: List[str],
        new_branch_embeddings: dict
    ) -> List[str]:
        query = text("""
            UPDATE workspaces
            SET 
                -- 1. Rename existing hierarchy AND add missing ancestors
                tags = (
                    SELECT array_agg(DISTINCT t ORDER BY t)
                    FROM (
                        SELECT 
                            CASE 
                                WHEN t = CAST(:old AS ltree) THEN CAST(:new AS ltree)
                                WHEN t <@ CAST(:old AS ltree) THEN CAST(:new AS ltree) || subpath(t, nlevel(CAST(:old AS ltree)))
                                ELSE t 
                            END AS t
                        FROM unnest(tags) AS t
                        UNION
                        SELECT unnest(CAST(:new_ancestors AS ltree[])) AS t
                    ) AS combined
                ),
                -- 2. Clean old branch from JSONB and merge all new vectors
                tags_embeddings = (
                    SELECT jsonb_object_agg(key, value)
                    FROM jsonb_each(tags_embeddings)
                    WHERE NOT (CAST(key AS ltree) <@ CAST(:old AS ltree))
                ) || CAST(:new_embeddings AS jsonb)
            WHERE id = :id
              AND EXISTS (SELECT 1 FROM unnest(tags) AS t WHERE t <@ CAST(:old AS ltree))
            RETURNING tags::text[];
        """)
        
        result = await self.db.execute(query, {
            "id": workspace_id,
            "old": old_path,
            "new": new_path,
            "new_ancestors": new_ancestors,
            "new_embeddings": json.dumps(new_branch_embeddings)
        })
        
        updated_tags = result.scalar_one_or_none()
        if updated_tags is None:
            res = await self.db.execute(text("SELECT tags::text[] FROM workspaces WHERE id = :id"), {"id": workspace_id})
            return res.scalar_one_or_none() or []
        return updated_tags