-- Depo ID'leri seed kodu (ist-16) — uuid FK kaldirilir

alter table public.warehouse_bookings drop constraint if exists warehouse_bookings_warehouse_id_fkey;

alter table public.warehouse_bookings
  alter column warehouse_id type text using warehouse_id::text;

alter table public.warehouse_bookings add column if not exists warehouse_name text;
alter table public.warehouse_bookings add column if not exists warehouse_city text;
alter table public.warehouse_bookings add column if not exists warehouse_district text;
