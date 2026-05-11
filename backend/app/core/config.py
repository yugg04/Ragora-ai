from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_role_key: str
    mistral_api_key: str
    groq_api_key: str
    groq_model: str = "llama3-8b-8192"
    frontend_origin: str = "http://localhost:3000"
    allowed_origins: str = "*"
    chunk_size: int = 1100
    chunk_overlap: int = 160
    embedding_dimension: int = 1024
    retrieval_match_count: int = 12
    retrieval_context_count: int = 6
    retrieval_min_similarity: float = 0.22
    jwt_secret: str = "change-me-in-production"
    access_token_minutes: int = 45
    refresh_token_days: int = 30
    google_client_id: str = ""
    admin_emails: str = ""
    bootstrap_admin_email: str = "support.ragora@gmail.com"
    bootstrap_admin_password: str = "RAGORA#@2026"
    key_rotation_cache_seconds: int = 30
    widget_asset_bucket: str = "ragora-widget-assets"
    email_verification_minutes: int = 10
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "Ragora"
    smtp_use_tls: bool = True

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()
