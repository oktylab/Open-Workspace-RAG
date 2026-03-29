from pydantic import BaseModel, ConfigDict, Field, field_validator
from uuid import UUID
from typing import Optional, List

#############################################################################
#############################################################################
class WorkspaceCreate(BaseModel):
    name: str
    url: str
    slug: str
    allowed_origins: List[str] = []

    @field_validator("slug")
    @classmethod
    def slug_to_lower(cls, v: str) -> str:
        return v.lower().strip()

#############################################################################
#############################################################################
class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    slug: Optional[str] = None
    allowed_origins: Optional[List[str]] = None

    regenerate_api_key: Optional[bool] = Field(default=False)

    @field_validator("slug")
    @classmethod
    def slug_to_lower(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return v.lower().strip()
        return v

#############################################################################
#############################################################################
class WorkspaceResponse(BaseModel):
    id: UUID
    organization_id: UUID
    name: str
    url: str
    slug: str

    api_key: str
    allowed_origins: List[str] = []

    model_config = ConfigDict(from_attributes=True)