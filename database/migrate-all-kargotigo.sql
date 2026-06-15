-- ============================================================
-- KargoTigo — TUM GUNCELLEMELER (tek seferde calistirin)
-- Supabase SQL Editor > New query > Run
--
-- ONKOSUL: database/schema.sql daha once calistirilmis olmali.
-- Giriş: admin@kargotigo.com / tigotigo1903
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1) AI KOTA (5 hak, api_query_log)
-- ------------------------------------------------------------
alter table public.users add column if not exists is_premium boolean not null default false;
alter table public.users add column if not exists role text not null default 'user';

create table if not exists public.api_query_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  endpoint   text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_api_query_user_day on public.api_query_log (user_id, created_at);

-- ------------------------------------------------------------
-- 2) DEPO KIRALAMA v2
-- ------------------------------------------------------------
alter table public.warehouse_bookings drop constraint if exists warehouse_bookings_warehouse_id_fkey;

alter table public.warehouse_bookings
  alter column warehouse_id type text using warehouse_id::text;

alter table public.warehouses
  add column if not exists lat numeric(10, 6),
  add column if not exists lng numeric(10, 6);

alter table public.warehouse_bookings add column if not exists warehouse_name text;
alter table public.warehouse_bookings add column if not exists warehouse_city text;
alter table public.warehouse_bookings add column if not exists warehouse_district text;
alter table public.warehouse_bookings add column if not exists storage_days integer default 30;
alter table public.warehouse_bookings add column if not exists length_cm numeric(10, 2);
alter table public.warehouse_bookings add column if not exists width_cm numeric(10, 2);
alter table public.warehouse_bookings add column if not exists height_cm numeric(10, 2);
alter table public.warehouse_bookings add column if not exists weight_kg numeric(10, 2);
alter table public.warehouse_bookings add column if not exists user_lat numeric(10, 6);
alter table public.warehouse_bookings add column if not exists user_lng numeric(10, 6);
alter table public.warehouse_bookings add column if not exists user_address text;
alter table public.warehouse_bookings add column if not exists product_photo text;
alter table public.warehouse_bookings add column if not exists first_name text;
alter table public.warehouse_bookings add column if not exists last_name text;
alter table public.warehouse_bookings add column if not exists tc_no text;
alter table public.warehouse_bookings add column if not exists email text;
alter table public.warehouse_bookings add column if not exists personal_address text;
alter table public.warehouse_bookings add column if not exists storage_subtotal numeric(12, 2);
alter table public.warehouse_bookings add column if not exists transport_fee numeric(12, 2);
alter table public.warehouse_bookings add column if not exists transport_distance_km numeric(8, 2);
alter table public.warehouse_bookings add column if not exists kdv numeric(12, 2);
alter table public.warehouse_bookings add column if not exists subtotal numeric(12, 2);
alter table public.warehouse_bookings add column if not exists entry_password text;
alter table public.warehouse_bookings add column if not exists exit_password text;
alter table public.warehouse_bookings add column if not exists invoice_no text;
alter table public.warehouse_bookings add column if not exists payment_status text default 'pending';
alter table public.warehouse_bookings add column if not exists paid_at timestamptz;
alter table public.warehouse_bookings add column if not exists currency text default 'TRY';

create index if not exists idx_bookings_payment on public.warehouse_bookings (payment_status);

-- ------------------------------------------------------------
-- 3) KURYE SIPARISLERI
-- ------------------------------------------------------------
create table if not exists public.courier_orders (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references public.users (id) on delete cascade,
  city                text not null default 'Istanbul',
  origin_city         text,
  pickup_point_id     text,
  delivery_point_id   text,
  pickup_address      text not null default '',
  delivery_address    text not null default '',
  weight_kg           numeric(10, 3) not null default 1,
  length_cm           numeric(10, 2),
  width_cm            numeric(10, 2),
  height_cm           numeric(10, 2),
  volume_liters       numeric(10, 2),
  package_description text,
  sender_name         text,
  sender_phone        text,
  recipient_name      text,
  recipient_phone     text,
  urgency             text not null default 'same_day',
  vehicle_type        text default 'moto',
  carrier             text,
  price               numeric(12, 2),
  price_breakdown     jsonb default '{}'::jsonb,
  distance_km         numeric(10, 2),
  delivery_code       text,
  payment_status      text not null default 'pending',
  paid_at             timestamptz,
  tracking_number     text unique,
  status              text not null default 'pending_payment',
  created_at          timestamptz not null default now()
);

