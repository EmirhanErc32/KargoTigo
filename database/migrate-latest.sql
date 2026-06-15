-- ============================================================
--  SON GÜNCELLEME MİGRATİONU
--  (Nakliyat + Kurye Yönetimi + Gönderi Sorgula)
--
--  Supabase → SQL Editor → New Query → Yapıştır → Run
-- ============================================================


-- ═══════════════════════════════════════════════════════════
--  ADIM 1: moving_orders tablosunu oluştur (tamamen yeni)
--  (Daha önce migrate-moving.sql çalıştırdıysanız bu kısmı
--   atlayabilirsiniz — "already exists" hatası zararsızdır)
-- ═══════════════════════════════════════════════════════════
create table if not exists public.moving_orders (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references public.users(id) on delete cascade,

  moving_type      text not null,
  room_size        text not null,
  origin_floor     text not null,
  dest_floor       text not null,
  packing_service  text not null,

  origin_address   text,
  dest_address     text,
  contact_name     text,
  contact_phone    text,

  price            numeric(12,2),
  currency         text default 'TRY',
  distance_km      numeric(8,1),

  status           text not null default 'pending_payment',
  payment_status   text default 'pending',
  paid_at          timestamptz,

  confirm_code     text,

  assigned_to      uuid references public.branch_accounts(id) on delete set null,
  assigned_at      timestamptz,
  completed_at     timestamptz,

  created_at       timestamptz not null default now()
);

create index if not exists idx_moving_user     on public.moving_orders (user_id);
create index if not exists idx_moving_status   on public.moving_orders (status);
create index if not exists idx_moving_assigned on public.moving_orders (assigned_to);

alter table public.moving_orders enable row level security;


-- ═══════════════════════════════════════════════════════════
--  ADIM 2: distance_km kolonu (migrate-moving.sql
--  çalıştırıldıysa zaten var, tekrar çalıştırmak zararsız)
-- ═══════════════════════════════════════════════════════════
alter table public.moving_orders
  add column if not exists distance_km numeric(8,1);


-- ═══════════════════════════════════════════════════════════
--  ADIM 3: courier_orders → kurye atama kolonu (YENİ)
--  Admin panelinden moto kuryeye sipariş atamak için
-- ═══════════════════════════════════════════════════════════
alter table public.courier_orders
  add column if not exists assigned_courier uuid references public.branch_accounts(id) on delete set null;

create index if not exists idx_courier_assigned on public.courier_orders (assigned_courier);


-- ═══════════════════════════════════════════════════════════
--  KONTROL SORGULARI (isteğe bağlı — çalıştırmadan önce
--  yorum satırı '#' ile değil '--' ile kaldırın)
-- ═══════════════════════════════════════════════════════════
-- select * from public.moving_orders order by created_at desc limit 10;
-- select column_name, data_type from information_schema.columns
--   where table_name = 'moving_orders';
-- select column_name from information_schema.columns
--   where table_name = 'courier_orders' and column_name = 'assigned_courier';
