-- Istanbul 30 depo seed (migrate-warehouse-v2.sql sonrasi calistirin)

insert into public.warehouses (name, city, district, address, lat, lng, area_sqm, available_sqm, price_monthly, features, type, rating, available)
values
  ('Istanbul Kadikoy Depo Merkezi', 'Istanbul', 'Kadikoy', 'Kadikoy OSB, Depo Blok A-1', 40.9927, 29.0277, 800, 520, 210, '["24s Guvenlik","Kamera","Yukleme Rampasi","Forklift","Raf Sistemi"]', 'standard', 4.2, true),
  ('Istanbul Besiktas Depo Merkezi', 'Istanbul', 'Besiktas', 'Besiktas OSB, Depo Blok B-2', 41.0422, 29.0089, 1200, 780, 245, '["24s Guvenlik","Kamera","Yukleme Rampasi","Forklift","Raf Sistemi"]', 'standard', 4.3, true),
  ('Istanbul Sisli Depo Merkezi', 'Istanbul', 'Sisli', 'Sisli OSB, Depo Blok C-3', 41.0602, 28.9877, 1600, 1040, 230, '["24s Guvenlik","Kamera","Yukleme Rampasi","Paketleme","Kargo Entegrasyonu"]', 'fulfillment', 4.4, true),
  ('Istanbul Bakirkoy Depo Merkezi', 'Istanbul', 'Bakirkoy', 'Bakirkoy OSB, Depo Blok D-4', 40.978, 28.872, 2000, 1300, 195, '["24s Guvenlik","Kamera","Yukleme Rampasi","Soguk Zincir (+2/+8C)","Nem Kontrolu"]', 'cold', 4.5, true),
  ('Istanbul Esenyurt Depo Merkezi', 'Istanbul', 'Esenyurt', 'Esenyurt OSB, Depo Blok E-5', 41.029, 28.679, 800, 520, 145, '["24s Guvenlik","Kamera","Yukleme Rampasi","Gumruklu Alan","Antrepo"]', 'bonded', 4.6, true),
  ('Istanbul Umraniye Depo Merkezi', 'Istanbul', 'Umraniye', 'Umraniye OSB, Depo Blok F-6', 41.016, 29.124, 1200, 780, 175, '["24s Guvenlik","Kamera","Yukleme Rampasi","Forklift","Raf Sistemi"]', 'standard', 4.7, true),
  ('Istanbul Kartal Depo Merkezi', 'Istanbul', 'Kartal', 'Kartal OSB, Depo Blok A-7', 40.906, 29.172, 1600, 1040, 160, '["24s Guvenlik","Kamera","Yukleme Rampasi","Forklift","Raf Sistemi"]', 'standard', 4.8, true),
  ('Istanbul Pendik Depo Merkezi', 'Istanbul', 'Pendik', 'Pendik OSB, Depo Blok B-8', 40.877, 29.234, 2000, 1300, 155, '["24s Guvenlik","Kamera","Yukleme Rampasi","Paketleme","Kargo Entegrasyonu"]', 'fulfillment', 4.9, true),
  ('Istanbul Tuzla Depo Merkezi', 'Istanbul', 'Tuzla', 'Tuzla OSB, Depo Blok C-9', 40.817, 29.3, 800, 520, 150, '["24s Guvenlik","Kamera","Yukleme Rampasi","Soguk Zincir (+2/+8C)","Nem Kontrolu"]', 'cold', 4.2, true),
  ('Istanbul Basaksehir Depo Merkezi', 'Istanbul', 'Basaksehir', 'Basaksehir OSB, Depo Blok D-10', 41.093, 28.802, 1200, 780, 165, '["24s Guvenlik","Kamera","Yukleme Rampasi","Gumruklu Alan","Antrepo"]', 'bonded', 4.3, true)
on conflict do nothing;

-- Kalan 20 depo icin backend fallback (istanbul-warehouses.js) kullanilir veya benzer insert devam ettirilebilir.
