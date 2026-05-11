from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class AuthUser(BaseModel):
    id: str
    email: str
    name: str
    workspace: str
    provider: str
    avatar_url: str = ""
    email_verified: bool
    is_admin: bool = False


class AdminApiKeyCreate(BaseModel):
    service: Literal["groq", "mistral"]
    name: str = Field(min_length=2)
    key_value: str = Field(min_length=10)
    weight: int = Field(default=1, ge=1, le=100)
    is_enabled: bool = True


class AdminApiKeyUpdate(BaseModel):
    name: str | None = None
    key_value: str | None = None
    weight: int | None = Field(default=None, ge=1, le=100)
    is_enabled: bool | None = None


class AdminApiKey(BaseModel):
    id: str
    service: Literal["groq", "mistral"]
    name: str
    key_value: str
    is_enabled: bool
    weight: int
    usage_count: int
    failure_count: int
    last_used_at: datetime | None = None
    last_error: str = ""
    created_at: datetime


class AdminOverview(BaseModel):
    users: int
    admins: int
    documents: int
    ready_documents: int
    processing_documents: int
    failed_documents: int
    chunks: int
    chats: int
    widgets: int
    live_widgets: int
    widget_messages: int
    api_keys: int
    enabled_api_keys: int


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: AuthUser


class SignupRequest(BaseModel):
    name: str = Field(min_length=2)
    email: str = Field(min_length=5)
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: str = Field(min_length=5)
    password: str = Field(min_length=1)


class GoogleAuthRequest(BaseModel):
    id_token: str = Field(min_length=20)


class SupabaseAuthRequest(BaseModel):
    access_token: str = Field(min_length=20)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=20)


class ForgotPasswordRequest(BaseModel):
    email: str = Field(min_length=5)


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=6)
    password: str = Field(min_length=8)


class VerifyEmailRequest(BaseModel):
    code: str = Field(min_length=6, max_length=6)


class StatusResponse(BaseModel):
    ok: bool
    message: str


class ChatRequest(BaseModel):
    user_id: str = Field(min_length=1)
    message: str = Field(min_length=1)
    stream: bool = False


class WidgetChatRequest(BaseModel):
    message: str = Field(min_length=1)
    visitor_id: str = Field(min_length=1)
    stream: bool = False


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]


class HistoryItem(BaseModel):
    id: str
    user_id: str
    message: str
    role: Literal["user", "bot"]
    timestamp: datetime


class DocumentItem(BaseModel):
    id: str
    user_id: str
    file_name: str
    file_hash: str = ""
    status: str = "ready"
    chunk_count: int
    created_at: datetime


class UploadResponse(BaseModel):
    document_id: str
    file_name: str
    chunk_count: int


class WidgetConfigRequest(BaseModel):
    user_id: str = Field(min_length=1)
    title: str = "Ask AI"
    welcome_message: str = "Hi. Ask me anything from these documents."
    theme: Literal["dark", "light"] = "dark"
    accent_color: str = "#38bdf8"
    secondary_color: str = "#0f172a"
    logo_url: str = ""
    icon_label: str = "AI"
    company_name: str = ""
    company_site: str = ""
    company_email: str = ""
    launcher_style: Literal["pill", "circle"] = "pill"
    border_radius: int = 14
    launcher_label: str = "Chat with AI"
    input_placeholder: str = "Ask a question"
    position: Literal["bottom-right", "bottom-left"] = "bottom-right"
    bot_goal: str = "Answer visitor questions using the uploaded documents."
    bot_role: str = "customer_support"
    tone: str = "professional"
    custom_instructions: str = ""
    fallback_message: str = "I do not know based on the provided documents."
    collect_leads: bool = False
    is_enabled: bool = True


class WidgetConfig(BaseModel):
    widget_id: str
    user_id: str
    title: str
    welcome_message: str
    theme: Literal["dark", "light"]
    accent_color: str
    secondary_color: str
    logo_url: str
    icon_label: str
    company_name: str = ""
    company_site: str = ""
    company_email: str = ""
    launcher_style: Literal["pill", "circle"]
    border_radius: int
    launcher_label: str
    input_placeholder: str
    position: Literal["bottom-right", "bottom-left"]
    bot_goal: str
    bot_role: str
    tone: str
    custom_instructions: str
    fallback_message: str
    collect_leads: bool
    is_enabled: bool
    embed_script: str | None = None


class WidgetAnalytics(BaseModel):
    total_messages: int
    user_messages: int
    bot_messages: int
    unique_visitors: int
    unanswered_count: int
    total_tokens: int
    average_latency_ms: int
    top_questions: list[dict]
    unanswered_questions: list[dict]
    daily_messages: list[dict]


class WidgetHistory(BaseModel):
    conversations: list[dict]
