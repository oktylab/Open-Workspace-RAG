from app.schemas.enums import LanguageEnum
from ollama import Message  # kept as type alias (TypedDict-like) for backward compat
# from ollama import AsyncClient, Options, ChatResponse  # disabled: replaced with Groq
from typing import AsyncGenerator, List, Any
from app.schemas.chat import SessionTurn
from app.core.settings import settings
from app.core.secrets import secrets
from groq import AsyncGroq
import math


# LLM_OPTIONS = Options(
#     temperature=0,
#     num_thread=8,
#     num_ctx=8192*2,
#     num_batch=512,
#     use_mlock=True,
# )


class _GroqChunkMessage:
    def __init__(self, content: str):
        self.content = content


class _GroqChunk:
    def __init__(self, content: str):
        self.message = _GroqChunkMessage(content)


#######################################################################
#######################################################################
async def stream_llm_chat(messages: List[Message]) -> AsyncGenerator[Any, None]:
    # client = AsyncClient(host=settings.OLLAMA_HOST)
    # async for chunk in await client.chat(
    #     model=settings.OLLAMA_LLM_MODEL,
    #     messages=messages,
    #     options=LLM_OPTIONS,
    #     stream=True,
    #     logprobs=True
    # ):
    #     yield chunk

    client = AsyncGroq(api_key=secrets.GROQ_API_KEY)
    stream = await client.chat.completions.create(
        model=settings.GROQ_LLM_MODEL,
        messages=[{"role": m["role"], "content": m["content"]} for m in messages],
        temperature=0,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content or ""
        yield _GroqChunk(delta)

#######################################################################
#######################################################################
async def llm_chat(messages: List[Message]) -> Any:
    # client = AsyncClient(host=settings.OLLAMA_HOST)
    # return await client.chat(
    #     model=settings.OLLAMA_LLM_MODEL,
    #     messages=messages,
    #     options=LLM_OPTIONS,
    #     stream=False,
    #     logprobs=True
    # )

    client = AsyncGroq(api_key=secrets.GROQ_API_KEY)
    response = await client.chat.completions.create(
        model=settings.GROQ_LLM_MODEL,
        messages=[{"role": m["role"], "content": m["content"]} for m in messages],
        temperature=0,
        stream=False,
    )
    return _GroqChunk(response.choices[0].message.content or "")


#######################################################################
#######################################################################
def get_llm_messages(
    lang: LanguageEnum,
    facts: List[str],
    session_turns: List[SessionTurn],
    query: str
) -> List[Message]:

    facts_text = ",".join(facts)

    instructions = {
        LanguageEnum.EN: f"""
Answer the user's question using the FACTS provided below.
Use the conversation history to understand context or pronouns (like "it", "they", "before").
If the answer is not contained within the facts or history, strictly state that you do not know.

FACTS:
{facts_text}
""",

        LanguageEnum.FR: f"""
Répondez à la question de l'utilisateur en utilisant les FAITS fournis ci-dessous.
Utilisez l'historique pour comprendre le contexte ou les pronoms (comme "celui-ci", "ça", "avant").
Si la réponse n'est pas contenue dans les faits ou l'historique, dites strictement que vous ne savez pas.

FAITS :
{facts_text}
""",
        LanguageEnum.AR: f"""
أجب على سؤال المستخدم باستخدام الحقائق المقدمة أدناه.
استخدم سجل المحادثة لفهم السياق أو الضمائر (مثل "ذلك"، "هم"، "سابقاً").
إذا لم تكن الإجابة موجودة في الحقائق أو المحادثة، قل بوضوح أنك لا تعرف.

الحقائق:
{facts_text}
"""
    }

    messages = [
        Message(
            role="system",
            content=instructions.get(lang, instructions[LanguageEnum.EN]),
        )
    ]

    for turn in session_turns:
        messages.append(Message(
            role="user",
            content=turn.query
        ))
        messages.append(Message(
            role="assistant",
            content=turn.response
        ))

    # for fact in facts :
    #     messages.append(Message(
    #         role="user",
    #         content=f"CONTEXT DATA:\n{fact}"
    #     ))

    messages.append(Message(
        role="user",
        content=query
    ))
    return messages


#######################################################################
#######################################################################
def calc_conf_metrics(logprobs_list):
    if not logprobs_list:
        return {"avg": 0, "min": 0, "geometric": 0}

    # Convert logprobs to linear probabilities
    probs = [math.exp(lp['logprob']) for lp in logprobs_list]

    # 1. Average Prob
    avg_prob = sum(probs) / len(probs)

    # 2. Minimum Prob (The 'Weak Link')
    min_prob = min(probs)

    # 3. Geometric Mean
    total_logprob = sum(lp['logprob'] for lp in logprobs_list)
    geometric_mean_prob = math.exp(total_logprob / len(logprobs_list))

    return {
        "average_confidence": round(avg_prob, 4),
        "minimum_confidence": round(min_prob, 4),
        "sequence_confidence": round(geometric_mean_prob, 4)
    }
