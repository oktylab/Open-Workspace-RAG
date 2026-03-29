from __future__ import annotations
import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import String, ForeignKey, DateTime, UniqueConstraint, Enum, text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.associationproxy import association_proxy, AssociationProxy
from sqlalchemy.sql import func

from app.models.base import Base
from app.models.types import PydanticListType
from app.schemas.enums import LanguageEnum
from app.schemas.document import DocumentSuggestion

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.chunk import Chunk
    from app.models.workspace import Workspace
    from app.models.job_document import JobDocument
    from app.models.job import Job
    from app.models.tag import Tag

class Document(Base):
    __tablename__ = "documents"

    __table_args__ = (
        UniqueConstraint("workspace_id", "url", name="uq_workspace_url"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    is_approved: Mapped[bool] = mapped_column(Boolean, nullable=False, index=True, default=True, server_default=text("true"))

    url: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    lang: Mapped[LanguageEnum] = mapped_column(Enum(LanguageEnum, name="language_enum"), nullable=False, index=True)

    tag_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("tags.id", ondelete="SET NULL"), nullable=True, index=True)
    suggestions: Mapped[List[DocumentSuggestion]] = mapped_column(
        PydanticListType(DocumentSuggestion),
        nullable=False,
        default=list,
        server_default=text("'[]'::jsonb")
    )

    content_hash: Mapped[str] = mapped_column(String, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False)
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="documents")
    tag: Mapped[Optional["Tag"]] = relationship("Tag", back_populates="documents", foreign_keys=[tag_id])


    chunks: Mapped[List["Chunk"]] = relationship("Chunk", back_populates="document", cascade="all, delete-orphan")


    document_jobs: Mapped[list["JobDocument"]] = relationship(
        "JobDocument", 
        back_populates="document", 
        cascade="all, delete-orphan"
    )

    jobs: AssociationProxy[list["Job"]] = association_proxy(
        "document_jobs", 
        "job"
    )