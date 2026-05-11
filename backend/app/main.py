from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import get_settings
from app.services.auth import hash_password
from app.services.db import DatabaseService
from app.services.embeddings import EmbeddingService
from app.services.llm import LLMService


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.db = DatabaseService(settings)
    if settings.bootstrap_admin_email and settings.bootstrap_admin_password:
        await app.state.db.ensure_admin_user(
            email=settings.bootstrap_admin_email,
            name="Ragora Support",
            workspace="ragora-support",
            password_hash=hash_password(settings.bootstrap_admin_password),
        )
    app.state.embeddings = EmbeddingService(settings, app.state.db)
    app.state.llm = LLMService(settings, app.state.db)
    yield
    await app.state.db.close()
    await app.state.embeddings.close()
    await app.state.llm.close()


app = FastAPI(title="PDF RAG API", version="1.0.0", lifespan=lifespan)
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.allowed_origins == "*" else [origin.strip() for origin in settings.allowed_origins.split(",")],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
