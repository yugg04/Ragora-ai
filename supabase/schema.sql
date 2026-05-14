create extension if not exists vector;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  workspace text not null unique,
  provider text not null default 'email' check (provider in ('email', 'google', 'github')),
  password_hash text,
  avatar_url text not null default '',
  email_verified boolean not null default false,
  is_admin boolean not null default false,
  google_sub text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  service text not null check (service in ('groq', 'mistral')),
  name text not null,
  key_value text not null,
  is_enabled boolean not null default true,
  weight integer not null default 1 check (weight >= 1 and weight <= 100),
  usage_count integer not null default 0,
  failure_count integer not null default 0,
  last_used_at timestamptz,
  last_error text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.refresh_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null unique,
  user_agent text not null default '',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create table if not exists public.email_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  file_name text not null,
  file_hash text not null default '',
  status text not null default 'ready' check (status in ('processing', 'ready', 'failed')),
  chunk_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.document_chunks (
  id bigserial primary key,
  user_id text not null,
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_text text not null,
  embedding vector(1024) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  message text not null,
  role text not null check (role in ('user', 'bot')),
  timestamp timestamptz not null default now()
);

create table if not exists public.chat_widgets (
  id uuid primary key default gen_random_uuid(),
  widget_id text not null unique,
  user_id text not null,
  title text not null default 'Ask AI',
  welcome_message text not null default 'Hi. Ask me anything from these documents.',
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  accent_color text not null default '#38bdf8',
  secondary_color text not null default '#0f172a',
  logo_url text not null default '',
  icon_label text not null default 'AI',
  company_name text not null default '',
  company_site text not null default '',
  company_email text not null default '',
  launcher_style text not null default 'pill' check (launcher_style in ('pill', 'circle')),
  launcher_circle_size integer not null default 60 check (launcher_circle_size between 44 and 96),
  launcher_pill_size integer not null default 56 check (launcher_pill_size between 44 and 80),
  border_radius integer not null default 14,
  launcher_label text not null default 'Chat with AI',
  input_placeholder text not null default 'Ask a question',
  position text not null default 'bottom-right' check (position in ('bottom-right', 'bottom-left')),
  bot_goal text not null default 'Answer visitor questions using the uploaded documents.',
  bot_role text not null default 'customer_support',
  tone text not null default 'professional',
  custom_instructions text not null default '',
  fallback_message text not null default 'I do not know based on the provided documents.',
  collect_leads boolean not null default false,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.widget_chats (
  id uuid primary key default gen_random_uuid(),
  widget_id text not null,
  owner_user_id text not null,
  visitor_id text not null,
  message text not null,
  role text not null check (role in ('user', 'bot')),
  token_count integer not null default 0,
  latency_ms integer,
  had_answer boolean,
  timestamp timestamptz not null default now()
);

create index if not exists documents_user_created_idx
  on public.documents (user_id, created_at desc);

create unique index if not exists documents_user_file_hash_idx
  on public.documents (user_id, file_hash)
  where file_hash <> '';

create index if not exists users_email_idx
  on public.users (email);

create index if not exists users_workspace_idx
  on public.users (workspace);

create index if not exists refresh_sessions_token_hash_idx
  on public.refresh_sessions (token_hash);

create index if not exists email_verifications_user_active_idx
  on public.email_verifications (user_id, expires_at desc)
  where used_at is null;

create index if not exists api_keys_service_enabled_idx
  on public.api_keys (service, is_enabled, weight);

create index if not exists document_chunks_user_document_idx
  on public.document_chunks (user_id, document_id);

create index if not exists document_chunks_embedding_hnsw_idx
  on public.document_chunks
  using hnsw (embedding vector_cosine_ops);

create index if not exists chats_user_timestamp_idx
  on public.chats (user_id, timestamp asc);

create index if not exists chat_widgets_user_idx
  on public.chat_widgets (user_id, created_at desc);

create index if not exists widget_chats_widget_visitor_idx
  on public.widget_chats (widget_id, visitor_id, timestamp asc);

create or replace function public.match_document_chunks(
  query_embedding vector(1024),
  match_user_id text,
  match_count integer default 12
)
returns table (
  id bigint,
  document_id uuid,
  chunk_text text,
  similarity double precision
)
language sql
stable
as $$
  select
    dc.id,
    dc.document_id,
    dc.chunk_text,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  join public.documents d on d.id = dc.document_id
  where dc.user_id = match_user_id
    and d.status = 'ready'
  order by dc.embedding <=> query_embedding
  limit least(match_count, 20);
$$;

create or replace function public.increment_api_key_success(key_id uuid)
returns void
language sql
as $$
  update public.api_keys
  set usage_count = usage_count + 1,
      last_used_at = now(),
      last_error = '',
      updated_at = now()
  where id = key_id;
$$;

create or replace function public.increment_api_key_failure(key_id uuid, error_message text)
returns void
language sql
as $$
  update public.api_keys
  set failure_count = failure_count + 1,
      last_used_at = now(),
      last_error = coalesce(error_message, ''),
      updated_at = now()
  where id = key_id;
$$;

alter table public.documents enable row level security;
alter table public.users enable row level security;
alter table public.refresh_sessions enable row level security;
alter table public.email_verifications enable row level security;
alter table public.api_keys enable row level security;
alter table public.document_chunks enable row level security;
alter table public.chats enable row level security;
alter table public.chat_widgets enable row level security;
alter table public.widget_chats enable row level security;

-- The FastAPI backend uses the service role key and always filters by user_id.
-- If you later expose Supabase directly to the browser, replace these with auth.uid()-based policies.
