alter table public.chat_widgets
  add column if not exists company_name text not null default '',
  add column if not exists company_site text not null default '',
  add column if not exists company_email text not null default '';

alter table public.users
  drop constraint if exists users_provider_check;

alter table public.users
  add constraint users_provider_check check (provider in ('email', 'google', 'github'));
