import hashlib
import httpx
import trafilatura
from datetime import datetime
from langdetect import detect
from sqlalchemy.ext.asyncio import AsyncSession
from taskiq import TaskiqDepends

from app.taskiq.broker import broker
from app.core.database import get_db
from app.repositories.organization import OrganizationRepository
from app.repositories.document import DocumentRepository
from app.repositories.chunk import ChunkRepository
from app.models.enums import LanguageEnum
from app.models.chunk import Chunk
from app.core.embeddings import get_embedding_model

def get_language_enum(text: str) -> LanguageEnum:
    try:
        code = detect(text).upper()
        return LanguageEnum[code] if code in LanguageEnum.__members__ else LanguageEnum.EN
    except Exception:
        return LanguageEnum.EN

@broker.task
async def scrape_and_store_url_task(
    url: str, 
    org_slug: str, 
    db: AsyncSession = TaskiqDepends(get_db)
) -> dict:

    org_repo = OrganizationRepository(db)
    doc_repo = DocumentRepository(db)
    chunk_repo = ChunkRepository(db)

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    # 1. FETCHING LAYER
    async with httpx.AsyncClient(verify=False, headers=headers, timeout=30.0, follow_redirects=True) as client:
        try:
            resp = await client.get(url)
            
            # 🔥 CRITICAL FIX: Raise exception for 4xx and 5xx errors
            resp.raise_for_status() 

            # Fix encoding if missing
            if resp.encoding is None: 
                resp.encoding = 'utf-8'
                
            html = resp.text
            
        except httpx.HTTPStatusError as e:
            # Handle 404, 500, 503, etc. explicitly
            return {
                "status": "error", 
                "message": f"HTTP Error {e.response.status_code}: {e.response.reason_phrase}", 
                "url": url
            }
        except Exception as e:
            # Handle DNS errors, Timeouts, Connection Refused
            return {"status": "error", "message": f"Connection failed: {str(e)}", "url": url}

    # 2. EXTRACTION LAYER
    markdown = trafilatura.extract(
        html, 
        output_format="markdown", 
        include_tables=True, 
        include_images=False, 
        include_comments=False
    )
    
    # 🔥 CRITICAL FIX: Skip if content is empty or looks like a short error message
    # "503 Service Temporarily Unavailable" is about 30-40 chars.
    if not markdown or len(markdown.strip()) < 100:
        return {
            "status": "skipped", 
            "message": "Content too short or empty (likely error page or JS-blocked)", 
            "url": url
        }

    # 3. DATABASE LAYER (Repositories)
    org = await org_repo.get_by_slug(org_slug)
    if not org:
        return {"status": "error", "message": "Org not found"}

    content_hash = hashlib.md5(markdown.encode('utf-8')).hexdigest()
    metadata = trafilatura.extract_metadata(html)
    title = metadata.title if metadata and metadata.title else "Untitled"
    
    existing_doc = await doc_repo.get_by_url_and_org(url, org.id)

    if existing_doc:
        if existing_doc.content_hash == content_hash:
            return {"status": "skipped", "message": "Unchanged", "url": url}
        
        await chunk_repo.delete_by_document_id(existing_doc.id)
        existing_doc.content_hash = content_hash
        existing_doc.updated_at = datetime.now()
        doc_id = existing_doc.id
    else:
        new_doc = doc_repo.create(
            organization_id=org.id, 
            url=url, 
            title=title, 
            lang=get_language_enum(markdown), 
            content_hash=content_hash,
            tags=[], 
            suggestions=[]
        )
        await db.flush()
        doc_id = new_doc.id

    # 4. EMBEDDING LAYER
    words = markdown.split()
    # Safely handle very short texts that might split into nothing
    if not words:
        return {"status": "skipped", "message": "Markdown contained no words", "url": url}

    chunks_text = [" ".join(words[i : i + 400]) for i in range(0, len(words), 400)]
    
    model = get_embedding_model()
    vectors = list(model.embed(chunks_text))

    chunks_data = [
        {
            "document_id": doc_id,
            "chunk_index": i,
            "content": txt,
            "embedding": vec.tolist()
        }
        for i, (txt, vec) in enumerate(zip(chunks_text, vectors))
    ]
    
    chunk_repo.create_many(chunks_data)
    await db.commit()

    return {"status": "success", "chunks": len(chunks_data), "url": url}