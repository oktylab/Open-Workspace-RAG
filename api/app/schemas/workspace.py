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

    tags: List[str] = []
    # tags_embeddings: dict = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)

    @field_validator("tags", mode="before")
    @classmethod
    def transform_ltree_to_str(cls, v):
        if v is None:
            return []
        return [str(tag) for tag in v]