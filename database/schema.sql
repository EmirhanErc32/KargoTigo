-- ============================================================
--  AI DESTEKLI KARGO SISTEMI - SUPABASE VERITABANI SEMASI
-- ============================================================
--  KULLANIM:
--  1. Supabase panelinde projenizi acin.
--  2. Sol menuden "SQL Editor" > "New query" secin.
--  3. Bu dosyanin tamamini yapistirip "Run" deyin.
-- ============================================================

-- UUID uretimi icin gerekli eklenti (Supabase'de genelde aciktir)
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1) KULLANICILAR
--    Kimlik dogrulama backend'de JWT ile yapilir; sifreler
--    bcrypt ile hash'lenip burada saklanir.
-- ------------------------------------------------------------
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text not null,
  full_name     text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_users_email on public.users (email);

-- ------------------------------------------------------------
-- 2) ANALIZLER
--    Bir fotograf yuklendiginde Gemini'nin urettigi sonuc +
--    Google arama kaynaklari (dogruluk icin) burada tutulur.
-- ------------------------------------------------------------
create table if not exists public.analyses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.users (id) on delete cascade,

  product_name    text,                       -- "Bulasik makinesi"
  brand           text,                       -- "Siemens"
  model           text,                       -- "SN23HW00TR"
  category        text,                       -- "Beyaz esya"

  weight_kg       numeric(10, 3),             -- Tahmini agirlik (kg)
  length_cm       numeric(10, 2),
  width_cm        numeric(10, 2),
  height_cm       numeric(10, 2),

  confidence      numeric(4, 3),              -- 0.000 - 1.000 arasi guven
  sources         jsonb default '[]'::jsonb,  -- [{title, uri}] Google kaynaklari
  raw_response    jsonb,                      -- Gemini ham cevabi (denetim icin)
  confirmed       boolean not null default false,  -- Kullanici onayladi mi?

  created_at      timestamptz not null default now()
);

create index if not exists idx_analyses_user on public.analyses (user_id);
create index if not exists idx_analyses_created on public.analyses (created_at desc);

-- ------------------------------------------------------------
-- 3) GONDERILER (SHIPMENTS)
--    Onaylanan analiz icin hesaplanan kargo secenegi/fiyati.
-- ------------------------------------------------------------
create table if not exists public.shipments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.users (id) on delete cascade,
  analysis_id     uuid references public.analyses (id) on delete set null,

  origin          text,                       -- Cikis (sehir/ulke)
  destination     text,                       -- Varis (sehir/ulke)
  distance_km     numeric(10, 2),

  vehicle_type    text,                       -- "kamyon" | "ucak" | "motosiklet" | "gemi" | "van"
  carrier         text,                       -- Tasiyici firma adi (varsa)

  price           numeric(12, 2),
  currency        text default 'TRY',
  estimated_days  integer,                    -- Tahmini teslim suresi (gun)

  details         jsonb default '{}'::jsonb,  -- Fiyat dokumu, ekstra bilgiler
  status          text not null default 'quoted', -- quoted | confirmed | cancelled

  created_at      timestamptz not null default now()
);

create index if not exists idx_shipments_user on public.shipments (user_id);
create index if not exists idx_shipments_analysis on public.shipments (analysis_id);

alter table public.shipments add column if not exists tracking_number text unique;
alter table public.shipments add column if not exists service_type text default 'standard';

create index if not exists idx_shipments_tracking on public.shipments (tracking_number);

