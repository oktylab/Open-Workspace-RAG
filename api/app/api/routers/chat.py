import json, uuid
from fastapi.responses import StreamingResponse
from fastapi import APIRouter
from app.api.dependencies.repositories import ChunkRepositoryDep
from app.api.dependencies.auth import PublicWorkspaceDep
from app.utils.vector import embed_chunks
from app.utils.text import get_language_enum, rerank_texts
from app.utils.llm import stream_llm_generate, llm_generate

router = APIRouter()


#################################################################################################
#################################################################################################
async def prepare_rag_prompt(
    query: str, 
    workspace_id: uuid.UUID, 
    chunk_repo: ChunkRepositoryDep
) -> str | None:
    
    q_lang = get_language_enum(query)
    question_vector = embed_chunks([query], is_query=True)[0]

    relevant_docs = await chunk_repo.search_with_window(
        workspace_id=workspace_id,
        lang=q_lang,
        question_vector=question_vector,
        limit=10, 
        window_size=3
    )
    
    if not relevant_docs:
        return None

    doc_texts = [doc['content'] for doc in relevant_docs]
    rerank_results = rerank_texts(query=query, texts=doc_texts)

    top_docs = rerank_results[:2]
    context_text = "\n\n".join([doc['text'] for doc in top_docs])

    return f"""
    Answer the question based on the context below. 
    If the answer isn't in the context, say you don't know.
    
    Context:
    {context_text}

    Question: {query}

    Answer:
    """



#################################################################################################
#################################################################################################
@router.post("/ask")
async def ask_question(
    db_workspace: PublicWorkspaceDep,
    query: str, 
    chunk_repo: ChunkRepositoryDep
):
    prompt = await prepare_rag_prompt(query, db_workspace.id, chunk_repo)
    
    if not prompt:
        return {"content": "No info found."}

    response = await llm_generate(prompt=prompt)
    return {"content": response['response']}

#################################################################################################
#################################################################################################
@router.post("/ask/stream")
async def ask_question_stream(
    db_workspace: PublicWorkspaceDep,
    query: str, 
    chunk_repo: ChunkRepositoryDep
):
    prompt = await prepare_rag_prompt(query, db_workspace.id, chunk_repo)
    
    if not prompt:
        async def empty_gen():
            yield f"data: {json.dumps({'content': 'No info found.'})}\n\n"
        return StreamingResponse(empty_gen(), media_type="text/event-stream")

    async def event_generator():
        async for chunk in stream_llm_generate(prompt=prompt):
            data = json.dumps({"content": chunk['response']})
            yield f"data: {data}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")