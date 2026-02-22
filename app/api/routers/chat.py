from ollama import Client
from fastapi import APIRouter, Depends, HTTPException
from langdetect import detect
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.enums import LanguageEnum
from app.core.embeddings import get_embedding_model
from app.repositories.organization import OrganizationRepository
from app.repositories.chunk import ChunkRepository
import json

router = APIRouter()


####################################################################################################################
####################################################################################################################
@router.post("/ask")
async def ask_question(
    org_slug: str, 
    question: str, 
    db: AsyncSession = Depends(get_db)
):

    org_repo = OrganizationRepository(db)
    chunk_repo = ChunkRepository(db)

    db_organiztion = await org_repo.get_by_slug(org_slug)
    if not db_organiztion:
        raise HTTPException(status_code=404, detail="Org not found")

    try:
        lang_code = detect(question).upper()
        q_lang = LanguageEnum[lang_code] if lang_code in LanguageEnum.__members__ else LanguageEnum.EN
    except:
        q_lang = LanguageEnum.EN

    model = get_embedding_model()
    question_vector = list(model.embed([question]))[0].tolist()

    return question_vector

    relevant_docs = await chunk_repo.search_with_window(
        org_id=db_organiztion.id,
        lang=q_lang,
        question_vector=question_vector,
        limit=5,
        window_size=3
    )
    
    if not relevant_docs:
        return {"answer": "No info found.", "sources": []}


    context_items = []
    for i, doc in enumerate(relevant_docs):
        context_items.append(f"Source: {doc['source']}\nContent: {doc['content']}")
    
    context_text = "\n\n---\n\n".join(context_items)
    
    prompt = f"""
    You are a professional assistant. Use the provided context to answer the question in {q_lang.value}.
    
    Instructions:
    1. The context below contains excerpts from documents.
    2. Read the full context chunks to understand the timeline (e.g., what was created vs. what was repealed).
    3. Return a JSON object with 'answer' and 'sources_used'.
    4. If the context mentions specific Resolution numbers, cite them.

    Context:
    {context_text}

    Question: {question}

    Constraint: Respond only in valid JSON.
    """


    client = Client(host='http://ollama:11434')
    response = client.generate(
        model="qwen2.5:1.5b", 
        prompt=prompt,
        format="json",
        options={"temperature": 0}
    )

    try:
        structured_data = json.loads(response['response'])
        return structured_data
    except Exception:
        return {
            "answer": response['response'],
            "error": "LLM failed to format JSON"
        }