-- ------------------------------------------------------------
-- 4) SEHIR ICI KURYE SIPARISLERI
-- ------------------------------------------------------------
create table if not exists public.courier_orders (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references public.users (id) on delete cascade,
  city                text not null default 'Istanbul',
  origin_city         text,
  pickup_point_id     text,
  delivery_point_id   text,
  pickup_address      text not null,
  delivery_address    text not null,
  weight_kg           numeric(10, 3) not null,
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
alter table public.courier_orders add column if not exists length_cm numeric(10, 2);
alter table public.courier_orders add column if not exists width_cm numeric(10, 2);
alter table public.courier_orders add column if not exists height_cm numeric(10, 2);
alter table public.courier_orders add column if not exists volume_liters numeric(10, 2);
alter table public.courier_orders add column if not exists sender_name text;
alter table public.courier_orders add column if not exists sender_phone text;
alter table public.courier_orders add column if not exists recipient_name text;
alter table public.courier_orders add column if not exists recipient_phone text;
alter table public.courier_orders add column if not exists price_breakdown jsonb default '{}'::jsonb;
alter table public.courier_orders add column if not exists distance_km numeric(10, 2);
alter table public.courier_orders add column if not exists delivery_code text;
alter table public.courier_orders add column if not exists payment_status text default 'pending';
alter table public.courier_orders add column if not exists paid_at timestamptz;

create index if not exists idx_courier_user on public.courier_orders (user_id);
create index if not exists idx_courier_tracking on public.courier_orders (tracking_number);

-- ------------------------------------------------------------
-- 5) TAKIP OLAYLARI
-- ------------------------------------------------------------
create table if not exists public.tracking_events (
  id                uuid primary key default gen_random_uuid(),
  tracking_number   text not null,
  user_id           uuid references public.users (id) on delete set null,
  service_type      text default 'standard',
  reference_id      uuid,
  status            text not null,
  label             text,
  location          text,
  description       text,
  event_at          timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index if not exists idx_tracking_number on public.tracking_events (tracking_number);

-- ------------------------------------------------------------
-- 6) DEPOLAR
-- ------------------------------------------------------------
create table if not exists public.warehouses (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  city            text not null,
  district        text,
  address         text,
  area_sqm        numeric(10, 2),
  available_sqm   numeric(10, 2),
  price_monthly   numeric(10, 2),   -- TRY / m2 / ay
  features        jsonb default '[]'::jsonb,
  type            text default 'standard',  -- standard | cold | fulfillment | bonded
  rating          numeric(2, 1) default 4.5,
  available       boolean not null default true,
  created_at      timestamptz not null default now()
);

create index if not exists idx_warehouses_city on public.warehouses (city);

-- ------------------------------------------------------------
-- 7) DEPO KIRALAMA TALEPLERI
-- ------------------------------------------------------------
create table if not exists public.warehouse_bookings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.users (id) on delete cascade,
  warehouse_id    text,                       -- Orn: ist-16 (seed depo kodu)
  warehouse_name  text,
  warehouse_city  text,
  warehouse_district text,
  area_sqm        numeric(10, 2) not null,
  months          integer not null default 1,
  start_date      date,
  total_price     numeric(12, 2),
  contact_phone   text,
  notes           text,
  status          text not null default 'pending',  -- pending | confirmed | cancelled
  created_at      timestamptz not null default now()
);

create index if not exists idx_bookings_user on public.warehouse_bookings (user_id);
create index if not exists idx_bookings_created on public.warehouse_bookings (created_at desc);

-- Depo kiralama genisletilmis alanlar (v2)
alter table public.warehouses add column if not exists lat numeric(10, 6);
alter table public.warehouses add column if not exists lng numeric(10, 6);

-- Mevcut kurulumlarda warehouse_id uuid ise text'e cevir (ist-16 gibi kodlar icin)
alter table public.warehouse_bookings drop constraint if exists warehouse_bookings_warehouse_id_fkey;
alter table public.warehouse_bookings alter column warehouse_id type text using warehouse_id::text;

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
alter table public.warehouse_bookings add column if not exists transport_fee numeric(12, 2) default 0;
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
-- ROW LEVEL SECURITY (RLS)
--    Backend service_role anahtariyla baglandigi icin RLS'i
--    bypass eder. Yine de tablolari aciga karsi guvenli tutmak
--    icin RLS'i ACIK birakiyoruz (anon/public erisim engellenir).
-- ------------------------------------------------------------
alter table public.users              enable row level security;
alter table public.analyses           enable row level security;
alter table public.shipments          enable row level security;
alter table public.courier_orders     enable row level security;
alter table public.tracking_events    enable row level security;
alter table public.warehouses         enable row level security;
alter table public.warehouse_bookings enable row level security;

-- Not: Asagidaki politikalar bilerek hicbir erisime izin VERMEZ.
-- Tum veri erisimi guvenli backend uzerinden yapilir.
-- (Politika yoksa RLS varsayilan olarak her seyi reddeder.)

-- ------------------------------------------------------------
-- 8) GUNLUK SORGU KOTASI (AI analiz + fiyat karsilastirma)
-- ------------------------------------------------------------
alter table public.users add column if not exists is_premium boolean not null default false;

create table if not exists public.api_query_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  endpoint   text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_api_query_user_day on public.api_query_log (user_id, created_at);

-- ============================================================
--  ORNEK SORGULAR (gelistirme sirasinda ise yarar)
-- ============================================================
-- select * from public.users order by created_at desc;
-- select a.*, u.email from public.analyses a join public.users u on u.id = a.user_id;
-- select * from public.shipments where user_id = 'BURAYA_USER_ID';
