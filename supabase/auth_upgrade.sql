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

alter table public.users
  add column if not exists is_admin boolean not null default false;

alter table public.users
  drop constraint if exists users_provider_check;

alter table public.users
  add constraint users_provider_check check (provider in ('email', 'google', 'github'));

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

create index if not exists users_email_idx
  on public.users (email);

create index if not exists users_workspace_idx
  on public.users (workspace);

create index if not exists refresh_sessions_token_hash_idx
  on public.refresh_sessions (token_hash);

create index if not exists email_verifications_user_active_idx
  on public.email_verifications (user_id, expires_at desc)
  where used_at is null;

alter table public.users enable row level security;
alter table public.refresh_sessions enable row level security;
alter table public.email_verifications enable row level security;
