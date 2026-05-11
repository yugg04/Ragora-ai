from datetime import datetime
import random
import secrets
from uuid import uuid4

import httpx

from app.core.config import Settings
from app.services.errors import ExternalServiceError


def _vector_literal(values: list[float]) -> str:
    return "[" + ",".join(str(value) for value in values) + "]"


class DatabaseService:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client = httpx.AsyncClient(
            base_url=f"{settings.supabase_url.rstrip('/')}/rest/v1",
            headers={
                "apikey": settings.supabase_service_role_key,
                "Authorization": f"Bearer {settings.supabase_service_role_key}",
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            },
            timeout=60,
        )
        self._storage_client = httpx.AsyncClient(
            base_url=settings.supabase_url.rstrip("/"),
            headers={
                "apikey": settings.supabase_service_role_key,
                "Authorization": f"Bearer {settings.supabase_service_role_key}",
            },
            timeout=60,
        )
        self._asset_bucket_ready = False
        self._api_key_cache: dict[str, tuple[float, list[dict]]] = {}
        self._api_key_inflight: dict[str, int] = {}
        self._api_key_local_usage: dict[str, int] = {}
        self._api_key_local_failures: dict[str, int] = {}

    async def close(self) -> None:
        await self._client.aclose()
        await self._storage_client.aclose()

    async def create_document(self, user_id: str, file_name: str, file_hash: str = "", status: str = "processing") -> str:
        document_id = str(uuid4())
        await self._request(
            "POST",
            "documents",
            json={
                "id": document_id,
                "user_id": user_id,
                "file_name": file_name,
                "file_hash": file_hash,
                "chunk_count": 0,
                "status": status,
            },
        )
        return document_id

    async def get_user_by_email(self, email: str) -> dict | None:
        response = await self._request(
            "GET",
            "users",
            params={"select": "*", "email": f"eq.{email.lower()}", "limit": "1"},
        )
        rows = response.json()
        return rows[0] if rows else None

    async def get_user_by_id(self, user_id: str) -> dict | None:
        response = await self._request(
            "GET",
            "users",
            params={"select": "*", "id": f"eq.{user_id}", "limit": "1"},
        )
        rows = response.json()
        return rows[0] if rows else None

    async def create_user(
        self,
        email: str,
        name: str,
        workspace: str,
        provider: str,
        password_hash: str | None = None,
        avatar_url: str = "",
        email_verified: bool = False,
        google_sub: str = "",
        is_admin: bool = False,
    ) -> dict:
        response = await self._request(
            "POST",
            "users",
            json={
                "email": email.lower(),
                "name": name,
                "workspace": workspace,
                "provider": provider,
                "password_hash": password_hash,
                "avatar_url": avatar_url,
                "email_verified": email_verified,
                "google_sub": google_sub,
                "is_admin": is_admin,
            },
        )
        return response.json()[0]

    async def update_user(self, user_id: str, payload: dict) -> dict:
        response = await self._request("PATCH", "users", params={"id": f"eq.{user_id}"}, json=payload)
        return response.json()[0]

    async def ensure_admin_user(self, email: str, name: str, workspace: str, password_hash: str) -> dict:
        existing = await self.get_user_by_email(email)
        payload = {
            "name": name,
            "provider": "email",
            "password_hash": password_hash,
            "email_verified": True,
            "is_admin": True,
        }
        if existing:
            return await self.update_user(existing["id"], payload)

        return await self.create_user(
            email=email,
            name=name,
            workspace=workspace,
            provider="email",
            password_hash=password_hash,
            email_verified=True,
            is_admin=True,
        )

    async def list_users(self, limit: int = 100) -> list[dict]:
        response = await self._request(
            "GET",
            "users",
            params={"select": "id,email,name,workspace,provider,email_verified,is_admin,created_at", "order": "created_at.desc", "limit": str(limit)},
        )
        return response.json()

    async def list_auth_users(self, page: int = 1, per_page: int = 200) -> list[dict]:
        response = await self._storage_client.get(
            "/auth/v1/admin/users",
            params={"page": str(page), "per_page": str(per_page)},
        )
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise ExternalServiceError(
                service="Supabase Auth",
                status_code=exc.response.status_code,
                detail=exc.response.text,
            ) from exc
        return response.json().get("users", [])

    async def create_refresh_session(
        self,
        user_id: str,
        token_hash: str,
        expires_at: datetime,
        user_agent: str = "",
    ) -> None:
        await self._request(
            "POST",
            "refresh_sessions",
            json={
                "user_id": user_id,
                "token_hash": token_hash,
                "expires_at": expires_at.isoformat(),
                "user_agent": user_agent[:300],
            },
        )

    async def get_refresh_session(self, token_hash: str) -> dict | None:
        response = await self._request(
            "GET",
            "refresh_sessions",
            params={"select": "*", "token_hash": f"eq.{token_hash}", "revoked_at": "is.null", "limit": "1"},
        )
        rows = response.json()
        return rows[0] if rows else None

    async def revoke_refresh_session(self, token_hash: str) -> None:
        await self._request(
            "PATCH",
            "refresh_sessions",
            params={"token_hash": f"eq.{token_hash}", "revoked_at": "is.null"},
            json={"revoked_at": datetime.utcnow().isoformat()},
        )

    async def create_email_verification(self, user_id: str, code_hash: str, expires_at: datetime) -> None:
        await self._request(
            "POST",
            "email_verifications",
            json={
                "user_id": user_id,
                "code_hash": code_hash,
                "expires_at": expires_at.isoformat(),
            },
        )

    async def get_active_email_verification(self, user_id: str) -> dict | None:
        response = await self._request(
            "GET",
            "email_verifications",
            params={
                "select": "*",
                "user_id": f"eq.{user_id}",
                "used_at": "is.null",
                "expires_at": f"gt.{datetime.utcnow().isoformat()}",
                "order": "created_at.desc",
                "limit": "1",
            },
        )
        rows = response.json()
        return rows[0] if rows else None

    async def mark_email_verification_used(self, verification_id: str) -> None:
        await self._request(
            "PATCH",
            "email_verifications",
            params={"id": f"eq.{verification_id}"},
            json={"used_at": datetime.utcnow().isoformat()},
        )

    async def update_document_chunk_count(self, document_id: str, chunk_count: int, status: str = "ready") -> None:
        await self._request(
            "PATCH",
            "documents",
            params={"id": f"eq.{document_id}"},
            json={"chunk_count": chunk_count, "status": status},
        )

    async def update_document_status(self, document_id: str, status: str) -> None:
        await self._request("PATCH", "documents", params={"id": f"eq.{document_id}"}, json={"status": status})

    async def get_document_by_hash(self, user_id: str, file_hash: str) -> dict | None:
        if not file_hash:
            return None
        response = await self._request(
            "GET",
            "documents",
            params={"select": "*", "user_id": f"eq.{user_id}", "file_hash": f"eq.{file_hash}", "limit": "1"},
        )
        rows = response.json()
        return rows[0] if rows else None

    async def insert_chunks(
        self,
        user_id: str,
        document_id: str,
        chunks: list[str],
        embeddings: list[list[float]],
    ) -> None:
        rows = [
            {
                "user_id": user_id,
                "document_id": document_id,
                "chunk_text": chunk,
                "embedding": _vector_literal(embedding),
            }
            for chunk, embedding in zip(chunks, embeddings, strict=True)
        ]
        if rows:
            await self._request("POST", "document_chunks", json=rows)

    async def match_chunks(self, user_id: str, embedding: list[float], top_k: int = 5) -> list[dict]:
        response = await self._request(
            "POST",
            "rpc/match_document_chunks",
            json={"query_embedding": _vector_literal(embedding), "match_user_id": user_id, "match_count": top_k},
        )
        return response.json()

    async def insert_chat(self, user_id: str, message: str, role: str) -> None:
        await self._request("POST", "chats", json={"user_id": user_id, "message": message, "role": role})

    async def insert_widget_chat(
        self,
        widget_id: str,
        owner_user_id: str,
        visitor_id: str,
        message: str,
        role: str,
        token_count: int = 0,
        latency_ms: int | None = None,
        had_answer: bool | None = None,
    ) -> None:
        await self._request(
            "POST",
            "widget_chats",
            json={
                "widget_id": widget_id,
                "owner_user_id": owner_user_id,
                "visitor_id": visitor_id,
                "message": message,
                "role": role,
                "token_count": token_count,
                "latency_ms": latency_ms,
                "had_answer": had_answer,
            },
        )

    async def get_history(self, user_id: str) -> list[dict]:
        response = await self._request(
            "GET",
            "chats",
            params={"select": "*", "user_id": f"eq.{user_id}", "order": "timestamp.asc"},
        )
        return response.json()

    async def get_recent_history(self, user_id: str, limit: int = 12) -> list[dict]:
        response = await self._request(
            "GET",
            "chats",
            params={"select": "*", "user_id": f"eq.{user_id}", "order": "timestamp.desc", "limit": str(limit)},
        )
        return list(reversed(response.json()))

    async def get_documents(self, user_id: str) -> list[dict]:
        response = await self._request(
            "GET",
            "documents",
            params={"select": "*", "user_id": f"eq.{user_id}", "order": "created_at.desc"},
        )
        return response.json()

    async def get_document_map(self, user_id: str) -> dict[str, dict]:
        documents = await self.get_documents(user_id)
        return {document["id"]: document for document in documents}

    async def upsert_widget(self, config: dict) -> dict:
        existing = await self.get_widget_for_user(config["user_id"])
        payload = {
            "title": config["title"],
            "welcome_message": config["welcome_message"],
            "theme": config["theme"],
            "accent_color": config["accent_color"],
            "secondary_color": config["secondary_color"],
            "logo_url": config["logo_url"],
            "icon_label": config["icon_label"],
            "company_name": config.get("company_name", ""),
            "company_site": config.get("company_site", ""),
            "company_email": config.get("company_email", ""),
            "launcher_style": config["launcher_style"],
            "border_radius": config["border_radius"],
            "launcher_label": config["launcher_label"],
            "input_placeholder": config["input_placeholder"],
            "position": config["position"],
            "bot_goal": config["bot_goal"],
            "bot_role": config["bot_role"],
            "tone": config["tone"],
            "custom_instructions": config["custom_instructions"],
            "fallback_message": config["fallback_message"],
            "collect_leads": config["collect_leads"],
            "is_enabled": config["is_enabled"],
        }

        if existing:
            response = await self._request(
                "PATCH",
                "chat_widgets",
                params={"widget_id": f"eq.{existing['widget_id']}"},
                json=payload,
            )
            return response.json()[0]

        widget_id = f"w_{secrets.token_urlsafe(18).replace('-', '').replace('_', '')[:20]}"
        response = await self._request(
            "POST",
            "chat_widgets",
            json={"widget_id": widget_id, "user_id": config["user_id"], **payload},
        )
        return response.json()[0]

    async def ensure_widget_asset_bucket(self) -> None:
        if self._asset_bucket_ready:
            return

        bucket = self._settings.widget_asset_bucket
        response = await self._storage_client.post(
            "/storage/v1/bucket",
            json={
                "id": bucket,
                "name": bucket,
                "public": True,
                "file_size_limit": 1_000_000,
                "allowed_mime_types": ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"],
            },
        )
        if response.status_code not in {200, 201, 409}:
            try:
                response.raise_for_status()
            except httpx.HTTPStatusError as exc:
                raise ExternalServiceError(
                    service="Supabase Storage",
                    status_code=exc.response.status_code,
                    detail=exc.response.text,
                ) from exc
        self._asset_bucket_ready = True

    async def upload_widget_logo(self, user_id: str, content: bytes, content_type: str, extension: str) -> str:
        await self.ensure_widget_asset_bucket()
        bucket = self._settings.widget_asset_bucket
        path = f"logos/{user_id}/{uuid4().hex}.{extension}"
        response = await self._storage_client.post(
            f"/storage/v1/object/{bucket}/{path}",
            headers={
                "Content-Type": content_type,
                "Cache-Control": "31536000",
                "x-upsert": "true",
            },
            content=content,
        )
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise ExternalServiceError(
                service="Supabase Storage",
                status_code=exc.response.status_code,
                detail=exc.response.text,
            ) from exc
        return f"{self._settings.supabase_url.rstrip('/')}/storage/v1/object/public/{bucket}/{path}"

    async def get_widget_for_user(self, user_id: str) -> dict | None:
        response = await self._request(
            "GET",
            "chat_widgets",
            params={"select": "*", "user_id": f"eq.{user_id}", "order": "created_at.desc", "limit": "1"},
        )
        rows = response.json()
        return rows[0] if rows else None

    async def get_widget_chats(self, user_id: str, limit: int = 500) -> list[dict]:
        response = await self._request(
            "GET",
            "widget_chats",
            params={
                "select": "*",
                "owner_user_id": f"eq.{user_id}",
                "order": "timestamp.desc",
                "limit": str(limit),
            },
        )
        return response.json()

    async def get_widget(self, widget_id: str) -> dict | None:
        response = await self._request(
            "GET",
            "chat_widgets",
            params={"select": "*", "widget_id": f"eq.{widget_id}", "is_enabled": "eq.true", "limit": "1"},
        )
        rows = response.json()
        return rows[0] if rows else None

    async def delete_document(self, user_id: str, document_id: str) -> None:
        await self._request(
            "DELETE",
            "document_chunks",
            params={"user_id": f"eq.{user_id}", "document_id": f"eq.{document_id}"},
        )
        await self._request(
            "DELETE",
            "documents",
            params={"user_id": f"eq.{user_id}", "id": f"eq.{document_id}"},
        )

    async def list_api_keys(self, service: str | None = None, include_values: bool = False) -> list[dict]:
        params = {
            "select": "*",
            "order": "created_at.desc",
        }
        if service:
            params["service"] = f"eq.{service}"
        response = await self._request("GET", "api_keys", params=params)
        rows = response.json()
        if not include_values:
            for row in rows:
                row["key_value"] = _mask_key(row.get("key_value", ""))
        return rows

    async def create_api_key(self, payload: dict) -> dict:
        response = await self._request("POST", "api_keys", json=payload)
        self._api_key_cache.pop(payload["service"], None)
        row = response.json()[0]
        row["key_value"] = _mask_key(row.get("key_value", ""))
        return row

    async def update_api_key(self, key_id: str, payload: dict) -> dict:
        existing = await self._request("GET", "api_keys", params={"select": "service", "id": f"eq.{key_id}", "limit": "1"})
        service = existing.json()[0]["service"] if existing.json() else None
        response = await self._request("PATCH", "api_keys", params={"id": f"eq.{key_id}"}, json=payload)
        if service:
            self._api_key_cache.pop(service, None)
        rows = response.json()
        if not rows:
            return {}
        row = rows[0]
        row["key_value"] = _mask_key(row.get("key_value", ""))
        return row

    async def delete_api_key(self, key_id: str) -> None:
        existing = await self._request("GET", "api_keys", params={"select": "service", "id": f"eq.{key_id}", "limit": "1"})
        service = existing.json()[0]["service"] if existing.json() else None
        await self._request("DELETE", "api_keys", params={"id": f"eq.{key_id}"})
        if service:
            self._api_key_cache.pop(service, None)

    async def choose_api_key(self, service: str, cache_seconds: int = 30, exclude_ids: set[str] | None = None) -> dict | None:
        now = datetime.utcnow().timestamp()
        cached_at, cached = self._api_key_cache.get(service, (0, []))
        if not cached or now - cached_at > cache_seconds:
            response = await self._request(
                "GET",
                "api_keys",
                params={
                    "select": "*",
                    "service": f"eq.{service}",
                    "is_enabled": "eq.true",
                    "order": "failure_count.asc,usage_count.asc",
                },
            )
            cached = response.json()
            self._api_key_cache[service] = (now, cached)

        if not cached:
            return None

        excluded = exclude_ids or set()
        candidates = [row for row in cached if row["id"] not in excluded]
        if not candidates:
            return None

        def score(row: dict) -> float:
            key_id = row["id"]
            weight = max(1, int(row.get("weight") or 1))
            usage = int(row.get("usage_count") or 0) + self._api_key_local_usage.get(key_id, 0)
            failures = int(row.get("failure_count") or 0) + self._api_key_local_failures.get(key_id, 0)
            inflight = self._api_key_inflight.get(key_id, 0)
            return ((usage + (inflight * 2)) / weight) + (failures * 8) + random.random()

        chosen = min(candidates, key=score)
        key_id = chosen["id"]
        self._api_key_inflight[key_id] = self._api_key_inflight.get(key_id, 0) + 1
        self._api_key_local_usage[key_id] = self._api_key_local_usage.get(key_id, 0) + 1
        return chosen

    def _release_api_key(self, key_id: str) -> None:
        current = self._api_key_inflight.get(key_id, 0)
        if current <= 1:
            self._api_key_inflight.pop(key_id, None)
        else:
            self._api_key_inflight[key_id] = current - 1

    async def record_api_key_success(self, key_id: str) -> None:
        self._release_api_key(key_id)
        if key_id in self._api_key_local_failures:
            self._api_key_local_failures[key_id] = max(0, self._api_key_local_failures[key_id] - 1)
        await self._request(
            "POST",
            "rpc/increment_api_key_success",
            json={"key_id": key_id},
        )

    async def record_api_key_failure(self, key_id: str, error: str) -> None:
        self._release_api_key(key_id)
        self._api_key_local_failures[key_id] = self._api_key_local_failures.get(key_id, 0) + 1
        await self._request(
            "POST",
            "rpc/increment_api_key_failure",
            json={"key_id": key_id, "error_message": error[:500]},
        )

    async def admin_overview(self) -> dict:
        users = await self.list_users(limit=500)
        auth_users = await self.list_auth_users(per_page=500)
        docs = (await self._request("GET", "documents", params={"select": "id,status,chunk_count"})).json()
        keys = await self.list_api_keys(include_values=False)
        widgets = (await self._request("GET", "chat_widgets", params={"select": "id,is_enabled"})).json()
        chats = (await self._request("GET", "chats", params={"select": "id"})).json()
        widget_chats = (await self._request("GET", "widget_chats", params={"select": "id"})).json()
        return {
            "users": len(auth_users) or len(users),
            "admins": len([user for user in users if user.get("is_admin")]),
            "documents": len(docs),
            "ready_documents": len([doc for doc in docs if doc.get("status", "ready") == "ready"]),
            "processing_documents": len([doc for doc in docs if doc.get("status") == "processing"]),
            "failed_documents": len([doc for doc in docs if doc.get("status") == "failed"]),
            "chunks": sum(doc.get("chunk_count") or 0 for doc in docs),
            "chats": len(chats),
            "widgets": len(widgets),
            "live_widgets": len([widget for widget in widgets if widget.get("is_enabled")]),
            "widget_messages": len(widget_chats),
            "api_keys": len(keys),
            "enabled_api_keys": len([key for key in keys if key.get("is_enabled")]),
        }

    async def _request(self, method: str, path: str, **kwargs) -> httpx.Response:
        response = await self._client.request(method, path, **kwargs)
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            raise ExternalServiceError(
                service="Supabase",
                status_code=exc.response.status_code,
                detail=exc.response.text,
            ) from exc
        return response


def _mask_key(value: str) -> str:
    if not value:
        return ""
    if len(value) <= 10:
        return "••••"
    return f"{value[:6]}••••••••{value[-4:]}"
