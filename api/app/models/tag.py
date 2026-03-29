from __future__ import annotations
import uuid
from typing import List, Optional, TYPE_CHECKING

from sqlalchemy import String, ForeignKey, UniqueConstraint, Index, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy_utils import LtreeType
from pgvector.sqlalchemy import Vector

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.workspace import Workspace
    from app.models.document import Document


class Tag(Base):
    __tablename__ = "tags"

    __table_args__ = (
        UniqueConstraint("workspace_id", "path", name="uq_tag_workspace_path"),
        Index("idx_tags_path_gist", "path", postgresql_using="gist"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False)

    path: Mapped[str] = mapped_column(LtreeType, nullable=False)
    label: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    embedding: Mapped[Optional[Vector]] = mapped_column(Vector(1024), nullable=True)

    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="tags")
    documents: Mapped[List["Document"]] = relationship(
        "Document",
        back_populates="tag",
        foreign_keys="[Document.tag_id]"
    )
