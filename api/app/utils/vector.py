import time
from typing import List
from app.core.settings import settings
from app.core.secrets import secrets

# import ollama  # disabled: replaced with Mistral
from mistralai.client import Mistral


# def embed_chunks(texts: List[str]) -> List[List[float]]:
#     if not texts:
#         return []
#
#     client = ollama.Client(host=settings.OLLAMA_HOST)
#
#     response = client.embed(
#         model=settings.OLLAMA_EMBEDDING_MODEL,
#         input=texts
#     )
#
#     return response['embeddings']


MISTRAL_EMBED_BATCH = 32
MISTRAL_EMBED_SLEEP = 1.1  # free tier: 1 req/sec


def embed_chunks(texts: List[str]) -> List[List[float]]:
    if not texts:
        return []

    client = Mistral(api_key=secrets.MISTRAL_API_KEY)

    embeddings: List[List[float]] = []
    for i in range(0, len(texts), MISTRAL_EMBED_BATCH):
        batch = texts[i:i + MISTRAL_EMBED_BATCH]
        response = client.embeddings.create(
            model=settings.MISTRAL_EMBEDDING_MODEL,
            inputs=batch,
        )
        embeddings.extend([d.embedding for d in response.data])
        if i + MISTRAL_EMBED_BATCH < len(texts):
            time.sleep(MISTRAL_EMBED_SLEEP)

    return embeddings
