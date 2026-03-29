import uuid
from itertools import islice
from typing import List
from taskiq import TaskiqDepends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.taskiq.broker import broker
from app.taskiq.dependencies.repositories import ChunkRepositoryDep, DocumentRepositoryDep
from app.core.connections import get_db
from app.schemas.enums import LanguageEnum
from app.utils.text import get_content_hash, chunk_text
from app.utils.vector import embed_chunks


##################################################################################
##################################################################################
class PagePayload(BaseModel):
    url: str
    content: str
    title: str
    lang: LanguageEnum
    workspace_id: str
    content_hash: str


##################################################################################
##################################################################################
BATCH_SIZE = 10

def _batched(iterable, n):
    it = iter(iterable)
    while chunk := list(islice(it, n)):
        yield chunk


##################################################################################
##################################################################################
@broker.task
async def process_and_store_documents_task(
    pages: List[PagePayload],
    job_id: uuid.UUID,
    document_repository: DocumentRepositoryDep,
    chunk_repository: ChunkRepositoryDep,
    db: AsyncSession = TaskiqDepends(get_db),
) -> None:

    if not pages:
        return

    workspace_id = uuid.UUID(pages[0].workspace_id)
    processed_document_ids = []

    for page in pages:
        db_document = await document_repository.upsert_for_job(
            workspace_id=workspace_id,
            url=page.url,
            title=page.title,
            lang=page.lang,
            content_hash=get_content_hash(page.content),
            job_id=job_id
        )
        processed_document_ids.append(db_document.id)

        await db.flush()

        await chunk_repository.delete_by_document_id(db_document.id)
        text_chunks = chunk_text(text=page.content, window_size=400, overlap=50)

        if not text_chunks:
            continue

        chunk_vectors = embed_chunks(text_chunks)

        chunk_records = [
            {
                "document_id": db_document.id,
                "chunk_index": index,
                "content": content,
                "embedding": vector,
            }
            for index, (content, vector) in enumerate(zip(text_chunks, chunk_vectors))
        ]
        chunk_repository.create_many(chunk_records)

    if processed_document_ids:
        await db.flush()
        await document_repository.bulk_label_documents(
            document_ids=processed_document_ids,
        )

    await db.commit()
