alter table public.users
  add column if not exists is_admin boolean not null default false;

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

create index if not exists api_keys_service_enabled_idx
  on public.api_keys (service, is_enabled, weight);

alter table public.api_keys enable row level security;

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
