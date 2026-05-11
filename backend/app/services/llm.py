from collections.abc import AsyncIterator
from dataclasses import dataclass

import httpx

from app.core.config import Settings
from app.services.db import DatabaseService
from app.services.errors import ExternalServiceError


@dataclass
class RagAnswerInput:
    workspace: str
    question: str
    context: str
    documents_summary: str
    memory: str
    sources: list[str]


SYSTEM_PROMPT = """You are Ragora, a premium SaaS AI knowledge assistant.

Your job is to answer from the workspace's uploaded documents and recent conversation context with the reliability of a production support/sales/operations AI product.

Non-negotiable rules:
- Use uploaded document context as the primary source of truth.
- If document context is empty or not relevant, say what is missing and suggest the next best action. Do not claim the user has no files if the workspace document list says files exist.
- Never invent facts, policies, prices, dates, legal commitments, or document contents.
- If the answer is partially supported, answer the supported part and clearly name what is not available.
- Do not mention embeddings, vector search, chunks, prompts, system messages, or internal implementation.
- Prefer clear markdown. Use short sections, bullets, numbered steps, tables, or code blocks when they improve readability.
- Cite document-backed claims with source markers like [S1], [S2] when source context is provided.
"""

DEVELOPER_PROMPT = """Response quality contract:
- Start with the direct answer.
- Keep the default answer concise, but expand when the user asks for details, comparison, steps, implementation, code, or analysis.
- Preserve important nuance from the retrieved sources.
- If the user asks "what files/documents are uploaded", list the active documents exactly from the workspace document list.
- If no relevant source supports the answer, use this pattern:
  "I don't have enough information in the uploaded documents to answer that confidently."
  Then add one helpful next step.
- For troubleshooting, provide a short diagnosis and actionable steps.
- For code, use fenced code blocks with a language tag when possible.
"""

WIDGET_SYSTEM_PROMPT = """You are Ragora's production website chatbot.
Answer visitors using the business configuration and uploaded document context.
Be concise, helpful, brand-safe, and honest about missing information.
Never invent policies, prices, legal terms, guarantees, or document-backed details.
"""


class LLMService:
    def __init__(self, settings: Settings, db: DatabaseService | None = None) -> None:
        self._settings = settings
        self._db = db
        self._client = httpx.AsyncClient(
            base_url="https://api.groq.com/openai/v1",
            timeout=90,
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def answer(self, context: str, question: str) -> str:
        payload = RagAnswerInput(
            workspace="workspace",
            question=question,
            context=context,
            documents_summary="No document list was provided.",
            memory="No prior conversation memory was provided.",
            sources=[],
        )
        return await self.answer_rag(payload)

    async def answer_rag(self, payload: RagAnswerInput) -> str:
        return await self.answer_with_messages(_rag_messages(payload), temperature=0.18)

    async def answer_widget(self, context: str, question: str, widget: dict) -> str:
        return await self.answer_with_messages(_widget_messages(context, question, widget), temperature=0.18)

    async def answer_with_prompt(self, prompt: str) -> str:
        return await self.answer_with_messages([{"role": "user", "content": prompt}], temperature=0.1)

    async def answer_with_messages(self, messages: list[dict[str, str]], temperature: float = 0.18) -> str:
        failed_key_ids: set[str] = set()
        last_error: ExternalServiceError | None = None

        for _ in range(8):
            key_row = await self._db.choose_api_key("groq", self._settings.key_rotation_cache_seconds, failed_key_ids) if self._db else None
            api_key = (key_row or {}).get("key_value") or self._settings.groq_api_key
            response = await self._client.post(
                "/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": self._settings.groq_model,
                    "messages": messages,
                    "temperature": temperature,
                    "top_p": 0.9,
                },
            )
            try:
                response.raise_for_status()
            except httpx.HTTPStatusError as exc:
                if self._db and key_row:
                    failed_key_ids.add(key_row["id"])
                    await self._db.record_api_key_failure(key_row["id"], exc.response.text)
                    last_error = ExternalServiceError("Groq", exc.response.status_code, exc.response.text)
                    continue
                raise ExternalServiceError(
                    service="Groq",
                    status_code=exc.response.status_code,
                    detail=exc.response.text,
                ) from exc
            if self._db and key_row:
                await self._db.record_api_key_success(key_row["id"])
            return response.json()["choices"][0]["message"]["content"].strip()

        if last_error:
            raise last_error
        raise ExternalServiceError("Groq", None, "No enabled Groq API key is available.")

    async def stream_answer(self, context: str, question: str) -> AsyncIterator[str]:
        payload = RagAnswerInput(
            workspace="workspace",
            question=question,
            context=context,
            documents_summary="No document list was provided.",
            memory="No prior conversation memory was provided.",
            sources=[],
        )
        async for token in self.stream_rag_answer(payload):
            yield token

    async def stream_rag_answer(self, payload: RagAnswerInput) -> AsyncIterator[str]:
        async for token in self.stream_with_messages(_rag_messages(payload), temperature=0.18):
            yield token

    async def stream_widget_answer(self, context: str, question: str, widget: dict) -> AsyncIterator[str]:
        async for token in self.stream_with_messages(_widget_messages(context, question, widget), temperature=0.18):
            yield token

    async def stream_with_prompt(self, prompt: str) -> AsyncIterator[str]:
        async for token in self.stream_with_messages([{"role": "user", "content": prompt}], temperature=0.1):
            yield token

    async def stream_with_messages(self, messages: list[dict[str, str]], temperature: float = 0.18) -> AsyncIterator[str]:
        failed_key_ids: set[str] = set()
        last_error: ExternalServiceError | None = None

        for _ in range(8):
            key_row = await self._db.choose_api_key("groq", self._settings.key_rotation_cache_seconds, failed_key_ids) if self._db else None
            api_key = (key_row or {}).get("key_value") or self._settings.groq_api_key
            succeeded = False
            async with self._client.stream(
                "POST",
                "/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": self._settings.groq_model,
                    "messages": messages,
                    "temperature": temperature,
                    "top_p": 0.9,
                    "stream": True,
                },
            ) as response:
                try:
                    response.raise_for_status()
                except httpx.HTTPStatusError as exc:
                    await exc.response.aread()
                    if self._db and key_row:
                        failed_key_ids.add(key_row["id"])
                        await self._db.record_api_key_failure(key_row["id"], exc.response.text)
                        last_error = ExternalServiceError("Groq", exc.response.status_code, exc.response.text)
                        continue
                    raise ExternalServiceError(
                        service="Groq",
                        status_code=exc.response.status_code,
                        detail=exc.response.text,
                    ) from exc
                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data = line.removeprefix("data: ").strip()
                    if data == "[DONE]":
                        break
                    try:
                        import json

                        delta = json.loads(data)["choices"][0]["delta"].get("content")
                    except (KeyError, ValueError):
                        delta = None
                    if delta:
                        succeeded = True
                        yield delta
                if succeeded and self._db and key_row:
                    await self._db.record_api_key_success(key_row["id"])
                return

        if last_error:
            raise last_error
        raise ExternalServiceError("Groq", None, "No enabled Groq API key is available.")


