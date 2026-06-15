-- Sube hesaplarini users tablosu ile bagla (normal giris icin)
alter table public.branch_accounts add column if not exists user_id uuid references public.users (id) on delete cascade;
create index if not exists idx_branch_accounts_user on public.branch_accounts (user_id);
