alter table public.chat_widgets
  add column if not exists launcher_label text not null default 'Chat with AI',
  add column if not exists secondary_color text not null default '#0f172a',
  add column if not exists logo_url text not null default '',
  add column if not exists icon_label text not null default 'AI',
  add column if not exists company_name text not null default '',
  add column if not exists company_site text not null default '',
  add column if not exists company_email text not null default '',
  add column if not exists launcher_style text not null default 'pill',
  add column if not exists launcher_circle_size integer not null default 60,
  add column if not exists launcher_pill_size integer not null default 56,
  add column if not exists border_radius integer not null default 14,
  add column if not exists input_placeholder text not null default 'Ask a question',
  add column if not exists position text not null default 'bottom-right',
  add column if not exists bot_goal text not null default 'Answer visitor questions using the uploaded documents.',
  add column if not exists bot_role text not null default 'customer_support',
  add column if not exists tone text not null default 'professional',
  add column if not exists custom_instructions text not null default '',
  add column if not exists fallback_message text not null default 'I do not know based on the provided documents.',
  add column if not exists collect_leads boolean not null default false;

alter table public.widget_chats
  add column if not exists token_count integer not null default 0,
  add column if not exists latency_ms integer,
  add column if not exists had_answer boolean;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chat_widgets_launcher_circle_size_check'
  ) then
    alter table public.chat_widgets
      add constraint chat_widgets_launcher_circle_size_check check (launcher_circle_size between 44 and 96);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'chat_widgets_launcher_pill_size_check'
  ) then
    alter table public.chat_widgets
      add constraint chat_widgets_launcher_pill_size_check check (launcher_pill_size between 44 and 80);
  end if;
end $$;

notify pgrst, 'reload schema';
