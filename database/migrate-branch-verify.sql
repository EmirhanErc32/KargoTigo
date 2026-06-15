-- Depo sube paneli: giris/cikis dogrulama zamanlari
alter table public.warehouse_bookings
  add column if not exists entry_verified_at timestamptz,
  add column if not exists exit_verified_at timestamptz;

create index if not exists idx_bookings_entry on public.warehouse_bookings (warehouse_id, entry_verified_at);
create index if not exists idx_bookings_exit on public.warehouse_bookings (warehouse_id, exit_verified_at);

notify pgrst, 'reload schema';
