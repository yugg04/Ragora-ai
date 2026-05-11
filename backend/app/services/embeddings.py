import asyncio

import httpx

from app.core.config import Settings
from app.services.db import DatabaseService
from app.services.errors import ExternalServiceError


class EmbeddingService:
    def __init__(self, settings: Settings, db: DatabaseService | None = None) -> None:
        self._settings = settings
        self._db = db
        self._client = httpx.AsyncClient(
            base_url="https://api.mistral.ai/v1",
            timeout=60,
        )

    async def close(self) -> None:
        await self._client.aclose()

    async def embed_texts(self, texts: list[str], batch_size: int = 32) -> list[list[float]]:
        if not texts:
            return []

        batches = [texts[i : i + batch_size] for i in range(0, len(texts), batch_size)]
        results = await asyncio.gather(*(self._embed_batch(batch) for batch in batches))
        return [embedding for batch in results for embedding in batch]

    async def embed_query(self, text: str) -> list[float]:
        embeddings = await self.embed_texts([text], batch_size=1)
        return embeddings[0]

    async def _embed_batch(self, texts: list[str]) -> list[list[float]]:
        failed_key_ids: set[str] = set()
        last_error: ExternalServiceError | None = None

        for _ in range(8):
            key_row = await self._db.choose_api_key("mistral", self._settings.key_rotation_cache_seconds, failed_key_ids) if self._db else None
            api_key = (key_row or {}).get("key_value") or self._settings.mistral_api_key
            response = await self._client.post(
                "/embeddings",
                headers={"Authorization": f"Bearer {api_key}"},
                json={"model": "mistral-embed", "input": texts},
            )
            try:
                response.raise_for_status()
            except httpx.HTTPStatusError as exc:
                if self._db and key_row:
                    failed_key_ids.add(key_row["id"])
                    await self._db.record_api_key_failure(key_row["id"], exc.response.text)
                    last_error = ExternalServiceError("Mistral", exc.response.status_code, exc.response.text)
                    continue
                raise ExternalServiceError(
                    service="Mistral",
                    status_code=exc.response.status_code,
                    detail=exc.response.text,
                ) from exc
            if self._db and key_row:
                await self._db.record_api_key_success(key_row["id"])
            break
        else:
            if last_error:
                raise last_error
            raise ExternalServiceError("Mistral", None, "No enabled Mistral API key is available.")

        payload = response.json()
        ordered = sorted(payload["data"], key=lambda item: item["index"])
        return [item["embedding"] for item in ordered]
