-- KargoTigo admin hesabi (normal giris sayfasindan)
-- E-posta: admin@kargotigo.com
-- Sifre: tigotigo1903

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

-- Mevcut kullanicinin AI kotasini sifirlamak icin:
-- DELETE FROM public.api_query_log WHERE user_id = 'USER_UUID_HERE';
