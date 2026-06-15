-- Depo kiralama v2: konum, urun olculeri, odeme, sifreler, fatura

alter table public.warehouses
  add column if not exists lat numeric(10, 6),
  add column if not exists lng numeric(10, 6);

alter table public.warehouse_bookings
  add column if not exists storage_days integer default 30,
  add column if not exists length_cm numeric(10, 2),
  add column if not exists width_cm numeric(10, 2),
  add column if not exists height_cm numeric(10, 2),
  add column if not exists weight_kg numeric(10, 2),
  add column if not exists user_lat numeric(10, 6),
  add column if not exists user_lng numeric(10, 6),
  add column if not exists user_address text,
  add column if not exists product_photo text,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists tc_no text,
  add column if not exists email text,
  add column if not exists personal_address text,
  add column if not exists storage_subtotal numeric(12, 2),
  add column if not exists transport_fee numeric(12, 2),
  add column if not exists transport_distance_km numeric(8, 2),
  add column if not exists kdv numeric(12, 2),
  add column if not exists subtotal numeric(12, 2),
  add column if not exists entry_password text,
  add column if not exists exit_password text,
  add column if not exists invoice_no text,
  add column if not exists payment_status text default 'pending',
  add column if not exists paid_at timestamptz;

alter table public.warehouse_bookings add column if not exists currency text default 'TRY';

create index if not exists idx_bookings_payment on public.warehouse_bookings (payment_status);
