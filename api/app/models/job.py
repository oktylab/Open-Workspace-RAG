import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.associationproxy import association_proxy, AssociationProxy
from sqlalchemy.sql import func
from app.models.base import Base
from app.schemas.enums import JobStatus, JobDocumentAction
from app.models.types import PydanticType
from app.schemas.job_params import (
    URLJobConfig, PDFJobConfig, URLJobResult, PDFJobResult,
    JobConfigAdapter, JobResultAdapter,
)

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.workspace import Workspace
    from app.models.job_document import JobDocument
    from app.models.document import Document


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    task_id: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[JobStatus] = mapped_column(SAEnum(JobStatus, name="job_status_enum"), default=JobStatus.PENDING, nullable=False)
    
    config: Mapped[Optional[URLJobConfig | PDFJobConfig]] = mapped_column(PydanticType(JobConfigAdapter), nullable=True)
    result: Mapped[Optional[URLJobResult | PDFJobResult]] = mapped_column(PydanticType(JobResultAdapter), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id", ondelete="CASCADE"), index=True, nullable=False)
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="jobs")



    job_documents: Mapped[list["JobDocument"]] = relationship(
        "JobDocument", 
        back_populates="job", 
        cascade="all, delete-orphan"
    )

    documents: AssociationProxy[list["Document"]] = association_proxy(
        "job_documents", 
        "document",
        creator=lambda doc: JobDocument(document=doc, action=JobDocumentAction.CREATED)
    )