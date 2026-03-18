from ollama import AsyncClient
from typing import AsyncGenerator, Dict, Any



OLLAMA_HOST = 'http://ollama:11434'
LLM_MODEL = "qwen2.5:1.5b"
LLM_OPTIONS = {
    "temperature": 0,
    "num_thread": 8,
    "num_ctx": 4096,
    "num_batch": 512
}


#######################################################################
#######################################################################
async def stream_llm_generate(prompt: str) -> AsyncGenerator[Dict[str, Any], None]:
    client = AsyncClient(host=OLLAMA_HOST)    
    async for chunk in await client.generate(
        model=LLM_MODEL, 
        prompt=prompt,
        options=LLM_OPTIONS,
        stream=True 
    ):
        yield chunk

#######################################################################
#######################################################################
async def llm_generate(prompt: str) -> Dict[str, Any]:
    client = AsyncClient(host=OLLAMA_HOST)
    return await client.generate(
        model=LLM_MODEL, 
        prompt=prompt,
        options=LLM_OPTIONS,
        stream=False
    )