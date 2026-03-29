from typing import AsyncGenerator

import aioboto3
import redis.asyncio as aioredis
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.secrets import secrets



################################################################################
# ─── PostgreSQL ───────────────────────────────────────────────────────────────
################################################################################
_engine = create_async_engine(secrets.DATABASE_URL, echo=False)
_AsyncSessionLocal = async_sessionmaker(bind=_engine, expire_on_commit=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with _AsyncSessionLocal() as session:
        yield session

################################################################################
# ─── Redis ────────────────────────────────────────────────────────────────────
################################################################################
_redis_client = aioredis.from_url(
    secrets.REDIS_URL,
    encoding="utf-8",
    decode_responses=True,
)

async def get_redis() -> AsyncGenerator[aioredis.Redis, None]:
    yield _redis_client


################################################################################
# ─── S3 / SeaweedFS ───────────────────────────────────────────────────────────
################################################################################
_s3_session = aioboto3.Session(
    aws_access_key_id=secrets.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=secrets.AWS_SECRET_ACCESS_KEY,
    region_name="us-east-1",
)

async def get_s3() -> AsyncGenerator:
    async with _s3_session.client("s3", endpoint_url=secrets.SEAWEEDFS_S3_URL) as s3:
        yield s3
