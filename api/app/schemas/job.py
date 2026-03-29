# app/schemas/job.py
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from typing import Annotated, List, Optional, Union
from app.schemas.enums import JobStatus
from app.schemas.job_params import (
    URLJobConfig, PDFJobConfig,
    URLJobResult, PDFJobResult,
    JobConfig, JobResult,
)

#######################################################################
#######################################################################
class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    task_id: Optional[str] = None
    workspace_id: UUID
    status: JobStatus
    created_at: datetime
    updated_at: datetime
    config: Optional[JobConfig] = None
    result: Optional[JobResult] = None

class PaginatedJobResponse(BaseModel):
    items: List[JobResponse]
    total: int
    skip: int
    limit: int
