create table if not exists public.telegram_support_admins (
  chat_id bigint primary key,
  telegram_user_id bigint not null,
  username text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.telegram_message_links (
  id uuid primary key default gen_random_uuid(),
  site_message_id uuid not null references public.messages(id) on delete cascade,
  session_id uuid not null,
  telegram_chat_id bigint not null,
  telegram_message_id bigint not null,
  telegram_update_id bigint,
  direction text not null check (direction in ('to_telegram', 'from_telegram')),
  created_at timestamptz not null default now(),
  unique (telegram_chat_id, telegram_message_id),
  unique (telegram_update_id)
);

create index if not exists idx_telegram_message_links_site_message
  on public.telegram_message_links(site_message_id);

create index if not exists idx_telegram_message_links_session_created
  on public.telegram_message_links(session_id, created_at desc);

alter table public.telegram_support_admins enable row level security;
alter table public.telegram_message_links enable row level security;

revoke all on public.telegram_support_admins from anon, authenticated;
revoke all on public.telegram_message_links from anon, authenticated;
grant all on public.telegram_support_admins to service_role;
grant all on public.telegram_message_links to service_role;

comment on table public.telegram_support_admins is '通过绑定口令登记的 Telegram 客服账号';
comment on table public.telegram_message_links is '网站客服消息与 Telegram 消息的双向回复映射';

notify pgrst, 'reload schema';
