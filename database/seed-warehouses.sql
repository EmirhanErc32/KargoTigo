-- Depo ornek verileri (schema.sql calistirildiktan sonra)
insert into public.warehouses (name, city, district, address, area_sqm, available_sqm, price_monthly, features, type, rating)
values
  ('Istanbul Avrupa Lojistik Merkezi', 'Istanbul', 'Esenyurt', 'Kisi OSB, Depo Blok A', 2500, 1800, 185, '["24s Guvenlik","Forklift","Yukleme Rampasi","WMS Entegrasyonu"]', 'standard', 4.8),
  ('Ankara Siteler Depo Kompleksi', 'Ankara', 'Siteler', 'Sanayi Caddesi No:42', 1200, 650, 142, '["Kapali Depo","7/24 Kamera","Nem Kontrolu"]', 'standard', 4.5),
  ('Izmir Kemalpasa Fulfillment', 'Izmir', 'Kemalpasa', 'Ataturk OSB, C Blok', 800, 420, 128, '["E-ticaret Fulfillment","Paketleme Hatti","Kargo Entegrasyonu"]', 'fulfillment', 4.7),
  ('Bursa Soguk Zincir Deposu', 'Bursa', 'Nilufer', 'Gorukle Sanayi Bolgesi', 600, 280, 220, '["Soguk Zincir","Hijyen Sertifikali","24s Izleme"]', 'cold', 4.9),
  ('Antalya Serbest Bolge Antrepo', 'Antalya', 'Serbest Bolge', 'Antalya Serbest Bolge A-12', 3000, 1500, 165, '["Gumruklu Antrepo","Uluslararasi Transit","Gumruk Danismanligi"]', 'bonded', 4.6),
  ('Gaziantep Tekstil Deposu', 'Gaziantep', 'Sehitkamil', '5. Organize Sanayi Bolgesi', 1500, 900, 98, '["Raf Sistemi","Yuksek Tavan","Kolay Ulasim"]', 'standard', 4.4)
on conflict do nothing;
