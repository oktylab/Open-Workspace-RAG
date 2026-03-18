from __future__ import annotations
import uuid
from typing import List

from sqlalchemy import String, ForeignKey, UniqueConstraint, ARRAY, text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.models.base import Base
from sqlalchemy_utils import LtreeType
from app.core.security import generate_workspace_api_key

from typing import TYPE_CHECKING

if TYPE_CHECKING: 
    from app.models.organization import Organization
    from app.models.document import Document
    from app.models.job import Job

class Workspace(Base):
    __tablename__ = "workspaces"

    __table_args__ = (
        UniqueConstraint("organization_id", "slug", name="uq_organization_workspace_slug"),
        Index("idx_workspaces_tags_gist", "tags", postgresql_using="gist"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    organization_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False)
    
    api_key: Mapped[str] = mapped_column(
        String, 
        nullable=False, 
        unique=True, 
        index=True,
        default=generate_workspace_api_key
    )

    allowed_origins: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        nullable=False,
        server_default=text("'{}'::varchar[]")
    )
    
    slug: Mapped[str] = mapped_column(String, index=True, nullable=False)
    
    name: Mapped[str] = mapped_column(String, nullable=False)
    url: Mapped[str] = mapped_column(String, nullable=False)

    tags: Mapped[list[str]] = mapped_column(
        ARRAY(LtreeType), 
        nullable=False, 
        server_default=text("'{}'::ltree[]")
    )

    tags_embeddings: Mapped[dict] = mapped_column(JSONB, nullable=True)


    organization: Mapped["Organization"] = relationship("Organization", back_populates="workspaces")
    documents: Mapped[List["Document"]] = relationship("Document", back_populates="workspace", cascade="all, delete-orphan")
    jobs: Mapped[List["Job"]] = relationship("Job", back_populates="workspace", cascade="all, delete-orphan")