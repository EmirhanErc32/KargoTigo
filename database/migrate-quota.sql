-- Gunluk sorgu limiti (5 ucretsiz / premium sinirsiz)
alter table public.users add column if not exists is_premium boolean not null default false;

create table if not exists public.api_query_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  endpoint   text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_api_query_user_day on public.api_query_log (user_id, created_at);

notify pgrst, 'reload schema';