def _rag_messages(payload: RagAnswerInput) -> list[dict[str, str]]:
    context = payload.context.strip() or "No highly relevant excerpts were retrieved for this question."
    memory = payload.memory.strip() or "No recent conversation memory."
    docs = payload.documents_summary.strip() or "No uploaded documents are currently active."
    source_list = ", ".join(payload.sources) if payload.sources else "No source markers available."

    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": DEVELOPER_PROMPT},
        {
            "role": "system",
            "content": (
                f"Workspace: {payload.workspace}\n\n"
                f"Active uploaded documents:\n{docs}\n\n"
                f"Recent conversation memory:\n{memory}\n\n"
                f"Retrieved source context:\n{context}\n\n"
                f"Available source markers: {source_list}"
            ),
        },
        {"role": "user", "content": payload.question},
    ]


def _widget_messages(context: str, question: str, widget: dict) -> list[dict[str, str]]:
    company_email = (widget.get("company_email") or "").strip()
    fallback = widget.get("fallback_message") or "I do not know based on the provided documents."
    if company_email and "@" not in fallback:
        fallback = f"I do not know based on the provided documents. Please contact {company_email} for help."
    config = f"""Business goal:
{widget.get("bot_goal") or "Answer visitor questions using the uploaded documents."}

Company:
{widget.get("company_name") or "Not provided."}

Company website:
{widget.get("company_site") or "Not provided."}

Company contact email:
{company_email or "Not provided."}

Role/persona:
{widget.get("bot_role") or "customer_support"}

Tone:
{widget.get("tone") or "professional"}

Fallback message:
{fallback}

Additional instructions:
{widget.get("custom_instructions") or "None."}

Retrieved document context:
{context.strip() or "No relevant document context was retrieved."}
"""
    return [
        {"role": "system", "content": WIDGET_SYSTEM_PROMPT},
        {
            "role": "system",
            "content": (
                "Use the retrieved context first. If a visitor asks for a document-backed fact that is missing, "
                f"say exactly: {fallback!r}. Ask one useful clarifying question when routing or lead capture helps."
            ),
        },
        {"role": "system", "content": config},
        {"role": "user", "content": question},
    ]
