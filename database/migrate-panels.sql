-- ============================================================
-- KargoTigo — Kurye ve Panel Güncellemeleri
-- Supabase SQL Editor > New Query > Run
-- ============================================================

-- 1. Kurye hesabı için telefon numarası kolonu
alter table public.branch_accounts
  add column if not exists contact_phone text;

-- 2. Kurye siparişi: assigned_courier kolonu (daha önce yoksa)
alter table public.courier_orders
  add column if not exists assigned_courier uuid references public.branch_accounts(id) on delete set null;

create index if not exists idx_courier_assigned on public.courier_orders (assigned_courier);

-- 3. Depo rezervasyonu: giriş/çıkış doğrulama zaman damgaları
alter table public.warehouse_bookings
  add column if not exists status text default 'pending';

alter table public.warehouse_bookings
  add column if not exists entry_verified_at timestamptz;

alter table public.warehouse_bookings
  add column if not exists exit_verified_at timestamptz;

-- 4. Moving orders: assigned_to (nakliyeci ataması)
alter table public.moving_orders
  add column if not exists assigned_to uuid references public.branch_accounts(id) on delete set null;

alter table public.moving_orders
  add column if not exists assigned_at timestamptz;

-- 5. Schema cache yenile
notify pgrst, 'reload schema';
