import json, uuid
from fastapi.responses import StreamingResponse
from fastapi import APIRouter, Query
from app.api.dependencies.repositories import ChunkRepositoryDep, SessionRepositoryDep
from app.api.dependencies.auth import PublicWorkspaceDep
from app.utils.vector import embed_chunks
from app.utils.text import get_language_enum
from app.utils.llm import stream_llm_chat, llm_chat, get_llm_messages
from typing import List, Optional, Tuple
from ollama import Message
from app.schemas.chat import  (
    ChatDebug, 
    DocumentDebug, 
    ChatResponse, 
    AskRequest, 
    SessionTurn,
    SessionChunk,
    SessionDebug, 
    SessionResponse
)

router = APIRouter()


#################################################################################################
#################################################################################################
async def resolve_session_id(
    session_id: Optional[uuid.UUID],
    workspace_id: uuid.UUID,
    session_repo: SessionRepositoryDep,
) -> str:
    if session_id is None:
        return str(uuid.uuid4())
    is_exists = await session_repo.session_exists(
        workspace_id=workspace_id, 
        session_id=str(session_id)
    )
    if not is_exists:
        return str(uuid.uuid4())
    return str(session_id)


#################################################################################################
#################################################################################################
async def prepare_rag_data(
    request: AskRequest,
    session_id: str,
    workspace_id: uuid.UUID,
    chunk_repo: ChunkRepositoryDep,
    session_repo: SessionRepositoryDep
) -> Tuple[List[Message] | None, ChatDebug]:

    session_turns = await session_repo.get_turns(
        workspace_id=workspace_id,
        session_id=session_id,
        skip=0,
        limit=5,
    )

    q_lang = get_language_enum(request.query)
    question_vector = embed_chunks([request.query])[0]

    scores, db_documents = await chunk_repo.search(
        workspace_id=workspace_id,
        lang=q_lang,
        question_vector=question_vector,
        limit=5,
        tags=request.tags
    )

    if not db_documents:
        if not session_turns:
            return None, None
        db_documents = []
        scores = {}

    db_chunks = [c for d in db_documents for c in d.chunks]
    db_chunks.sort(key=lambda c: scores.get(c.id, 0.0), reverse=True)

    docs_debug = []
    for doc in db_documents:
        for chunk in doc.chunks:
            chunk.score = scores.get(chunk.id, 0.0)
        docs_debug.append(DocumentDebug.model_validate(doc))

    docs_debug.sort(key=lambda d: max((c.score for c in d.chunks), default=0), reverse=True)

    chat_debug = ChatDebug(
        documents=docs_debug,
        session=SessionDebug(
            session_id=uuid.UUID(session_id),
            workspace_id=workspace_id,
            turns=session_turns
        )
    )

    prompt_messages = get_llm_messages(
        lang=q_lang,
        facts=[c.content for c in db_chunks],
        session_turns=session_turns,
        query=request.query
    )

    return prompt_messages, chat_debug

#################################################################################################
#################################################################################################
async def save_session_turn(
    session_repo: SessionRepositoryDep,
    workspace_id: uuid.UUID,
    session_id: str,
    query: str,
    response: str,
    debug_docs: List[DocumentDebug]
):
    turn_chunks = [
        SessionChunk(
            id=c.id,
            document_id=doc.id,
            content=c.content,
            score=c.score
        )
        for doc in debug_docs for c in doc.chunks
    ]

    turn = SessionTurn(
        query=query,
        response=response,
        chunks=turn_chunks
    )
    
    await session_repo.add_turn(
        workspace_id=workspace_id, 
        session_id=session_id,
        turn=turn
    )


#################################################################################################
#################################################################################################
@router.get("/{session_id}", response_model=SessionResponse)
async def get_chat_history(
    session_id: uuid.UUID,
    db_workspace: PublicWorkspaceDep,
    session_repo: SessionRepositoryDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
):
    turns = await session_repo.get_turns(
        workspace_id=db_workspace.id,
        session_id=str(session_id),
        skip=skip,
        limit=limit
    )

    await session_repo.refresh_ttl(db_workspace.id, str(session_id))

    return {
        "session_id": session_id,
        "workspace_id": db_workspace.id,
        "turns": turns
    }

#################################################################################################
#################################################################################################
@router.post("/ask", response_model=ChatResponse, response_model_exclude_none=True)
async def ask_question(
    db_workspace: PublicWorkspaceDep,
    request: AskRequest,
    chunk_repo: ChunkRepositoryDep,
    session_repo: SessionRepositoryDep,
):
    session_id = await resolve_session_id(
        session_id=request.session_id, 
        workspace_id=db_workspace.id, 
        session_repo=session_repo
    )

    prompt_messages, chat_debug = await prepare_rag_data(
        request=request,
        session_id=session_id,
        workspace_id=db_workspace.id,
        chunk_repo=chunk_repo,
        session_repo=session_repo
    )

    if not prompt_messages:
        return {
            "session_id": session_id, 
            "content": "No info found.", 
            "debug": chat_debug if request.debug else None
        }

    response = await llm_chat(messages=prompt_messages)
    content = response.message.content

    await save_session_turn(
        session_repo=session_repo,
        workspace_id=db_workspace.id,
        session_id=session_id,
        query=request.query,
        response=content,
        debug_docs=chat_debug.documents
    )

    return {
        "session_id": session_id,
        "content": content,
        "debug": chat_debug if request.debug else None
    }

#################################################################################################
#################################################################################################
@router.post("/ask/stream")
async def ask_question_stream(
    db_workspace: PublicWorkspaceDep,
    chunk_repo: ChunkRepositoryDep,
    session_repo: SessionRepositoryDep,
    request: AskRequest
):
    session_id = await resolve_session_id(
        session_id=request.session_id, 
        workspace_id=db_workspace.id, 
        session_repo=session_repo
    )

    prompt_messages, chat_debug = await prepare_rag_data(
        request=request,
        session_id=session_id,
        workspace_id=db_workspace.id,
        chunk_repo=chunk_repo,
        session_repo=session_repo
    )

    async def event_generator():
        yield f"data: {json.dumps({'session_id': session_id})}\n\n"

        if request.debug and chat_debug:
            yield f"data: {json.dumps({'debug': chat_debug.model_dump(mode='json')})}\n\n"

        if not prompt_messages:
            yield f"data: {json.dumps({'content': 'No info found.'})}\n\n"
            return

        full_content = ""
        async for chunk in stream_llm_chat(messages=prompt_messages):
            content_chunk = chunk.message.content
            full_content += content_chunk
            yield f"data: {json.dumps({'content': content_chunk})}\n\n"

        await save_session_turn(
            session_repo=session_repo,
            workspace_id=db_workspace.id,
            session_id=session_id,
            query=request.query,
            response=full_content,
            debug_docs=chat_debug.documents
        )

    return StreamingResponse(event_generator(), media_type="text/event-stream")