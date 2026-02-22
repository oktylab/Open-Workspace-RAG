import uuid
from typing import List, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, or_
from app.repositories.base_repository import BaseRepository
from app.models.chunk import Chunk
from app.models.document import Document
from app.models.enums import LanguageEnum

class ChunkRepository(BaseRepository[Chunk]):
    
    #################################################################################
    #################################################################################
    def __init__(self, db: AsyncSession):
        super().__init__(Chunk, db)

    #################################################################################
    #################################################################################
    async def delete_by_document_id(self, document_id: uuid.UUID) -> None:
        await self.db.execute(
            delete(self.model).where(self.model.document_id == document_id)
        )

    #################################################################################
    #################################################################################
    def create_many(self, chunks_data: List[Dict[str, Any]]) -> None:
        models_to_insert = [
            self.model(
                document_id=data["document_id"],
                chunk_index=data["chunk_index"],
                content=data["content"],
                embedding=data["embedding"]
            )
            for data in chunks_data
        ]
        self.db.add_all(models_to_insert)

    #################################################################################
    #################################################################################
    async def search_with_window(
        self, 
        org_id: uuid.UUID, 
        lang: LanguageEnum, 
        question_vector: list[float], 
        limit: int = 5,
        window_size: int = 2
    ) -> List[Dict[str, Any]]:
        """
        1. Finds the top relevant chunks by vector similarity.
        2. Expands the selection to include neighboring chunks (context window).
        3. Returns grouped and ordered content by document.
        """

        seed_query = (
            select(self.model.document_id, self.model.chunk_index)
            .join(Document, self.model.document_id == Document.id)
            .where(
                Document.organization_id == org_id, 
                Document.lang == lang
            )
            .order_by(self.model.embedding.cosine_distance(question_vector))
            .limit(limit)
        )
        
        seed_results = await self.db.execute(seed_query)
        seeds = seed_results.all()

        if not seeds:
            return []

        conditions = []
        for doc_id, idx in seeds:
            conditions.append(
                (self.model.document_id == doc_id) & 
                (self.model.chunk_index >= idx - window_size) & 
                (self.model.chunk_index <= idx + window_size)
            )

        window_query = (
            select(self.model, Document)
            .join(Document, self.model.document_id == Document.id)
            .where(or_(*conditions))
            .order_by(self.model.document_id, self.model.chunk_index)
        )

        result = await self.db.execute(window_query)
        rows = result.all()

        grouped_results = {}
        
        for chunk, doc in rows:
            if doc.id not in grouped_results:
                grouped_results[doc.id] = {
                    "source": doc.url,
                    "title": doc.title,
                    "chunks": []
                }
            grouped_results[doc.id]["chunks"].append(chunk.content)

        final_output = []
        for doc_data in grouped_results.values():
            full_text = " ".join(doc_data["chunks"])
            final_output.append({
                "source": doc_data["source"],
                "title": doc_data["title"],
                "content": full_text
            })

        return final_output