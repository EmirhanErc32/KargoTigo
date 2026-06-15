-- KargoTigo v3: admin, sube yetkilileri, kurye kodlari, kullanici rolu

alter table public.users add column if not exists role text not null default 'user';

alter table public.courier_orders add column if not exists pickup_code text;
alter table public.courier_orders add column if not exists sender_tc text;
alter table public.courier_orders add column if not exists recipient_tc text;

-- Sube / depo yetkili hesaplari (admin olusturur)
create table if not exists public.branch_accounts (
  id            uuid primary key default gen_random_uuid(),
  username      text unique not null,
  password_hash text not null,
  branch_name   text not null,
  branch_type   text not null default 'warehouse', -- warehouse | courier
  warehouse_id  text,
  active        boolean not null default true,
  created_by    uuid references public.users (id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_branch_accounts_username on public.branch_accounts (username);

alter table public.branch_accounts enable row level security;

-- Ilk admin: UPDATE public.users SET role = 'admin' WHERE email = 'sizin@email.com';
