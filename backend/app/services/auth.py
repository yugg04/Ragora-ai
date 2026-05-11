import base64
import hashlib
import hmac
import json
import secrets
import time
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx
from fastapi import HTTPException

from app.core.config import Settings


def _b64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _b64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 240_000)
    return f"pbkdf2_sha256$240000${_b64url_encode(salt)}${_b64url_encode(digest)}"


def verify_password(password: str, stored_hash: str | None) -> bool:
    if not stored_hash:
        return False
    try:
        algorithm, rounds, salt, digest = stored_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        candidate = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            _b64url_decode(salt),
            int(rounds),
        )
        return hmac.compare_digest(_b64url_encode(candidate), digest)
    except (ValueError, TypeError):
        return False


def create_access_token(user: dict[str, Any], settings: Settings) -> str:
    now = int(time.time())
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "workspace": user["workspace"],
        "name": user.get("name") or user["workspace"],
        "provider": user.get("provider") or "email",
        "email_verified": bool(user.get("email_verified")),
        "iat": now,
        "exp": now + settings.access_token_minutes * 60,
        "iss": "ragora-api",
        "aud": "ragora-web",
    }
    header = {"alg": "HS256", "typ": "JWT"}
    signing_input = f"{_b64url_encode(json.dumps(header, separators=(',', ':')).encode())}.{_b64url_encode(json.dumps(payload, separators=(',', ':')).encode())}"
    signature = hmac.new(settings.jwt_secret.encode("utf-8"), signing_input.encode("ascii"), hashlib.sha256).digest()
    return f"{signing_input}.{_b64url_encode(signature)}"


def decode_access_token(token: str, settings: Settings) -> dict[str, Any]:
    try:
        header_part, payload_part, signature_part = token.split(".")
        signing_input = f"{header_part}.{payload_part}"
        expected = hmac.new(settings.jwt_secret.encode("utf-8"), signing_input.encode("ascii"), hashlib.sha256).digest()
        if not hmac.compare_digest(_b64url_encode(expected), signature_part):
            raise ValueError("Bad signature")
        payload = json.loads(_b64url_decode(payload_part))
    except (ValueError, json.JSONDecodeError):
        raise HTTPException(status_code=401, detail="Invalid access token.")

    if payload.get("aud") != "ragora-web" or payload.get("iss") != "ragora-api":
        raise HTTPException(status_code=401, detail="Invalid token audience.")
    if int(payload.get("exp", 0)) < int(time.time()):
        raise HTTPException(status_code=401, detail="Access token expired.")
    return payload


def create_refresh_token() -> tuple[str, str, datetime]:
    raw = f"rg_refresh_{secrets.token_urlsafe(48)}"
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    return raw, digest, datetime.now(UTC)


def refresh_token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def refresh_expiry(settings: Settings) -> datetime:
    return datetime.now(UTC) + timedelta(days=settings.refresh_token_days)


async def verify_google_id_token(id_token: str, settings: Settings) -> dict[str, Any]:
    if not settings.google_client_id:
        raise HTTPException(status_code=500, detail="Google auth is not configured. Set GOOGLE_CLIENT_ID.")

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get("https://oauth2.googleapis.com/tokeninfo", params={"id_token": id_token})

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Google token verification failed.")

    data = response.json()
    if data.get("aud") != settings.google_client_id:
        raise HTTPException(status_code=401, detail="Google token audience mismatch.")
    if not data.get("email"):
        raise HTTPException(status_code=401, detail="Google account did not include an email.")

    return {
        "email": data["email"].lower(),
        "name": data.get("name") or data["email"].split("@")[0],
        "avatar_url": data.get("picture") or "",
        "email_verified": data.get("email_verified") == "true",
        "google_sub": data.get("sub") or "",
    }


async def verify_supabase_access_token(access_token: str, settings: Settings) -> dict[str, Any]:
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            f"{settings.supabase_url.rstrip('/')}/auth/v1/user",
            headers={
                "apikey": settings.supabase_service_role_key,
                "Authorization": f"Bearer {access_token}",
            },
        )

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Supabase session verification failed.")

    data = response.json()
    email = (data.get("email") or "").lower()
    if not email:
        raise HTTPException(status_code=401, detail="Supabase account did not include an email.")

    metadata = data.get("user_metadata") or {}
    app_metadata = data.get("app_metadata") or {}
    provider = app_metadata.get("provider") or "email"
    if provider not in {"email", "google", "github"}:
        provider = "email"

    return {
        "email": email,
        "name": metadata.get("full_name") or metadata.get("name") or email.split("@", 1)[0],
        "avatar_url": metadata.get("avatar_url") or metadata.get("picture") or "",
        "email_verified": bool(data.get("email_confirmed_at")) or provider == "google",
        "provider": provider,
        "google_sub": data.get("id") if provider == "google" else "",
    }
