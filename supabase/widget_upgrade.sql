alter table public.chat_widgets
  add column if not exists launcher_label text not null default 'Chat with AI',
  add column if not exists secondary_color text not null default '#0f172a',
  add column if not exists logo_url text not null default '',
  add column if not exists icon_label text not null default 'AI',
  add column if not exists company_name text not null default '',
  add column if not exists company_site text not null default '',
  add column if not exists company_email text not null default '',
  add column if not exists launcher_style text not null default 'pill',
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

notify pgrst, 'reload schema';
