-- ============================================================
--  NAKLİYAT SİSTEMİ MİGRATION
--  Supabase SQL Editor'de çalıştırın
-- ============================================================

-- 1) TAŞIMA SİPARİŞLERİ
create table if not exists public.moving_orders (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references public.users(id) on delete cascade,

  -- Form cevapları
  moving_type      text not null,          -- 'ev' | 'ofis'
  room_size        text not null,          -- '1+1', '2+1', '3+1', '4+1+'
  origin_floor     text not null,          -- 'giris', '1-4-asansorlu', vs
  dest_floor       text not null,
  packing_service  text not null,          -- 'yok', 'buyuk', 'tam'

  -- Adres bilgileri
  origin_address   text,
  dest_address     text,
  contact_name     text,
  contact_phone    text,

  -- Fiyat
  price            numeric(12,2),
  currency         text default 'TRY',

  -- Mesafe (OSRM yol mesafesi)
  distance_km      numeric(8,1),

  -- Durum
  status           text not null default 'pending_payment',
  -- pending_payment | paid | assigned | in_progress | completed | cancelled

  payment_status   text default 'pending',
  paid_at          timestamptz,

  -- Müşteri doğrulama kodu (işin başlangıcında nakliyeciye verilecek)
  confirm_code     text,

  -- Nakliyeci atama
  assigned_to      uuid references public.branch_accounts(id) on delete set null,
  assigned_at      timestamptz,
  completed_at     timestamptz,

  -- Zaman
  created_at       timestamptz not null default now()
);

create index if not exists idx_moving_user on public.moving_orders (user_id);
create index if not exists idx_moving_status on public.moving_orders (status);
create index if not exists idx_moving_assigned on public.moving_orders (assigned_to);

alter table public.moving_orders enable row level security;

-- 2) branch_accounts tablosuna 'moving' tipi desteği
-- (branch_type alanı zaten text, sadece 'moving' değeri kullanılabilir)
-- Mevcut tabloya ek kolon gerekmez, branch_type = 'moving' yeterli.

-- 3) Eğer tablo zaten oluşturulduysa distance_km kolonunu ekle
alter table if exists public.moving_orders
  add column if not exists distance_km numeric(8,1);

-- 4) Kontrol
-- select * from public.moving_orders order by created_at desc limit 20;
