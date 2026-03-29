from pydantic import BaseModel, ConfigDict, field_validator, Field
from uuid import UUID
from typing import Optional, List


class TagResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    path: str
    label: str
    description: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

    @field_validator("path", mode="before")
    @classmethod
    def transform_ltree_to_str(cls, v):
        if v is None:
            return None
        return str(v)


class TagTreeNode(BaseModel):
    id: UUID
    path: str
    label: str
    description: Optional[str] = None
    children: List["TagTreeNode"] = []
    model_config = ConfigDict(from_attributes=True)

    @field_validator("path", mode="before")
    @classmethod
    def transform_ltree_to_str(cls, v):
        if v is None:
            return None
        return str(v)


TagTreeNode.model_rebuild()


class TagCreate(BaseModel):
    path: str = Field(..., pattern=r"^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)*$")
    label: Optional[str] = None
    description: Optional[str] = None


class TagUpdate(BaseModel):
    label: Optional[str] = None
    description: Optional[str] = None
