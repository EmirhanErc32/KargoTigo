-- Admin panel: depo kodu + admin giris logu
-- Supabase SQL Editor'da calistirin.

alter table public.warehouses add column if not exists code text unique;

create table if not exists public.admin_login_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users (id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_login_user on public.admin_login_log (user_id, created_at desc);

notify pgrst, 'reload schema';
