from typing import Annotated

from aiobotocore.client import AioBaseClient
from fastapi import Depends
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.connections import get_db, get_redis, get_s3
from app.repositories.chunk import ChunkRepository
from app.repositories.document import DocumentRepository
from app.repositories.job import JobRepository
from app.repositories.organization import OrganizationRepository
from app.repositories.rating import RatingRepository
from app.repositories.session import SessionRepository
from app.repositories.storage import StorageRepository
from app.repositories.tag import TagRepository
from app.repositories.workspace import WorkspaceRepository


def get_organization_repo(db: AsyncSession = Depends(get_db)) -> OrganizationRepository:
    return OrganizationRepository(db)

def get_workspace_repo(db: AsyncSession = Depends(get_db)) -> WorkspaceRepository:
    return WorkspaceRepository(db)

def get_document_repo(db: AsyncSession = Depends(get_db)) -> DocumentRepository:
    return DocumentRepository(db)

def get_chunk_repo(db: AsyncSession = Depends(get_db)) -> ChunkRepository:
    return ChunkRepository(db)

def get_job_repo(db: AsyncSession = Depends(get_db)) -> JobRepository:
    return JobRepository(db)

def get_rating_repo(db: AsyncSession = Depends(get_db)) -> RatingRepository:
    return RatingRepository(db)

def get_session_repo(redis: Redis = Depends(get_redis)) -> SessionRepository:
    return SessionRepository(redis)

def get_storage_repo(client: AioBaseClient = Depends(get_s3)) -> StorageRepository:
    return StorageRepository(client)

def get_tag_repo(db: AsyncSession = Depends(get_db)) -> TagRepository:
    return TagRepository(db)


OrganizationRepositoryDep = Annotated[OrganizationRepository, Depends(get_organization_repo)]
WorkspaceRepositoryDep    = Annotated[WorkspaceRepository,    Depends(get_workspace_repo)]
DocumentRepositoryDep     = Annotated[DocumentRepository,     Depends(get_document_repo)]
ChunkRepositoryDep        = Annotated[ChunkRepository,        Depends(get_chunk_repo)]
JobRepositoryDep          = Annotated[JobRepository,          Depends(get_job_repo)]
RatingRepositoryDep       = Annotated[RatingRepository,       Depends(get_rating_repo)]
SessionRepositoryDep      = Annotated[SessionRepository,      Depends(get_session_repo)]
StorageRepositoryDep      = Annotated[StorageRepository,      Depends(get_storage_repo)]
TagRepositoryDep          = Annotated[TagRepository,          Depends(get_tag_repo)]