alter table public.courier_orders add column if not exists pickup_point_id text;
alter table public.courier_orders add column if not exists delivery_point_id text;
alter table public.courier_orders add column if not exists origin_city text;
alter table public.courier_orders add column if not exists length_cm numeric(10, 2);
alter table public.courier_orders add column if not exists width_cm numeric(10, 2);
alter table public.courier_orders add column if not exists height_cm numeric(10, 2);
alter table public.courier_orders add column if not exists volume_liters numeric(10, 2);
alter table public.courier_orders add column if not exists package_description text;
alter table public.courier_orders add column if not exists sender_name text;
alter table public.courier_orders add column if not exists sender_phone text;
alter table public.courier_orders add column if not exists recipient_name text;
alter table public.courier_orders add column if not exists recipient_phone text;
alter table public.courier_orders add column if not exists price_breakdown jsonb default '{}'::jsonb;
alter table public.courier_orders add column if not exists distance_km numeric(10, 2);
alter table public.courier_orders add column if not exists delivery_code text;
alter table public.courier_orders add column if not exists payment_status text default 'pending';
alter table public.courier_orders add column if not exists paid_at timestamptz;
alter table public.courier_orders add column if not exists tracking_number text;
alter table public.courier_orders add column if not exists vehicle_type text default 'moto';

-- KargoTigo: alim kodu + TC
alter table public.courier_orders add column if not exists pickup_code text;
alter table public.courier_orders add column if not exists sender_tc text;
alter table public.courier_orders add column if not exists recipient_tc text;

create index if not exists idx_courier_user on public.courier_orders (user_id);
create index if not exists idx_courier_tracking on public.courier_orders (tracking_number);
create index if not exists idx_courier_status on public.courier_orders (status);

-- ------------------------------------------------------------
-- 4) SUBE / ADMIN HESAPLARI
-- ------------------------------------------------------------
create table if not exists public.branch_accounts (
  id            uuid primary key default gen_random_uuid(),
  username      text unique not null,
  password_hash text not null,
  branch_name   text not null,
  branch_type   text not null default 'courier',
  warehouse_id  text,
  active        boolean not null default true,
  created_by    uuid references public.users (id) on delete set null,
  created_at    timestamptz not null default now()
);

alter table public.branch_accounts add column if not exists user_id uuid references public.users (id) on delete cascade;

create index if not exists idx_branch_accounts_username on public.branch_accounts (username);
create index if not exists idx_branch_accounts_user on public.branch_accounts (user_id);

alter table public.branch_accounts enable row level security;

-- ------------------------------------------------------------
-- 5) ADMIN HESABI (normal giris sayfasindan)
-- E-posta: admin@kargotigo.com  |  Sifre: tigotigo1903
-- ------------------------------------------------------------
insert into public.users (email, password_hash, full_name, role)
values (
  'admin@kargotigo.com',
  '$2a$10$6LmN51ewuWbRIchnmsq0Ge2VuKK6076/pYhhdjIrAW6t9DGgLI9xW',
  'KargoTigo Admin',
  'admin'
)
on conflict (email) do update set
  password_hash = excluded.password_hash,
  full_name = excluded.full_name,
  role = 'admin';

-- ------------------------------------------------------------
-- 6) KENDI HESABINIZ (e-postayi degistirin)
-- ------------------------------------------------------------
update public.users
set full_name = 'Emirhan Ercan'
where email = 'emirhanercan032@gmail.com';

delete from public.api_query_log
where user_id = (select id from public.users where email = 'emirhanercan032@gmail.com')
  and endpoint = 'ai-analyze';

-- ------------------------------------------------------------
-- 7) Sema onbellegini yenile
-- ------------------------------------------------------------
-- Depo sube: giris/cikis dogrulama
alter table public.warehouse_bookings
  add column if not exists entry_verified_at timestamptz,
  add column if not exists exit_verified_at timestamptz;

create index if not exists idx_bookings_entry on public.warehouse_bookings (warehouse_id, entry_verified_at);
create index if not exists idx_bookings_exit on public.warehouse_bookings (warehouse_id, exit_verified_at);

notify pgrst, 'reload schema';

-- Bitti. Kontrol:
-- select email, role, full_name from public.users where role in ('admin', 'branch');
