-- ============================================================
-- Kurye siparisi kolonlari (Supabase SQL Editor'da calistirin)
-- Hata: "Could not find the 'delivery_point_id' column..."
-- ============================================================

-- Tablo yoksa olustur
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

-- Eski tabloya eksik kolonlari ekle
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

create index if not exists idx_courier_user on public.courier_orders (user_id);
create index if not exists idx_courier_tracking on public.courier_orders (tracking_number);
create index if not exists idx_courier_status on public.courier_orders (status);

-- PostgREST sema onbellegini yenile (Supabase API kolonlari gorsun)
notify pgrst, 'reload schema';
