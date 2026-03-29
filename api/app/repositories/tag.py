import uuid
from typing import Optional, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from sqlalchemy_utils import Ltree

from app.repositories.base_repository import BaseRepository
from app.models.tag import Tag
from app.schemas.tag import TagTreeNode
from app.utils.vector import embed_chunks


class TagRepository(BaseRepository[Tag]):

    def __init__(self, db: AsyncSession):
        super().__init__(Tag, db)

    #############################################################################
    #############################################################################
    async def get_by_workspace(self, workspace_id: uuid.UUID) -> List[Tag]:
        stmt = (
            select(self.model)
            .where(self.model.workspace_id == workspace_id)
            .order_by(self.model.path)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    #############################################################################
    #############################################################################
    async def get_by_path(self, workspace_id: uuid.UUID, path: str) -> Optional[Tag]:
        stmt = select(self.model).where(
            self.model.workspace_id == workspace_id,
            self.model.path == Ltree(path)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    #############################################################################
    #############################################################################
    async def get_subtree(self, workspace_id: uuid.UUID, path: str) -> List[Tag]:
        """Get the tag and all its descendants, ordered by path."""
        stmt = (
            select(self.model)
            .where(self.model.workspace_id == workspace_id)
            .where(text("path <@ CAST(:path AS ltree)").bindparams(path=path))
            .order_by(self.model.path)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    #############################################################################
    #############################################################################
    async def upsert_path(
        self,
        workspace_id: uuid.UUID,
        path: str,
        label: Optional[str] = None,
        description: Optional[str] = None,
    ) -> List[Tag]:
        """
        Ensure the tag at `path` and all its ancestor tags exist.
        `label` applies only to the leaf tag; ancestors use their last path segment.
        Returns the list of tags for each path level, from root to leaf.
        """
        parts = path.split(".")
        ancestor_paths = [".".join(parts[:i + 1]) for i in range(len(parts))]

        result_tags: List[Tag] = []
        for ancestor_path in ancestor_paths:
            is_leaf = ancestor_path == path
            existing = await self.get_by_path(workspace_id, ancestor_path)
            if existing:
                if is_leaf:
                    if label is not None:
                        existing.label = label
                    if description is not None:
                        existing.description = description
                result_tags.append(existing)
                continue

            segment = ancestor_path.split(".")[-1]
            tag_label = label if is_leaf and label else segment
            vectors = embed_chunks([tag_label])
            tag = Tag(
                workspace_id=workspace_id,
                path=Ltree(ancestor_path),
                label=tag_label,
                embedding=vectors[0],
                description=description if is_leaf else None,
            )
            self.db.add(tag)
            await self.db.flush()
            result_tags.append(tag)

        return result_tags

    #############################################################################
    #############################################################################
    async def update_tag(
        self,
        workspace_id: uuid.UUID,
        path: str,
        label: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Optional[Tag]:
        """Update label and/or description of an existing tag."""
        tag = await self.get_by_path(workspace_id, path)
        if not tag:
            return None
        if label is not None:
            tag.label = label
            vectors = embed_chunks([label])
            tag.embedding = vectors[0]
        if description is not None:
            tag.description = description
        return tag

    #############################################################################
    #############################################################################
    async def get_tree(self, workspace_id: uuid.UUID) -> List[TagTreeNode]:
        """Return all tags as a nested tree, roots first."""
        tags = await self.get_by_workspace(workspace_id)

        nodes: dict[str, TagTreeNode] = {}
        for tag in tags:
            path_str = str(tag.path)
            nodes[path_str] = TagTreeNode(
                id=tag.id,
                path=path_str,
                label=tag.label,
                description=tag.description,
            )

        roots: List[TagTreeNode] = []
        for path_str, node in nodes.items():
            parts = path_str.split(".")
            if len(parts) == 1:
                roots.append(node)
            else:
                parent_path = ".".join(parts[:-1])
                parent = nodes.get(parent_path)
                if parent:
                    parent.children.append(node)
                else:
                    roots.append(node)

        return roots

    #############################################################################
    #############################################################################
    async def delete_subtree(self, workspace_id: uuid.UUID, path: str) -> None:
        """
        Delete the tag at `path` and all its descendants.
        Documents referencing deleted tags will have tag_id set to NULL via FK ON DELETE SET NULL.
        """
        query = text("""
            DELETE FROM tags
            WHERE workspace_id = :workspace_id
              AND path <@ CAST(:path AS ltree)
        """)
        await self.db.execute(query, {"workspace_id": workspace_id, "path": path})

