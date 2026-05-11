alter table public.documents
  add column if not exists file_hash text not null default '';

alter table public.documents
  add column if not exists status text not null default 'ready';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'documents_status_check'
  ) then
    alter table public.documents
      add constraint documents_status_check
      check (status in ('processing', 'ready', 'failed'));
  end if;
end $$;

create unique index if not exists documents_user_file_hash_idx
  on public.documents (user_id, file_hash)
  where file_hash <> '';

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
