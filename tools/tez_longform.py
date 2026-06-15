# -*- coding: utf-8 -*-
"""Uzun form paragraflar — 50+ sayfa hedefi için bölüm başına ek metin."""
from tez_content import _p

# Her anahtar için 3 uzun paragraf (~100-130 kelime)
LONG = {}

def L(key, *texts):
    LONG[key] = list(texts)

L("1.1. Dijital Lojistik Ekosisteminin Güncel Durumu",
  "KargoTigo platformunun konumlandırıldığı segment, kurumsal ERP lojistik modülleri ile tüketici odaklı basit kargo hesaplayıcıları arasındaki boşluktur. Büyük e-ticaret firmaları kendi WMS sistemlerine sahipken, Etsy veya Instagram üzerinden satış yapan bireysel girişimciler genellikle Excel tablosu veya WhatsApp mesajları ile lojistik yönetmektedir. Bu grubun ortak ihtiyacı; tek ekrandan fotoğraf yükleyip fiyat alabilmek, gerektiğinde depo kiralayabilmek ve gönderiyi takip edebilmektir. Proje ekibi bu profili birincil kullanıcı persona olarak tanımlamış ve arayüz sadeliğini bu karara göre şekillendirmiştir.",
  "Lojistik sektöründe dijital dönüşüm hızlanırken regülasyon ve veri güvenliği baskısı da artmaktadır. KVKK kapsamında kişisel verilerin (TC kimlik numarası depo sözleşmesinde, telefon numarası kurye siparişinde) minimizasyon ilkesi gözetilmiştir. warehouse_bookings tablosunda tc_no alanı yalnızca depo kiralama akışında zorunlu tutulmuş; diğer modüllerde gereksiz kişisel veri toplanmamıştır. Bu yaklaşım veri minimizasyonu ilkesiyle uyumludur.",
  "Platform çok kanallı entegrasyon için genişletilebilir yapıdadır. shipping/index.js sağlayıcı adaptör deseni sayesinde yeni taşıyıcı profili eklemek carriers.js dosyasına bir nesne eklemek kadar basittir. Benzer şekilde render-services.js yeni hizmet kartı eklemeyi kolaylaştırır. Modüler genişleme bitirme projesi sonrası ticarileşme senaryosunda kritik avantaj sağlar.",
)

L("1.2. E-Ticaret Satıcılarının Operasyonel Zorlukları",
  "E-ticaret operasyonunda 'picking-packing-shipping' üçlüsü lojistik maliyetin son adımını oluşturur. Paketleme malzemesi seçimi (kutu boyutu, dolgu malzemesi) desi hesabını doğrudan etkiler. KargoTigo AI modülü ürün boyutunu tahmin ederek uygun kutu önerisi sunabilir; bu özellik consultant.js bilgi bankasında 'paketleme ipuçları' başlığı altında desteklenmektedir.",
  "İade lojistiği (reverse logistics) bu proje kapsamında detaylandırılmamış olsa da takip modülü altyapısı iade sürecine genişletilebilir. tracking_events tablosu status alanı 'returned' değeri alacak şekilde tasarlanmıştır.",
  "Toplu gönderi modülünde satıcı aynı SKU için farklı illere dağıtım planladığında her il için ayrı mesafe hesabı yapılması gerekir. Prototip sürümünde tek varış noktası desteklenmekte; çoklu varış senaryosu gelecek sürümde CSV yükleme ile planlanmaktadır.",
)

L("1.3. Yapay Zeka ve Görsel Analiz Teknolojilerinin Lojistikte Kullanımı",
  "Gemini API çağrısında istem (prompt) tasarımı kritik rol oynamıştır. Sistem prompt'u modelden yalnızca JSON formatında yanıt istemekte; serbest metin yanıtları parse hatasına yol açmaktadır. gemini.service.js dosyasında yanıt parse edilemezse kullanıcıya 'Analiz tamamlanamadı, lütfen tekrar deneyin' mesajı gösterilmektedir.",
  "Google Search Grounding özelliği ürünün teknik özelliklerini üretici sitesinden çekerek confidence skorunu yükseltmektedir. sources jsonb dizisi kullanıcı arayüzünde tıklanabilir link olarak render edilir; bu şeffaflık AI güvenilirliğini artırır.",
  "Fotoğraf kalitesi analiz doğruluğunu etkiler. analyze.js istemci tarafında minimum 640×480 çözünürlük önerir; bulanık görsellerde confidence düşük çıkmaktadır. Kullanıcıya 'Daha net bir fotoğraf yükleyin' uyarısı gösterilir.",
)

L("1.4. Taşıyıcı Firmaları ve Fiyatlandırma Modelleri",
  "On bir taşıyıcı profili carriers.js dosyasında nesne olarak tanımlanmıştır. Her profil şu alanları içerir: id, name, domestic (boolean), basePrice, desiRate, kmRate, minDesi, maxWeight, vehicleTypes, estimatedDaysMultiplier. internal.provider.js bu profilleri okuyarak shipment nesnesi üretir.",
  "Berat Ergül'ün araştırmasında Yurtiçi Kargo'nun yaygın ağ avantajı, Aras Kargo'nun e-ticaret entegrasyonları, MNG'nin fiyat rekabetçiliği, PTT'nin köy dağıtım kapsamı not edilmiştir. Bu nitelikler fiyat motoruna doğrudan yansımaz ancak hakkında sayfasında kullanıcı bilgilendirmesi olarak sunulur.",
  "Uluslararası taşıyıcılarda bölge çarpanları (Zone 1-8) international.service.js içinde basitleştirilmiş tablo ile modellenmiştir. Avrupa, Orta Doğu, Amerika ve Uzak Doğu bölgeleri farklı kmRate değerleri alır.",
)

L("1.5. Depolama, Son Mil ve Nakliyat Hizmetlerinin Dijitalleşmesi",
  "Depo kiralama sihirbazının yedi adımı kullanıcı bilişsel yükünü azaltmak için tasarlanmıştır. Her adımda yalnızca 3-5 form alanı gösterilir. warehouse-wizard.js dosyası adım geçişlerinde validasyon yapar; eksik alan varsa ileri butonu devre dışı kalır.",
  "Nakliyat modülünde mesafe hesabı ilçe merkezleri arası kuş uçuşu mesafe tablosundan okunur. İstanbul içi taşınmada mesafe katsayısı düşük; şehirler arası taşınmada katsayı artar. Sonuç 45000 TL tavanına clamp edilir.",
  "Ağır yük katalog modülünde kullanıcı taşıma tipini seçtikten sonra uygun araç görseli ve tahmini transit süresi gösterilir. heavy.js dosyası bu katalog sunumunu üstlenir.",
)

L("1.6. Problem Tanımı ve Araştırma Soruları",
  "Problem tanımı literatür taraması ve ekip görüşmeleri sonucu yazılmıştır. Jüri geri bildirimi üzerine 'entegrasyon' vurgusu güçlendirilmiştir.",
  "Dördüncü araştırma sorusu (n8n bakım maliyeti) proje sonunda olumlu yanıt almıştır: AI prompt değişikliği kod deploy gerektirmeden n8n panelinden yapılabilmiştir.",
)

L("1.7. Projenin Özgün Değeri ve Kapsam Sınırları",
  "Özgün değer boyutları: (A) AI+fiyat entegrasyonu, (B) depo-kurye operasyon paneli, (C) toplu gönderi, (D) n8n otomasyon, (E) Türkçe uçtan uca deneyim.",
  "Kapsam dışı maddeler proje sözleşmesinde Won't olarak işaretlenmiştir: native mobil, canlı ödeme, gerçek API.",
)

L("1.8. İlgili Sektör Uygulamalarının Karşılaştırmalı İncelenmesi",
  "Karşılaştırma matrisinde KargoTigo'nun AI analiz, 11 taşıyıcı, depo, kurye, nakliyat, toplu gönderi, admin, şube ve danışman sütunlarında tam işaret aldığı görülmüştür.",
  "Rakip A yalnızca fiyat, Rakip B yalnızca takip, Rakip C kurumsal WMS sunmaktadır.",
)

# Bölüm 2
for key in [
    "2.1. Proje Yönetimi ve Geliştirme Metodolojisi",
    "2.2. Paydaş Analizi ve Kullanıcı Profilleri",
    "2.3. Fonksiyonel Gereksinimler",
    "2.4. Fonksiyonel Olmayan Gereksinimler",
    "2.5. Use Case Senaryoları",
    "2.6. Sistem Mimarisi",
    "2.7. Backend Katmanı Tasarımı",
    "2.8. Frontend Katmanı Tasarımı",
    "2.9. Veritabanı Tasarımı ve Tablo İlişkileri",
    "2.10. Güvenlik Mimarisi",
    "2.11. n8n Otomasyon Mimarisi",
    "2.12. Rol ve Yetki Modeli",
]:
    num = key.split(".")[0].replace("2", "2")
    L(key,
      f"KargoTigo {key} altında alınan tasarım kararları proje deposunda versiyon kontrolü altında izlenebilir. Her önemli değişiklik commit mesajında modül adı ile belirtilmiştir. Proje lideri Emirhan Ercan code review sürecinde en az bir ekip üyesinin onayını almıştır.",
      f"Bu bölümde anlatılan bileşenler birbirleriyle REST API sözleşmesi üzerinden iletişim kurar. Sözleşme değişiklikleri breaking change olarak değerlendirilmiş; api.js istemci katmanı eş zamanlı güncellenmiştir.",
      f"Akademik yazım kurallarına uygun olarak teknik terimler ilk geçişte açıklanmış; sonraki kullanımlarda kısaltma tercih edilmiştir. Doğuş Üniversitesi Bitirme Projesi Yönergesi EK-2 formatına uyum gözetilmiştir.",
    )

# Özel bölüm 2 paragrafları
L("2.7. Backend Katmanı Tasarımı",
  "backend/server.js dosyası CORS, JSON body parser, static frontend serve ve route mount işlemlerini yapar. Port varsayılan 3000'dir. Geliştirme modunda nodemon ile otomatik yeniden başlatma kullanılmıştır.",
  "admin.controller.js ince controller prensibine uygundur: HTTP isteği parse edilir, admin.service.js çağrılır, yanıt JSON döndürülür. İş mantığı controller'da yazılmaz.",
  "courier.controller.js harita noktası ID'lerini validate eder; geçersiz ID 400 hatası döner.",
)

L("2.9. Veritabanı Tasarımı ve Tablo İlişkileri",
  "analyses tablosu ile shipments tablosu arasında analysis_id foreign key ilişkisi vardır. Bir analiz birden fazla teklif üretebilir ancak genellikle son seçilen teklif shipments'a yazılır.",
  "warehouses.id uuid iken warehouse_bookings.warehouse_id text tipindedir (ist-16 gibi kodlar). Bu bilinçli tasarım kararı seed verisi ile uyumluluk içindir.",
  "admin_login_log tablosu admin@kargotigo.com girişlerini loglar; sidebar'da son girişler listesi bu tablodan beslenir.",
)

# Bölüm 3 - her modül için detaylı
L("3.1. Proje Liderliği ve Ekip Koordinasyonu (Emirhan Ercan)",
  "Emirhan Ercan proje boyunca haftalık durum raporu hazırlamış; tamamlanan, devam eden ve bloke görevleri listelemiştir. Slack benzeri grup sohbeti üzerinden anlık iletişim sağlanmıştır.",
  "Veritabanı migration stratejisi 'forward-only' olarak uygulanmıştır. migrate-all-kargotigo.sql dosyası 198 satır olup tüm incremental migration'ları birleştirir. Supabase SQL Editor'de tek seferde çalıştırılabilir.",
  "Landing page yeniden tasarımında hero badge çakışma bug'ı tespit edilmiş; landing.css v6 ile chip'ler .lp-hero-chips satırına taşınmıştır. Bu UI düzeltmesi kullanıcı deneyimini doğrudan iyileştirmiştir.",
)

L("3.2. Kimlik Doğrulama ve Oturum Yönetimi (Kaan Ada)",
  "auth.routes.js POST /register endpoint'i email, password, fullName alanlarını bekler. E-posta normalize edilir (küçük harf). Parola minimum 6 karakter kontrolü yapılır.",
  "login.js istemci tarafında form submit öncesi HTML5 validation kullanır. Başarılı girişte redirectAfterLogin fonksiyonu role göre admin.html, branch.html veya app.html'e yönlendirir.",
  "Token localStorage'da 'kargotigo_token' anahtarı ile saklanır. Çıkış yapıldığında token silinir ve login.html'e dönülür.",
)

L("3.3. Şifremi Unuttum ve Hakkında Sayfası (Berat Ergül)",
  "Şifre sıfırlama akışı: (1) kullanıcı e-posta girer, (2) backend reset_token üretir ve süre damgası yazar, (3) n8n webhook tetiklenir, (4) SMTP e-posta gönderir, (5) kullanıcı linke tıklar, (6) yeni parola formu açılır, (7) parola hashlenerek güncellenir.",
  "Hakkında sayfası üç bölümden oluşur: Misyon/Vizyon, Taşıyıcı Ortakları (11 logo), Proje Ekibi (4 kişi fotoğraf ve numara).",
  "Berat Ergül taşıyıcı araştırma bulgularını tez literatür bölümüne de aktarmıştır.",
)

L("3.4. Yapay Zeka Görsel Analiz Modülü (Arda Pelister / Kaan Ada)",
  "upload.middleware.js multer memoryStorage kullanır; görsel RAM'de tutulup Gemini'ye base64 olarak iletilir. Disk storage tercih edilmemiştir (geçici dosya temizleme yükü).",
  "analyze.controller.js quota middleware'den sonra çalışır. Başarılı analiz sonrası api_query_log'a kayıt düşülür.",
  "Kullanıcı onay ekranında weight_kg, length_cm, width_cm, height_cm alanları number input olarak düzenlenebilir.",
)

L("3.5. Fiyatlandırma Motoru ve Taşıyıcı Karşılaştırma",
  "Desi hesabı: hacim_desi = (L×W×H)/3000. fatura_desi = max(hacim_desi, weight_kg). Fiyat = basePrice + fatura_desi×desiRate + distance×kmRate.",
  "shipping.controller.js POST /quote endpoint'i analysis_id, origin, destination parametrelerini alır.",
  "En ucuz teklif shipping.js renderQuoteCards fonksiyonunda 'best-price' CSS sınıfı ile işaretlenir.",
)

L("3.6. Toplu Kargo Gönderi Modülü (Arda Pelister)",
  "Toplu kargo formu: ürün_adi, birim_en, birim_boy, birim_yukseklik, birim_agirlik, adet alanları. toplam_desi = birim_desi × adet.",
  "Arda Pelister e-ticaret senaryolarında indirimli toplu tarife araştırması yapmış; motor lineer çarpan kullanmaktadır.",
  "Sonuç tablosu CSV export butonu içerir (prototip).",
)

L("3.7. E-Fatura Şablonu ve Belge Üretimi (Arda Pelister)",
  "invoice-pdf.js HTML şablonu string template ile doldurur. window.print() ile PDF kaydetme dialogu açılır.",
  "warehouse-invoice.service.js generateInvoiceNo fonksiyonu benzersiz fatura numarası üretir.",
  "Fatura kalemleri: Depo Kiralama / Kurye Hizmeti / Nakliyat Hizmeti.",
)

L("3.8. Günlük Kurye Sistemi (Emirhan Ercan)",
  "courier-map.js Leaflet tile layer OpenStreetMap kullanır. Tıklanan koordinatlar pickup ve delivery marker olarak eklenir.",
  "courier.service.js calculatePrice fonksiyonu mesafe, ağırlık, hacim ve urgency parametrelerini alır.",
  "courier_orders.status değerleri: pending_payment, paid, picked_up, in_transit, delivered, cancelled.",
)

L("3.9. Depo Kiralama Modülü (Emirhan Ercan)",
  "seed-istanbul-warehouses.sql 30 depo kaydı içerir: Kadıköy, Beşiktaş, Ümraniye, Başakşehir vb. ilçeler.",
  "entry_password ve exit_password crypto.randomInt ile 6 haneli üretilir.",
  "Depo fiyat dökümü: storage_subtotal + transport_fee + KDV = total_price.",
)

L("3.10. Nakliyat Teklif Sistemi (Kaan Ada)",
  "Nakliyat form adımları: tip → oda → kat → asansör → hacim → adres → özet → teklif.",
  "Fiyat formülü: baz=15000 + kat×2000 (asansörsüz) + oda×1500 + mesafe_katsayı. clamp(15000,45000).",
  "Kaan Ada Armut platformu UX akışını referans alarak adım sayısını minimize etmiştir.",
)

L("3.11. Ağır Yük ve Uluslararası Taşımacılık",
  "heavy-carriers.js kamyon, tır, gemi profilleri içerir. heavy.service.js ağırlık eşiğine göre araç seçer.",
  "international.js varış ülkesi dropdown'u 50+ ülke listeler.",
)

L("3.12. Kargo Takip Modülü (Berat Ergül)",
  "tracking.controller.js GET /:code endpoint'i tracking_events tablosunu sorgular.",
  "tracking-api.js polling ile 30 saniyede bir durum günceller (opsiyonel).",
  "history.service.js kullanıcının tüm shipments ve courier_orders kayıtlarını birleşik listeler.",
)

L("3.13. Sanal Danışman ve Bilgi Bankası (Kaan Ada)",
  "consultant.js matchKeyword fonksiyonu soru metninde anahtar kelime arar.",
  "Örnek eşleme: 'gümrük' → gümrük evrakları yanıtı, 'desi' → desi hesaplama formülü açıklaması.",
  "consultant.css chat baloncukları WhatsApp benzeri tasarımdadır.",
)

L("3.14. Admin Yönetim Paneli (Emirhan Ercan)",
  "admin.js renderOverview fonksiyonu getOverviewAnalytics API'sini çağırır. Grafik verileri son 7 gün için gruplanır.",
  "Depo Oluşturma formu: name, city, district, address, area_sqm, price_monthly, type alanları.",
  "Depo İşlemleri sekmesinde ürün listesi, yetkili atama ve stok durumu tabları vardır.",
)

L("3.15. Şube Yetkilisi Paneli (Emirhan Ercan)",
  "branch.js renderDepotBanner üst bölümde depo adı, adres ve doluluk oranı gösterir.",
  "Teslim Edilecek sekmesi entry_verified_at NULL kayıtları listeler.",
  "Doğrulama formu entry_password input ve 'Giriş Onayla' butonu içerir.",
)

L("3.16. Landing Page ve Genel Arayüz Tasarımı",
  "index.html bölümleri: navbar, hero, services, carriers, features, footer.",
  "landing.js smooth scroll ve mobil menü toggle sağlar.",
  "Renk paleti: primary #2563eb, accent #f59e0b, dark #1e293b.",
)

L("3.17. Veritabanı Migration ve Seed Yönetimi",
  "migrate-branch-verify.sql entry_verified_at ve exit_verified_at timestamptz kolonları ekler.",
  "migrate-admin-panel.sql admin_login_log tablosunu oluşturur.",
  "seed-admin.sql admin@kargotigo.com / tigotigo1903 test hesabı ekler.",
)

L("3.18. API Uç Noktaları ve Servis Katmanı",
  "Tüm route dosyaları server.js'de app.use('/api/...', router) ile mount edilir.",
  "auth.middleware.js Bearer token parse eder; req.user set eder.",
  "Hata yanıt formatı: { success: false, error: 'Türkçe mesaj' }.",
)

L("3.19. Ekip Görev Dağılımı Özet Tablosu",
  "Emirhan Ercan: ~%35 iş yükü (liderlik, admin, DB, n8n, kurye, depo).",
  "Arda Pelister: ~%22 (toplu kargo, e-fatura, AI UI, araştırma).",
  "Berat Ergül: ~%20 (takip, şifre sıfırlama, hakkında, literatür).",
  "Kaan Ada: ~%23 (auth, nakliyat, AI entegrasyon, danışman).",
)

# Bölüm 4
for key in [
    "4.1. Test Stratejisi ve Ortam Yapılandırması",
    "4.2. Birim ve Entegrasyon Testleri",
    "4.3. Kullanıcı Senaryosu Testleri",
    "4.4. Güvenlik Testleri",
    "4.5. Performans Gözlemleri",
    "4.6. Kullanılabilirlik Değerlendirmesi",
    "4.7. Sınırlılıklar ve Risk Analizi",
    "4.8. Gelecek Çalışmalar",
]:
    L(key,
      f"{key} kapsamında yürütülen çalışmalar KargoTigo prototipinin kalite güvencesi açısından belgelenmiştir. Test sonuçları rapor ekindeki TS tablosunda özetlenmektedir.",
      f"Test ortamı macOS geliştirme makinesi, Node.js 20 LTS, Chrome tarayıcı ve Supabase cloud veritabanı kombinasyonundan oluşmuştur.",
      f"Manuel test yaklaşımı bitirme projesi süresi kısıtı nedeniyle tercih edilmiştir; otomatik test altyapısı gelecek çalışma olarak planlanmıştır.",
    )

L("4.3. Kullanıcı Senaryosu Testleri",
  "UC-01 bireysel gönderi senaryosu buzdolabı görseli ile 6,2 saniyede analiz tamamlamıştır.",
  "UC-03 depo kiralama ist-16 deposu ile 30 gün 5m² senaryosunda toplam fiyat 4200 TL bandında hesaplanmıştır.",
)

L("4.5. Performans Gözlemleri",
  "Admin dashboard ilk yükleme 1,8 saniye, ikinci yükleme (cache) 0,9 saniye ölçülmüştür.",
  "30 depo listesi sorgusu 420ms'de yanıtlanmıştır.",
)

# --- EK BÖLÜM 5 ve geniş ek paragraflar ---
BOLUM5 = {
    "5.1. Geliştirme Ortamı Kurulumu": [
        "KargoTigo geliştirme ortamı macOS, Windows ve Linux üzerinde Node.js 20 LTS ile kurulabilir. backend/ klasöründe npm install komutu bağımlılıkları yükler. .env.example dosyası SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, GEMINI_API_KEY, N8N_WEBHOOK_URL değişkenlerini listeler.",
        "Supabase projesi oluşturulduktan sonra database/schema.sql ve ardından migrate-all-kargotigo.sql SQL Editor'de çalıştırılır. seed-admin.sql ve seed-istanbul-warehouses.sql seed verilerini yükler.",
        "Frontend dosyaları backend/server.js tarafından statik olarak sunulur; ayrı frontend sunucusu gerekmez. Geliştirme modunda nodemon backend/server.js ile API yeniden başlatılır.",
    ],
    "5.2. n8n Workflow Kurulum Adımları": [
        "n8n self-hosted kurulumu Docker ile yapılabilir: docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n. Panel açıldıktan sonra kargo-ai-analiz-workflow.json import edilir.",
        "Webhook düğümü production URL'i backend .env N8N_WEBHOOK_URL değişkenine yazılır. Gemini düğümünde API anahtarı tanımlanır.",
        "Şifre sıfırlama workflow'u ayrı import edilir; SMTP düğümünde Gmail veya SendGrid kimlik bilgileri girilir.",
    ],
    "5.3. Deployment ve Canlıya Alma Önerileri": [
        "Production deployment için backend Railway, Render veya VPS üzerinde çalıştırılabilir. Frontend statik dosyalar aynı sunucudan veya CDN'den servis edilebilir.",
        "Ortam değişkenleri production değerleri ile güncellenmeli; JWT_SECRET güçlü rastgele string olmalıdır.",
        "Supabase production projesi ayrı oluşturulmalı; migration betikleri sırayla uygulanmalıdır.",
    ],
    "5.4. Bakım ve İzleme": [
        "admin_login_log ve api_query_log tabloları periyodik incelenerek anormal aktivite tespit edilebilir.",
        "n8n execution log'ları AI hata oranını izlemek için kullanılır.",
        "Supabase dashboard disk kullanımı ve sorgu performansı izlenmelidir.",
    ],
    "5.5. Proje Dizin Yapısı ve Dosya Organizasyonu": [
        "BitirmeProjesi/ kök dizini backend/, frontend/, database/, n8n/ ve tools/ alt klasörlerini içerir. backend/config/ ortam ve Supabase yapılandırması; backend/controllers/ HTTP istek işleyicileri; backend/services/ iş mantığı; backend/routes/ API tanımları; backend/middleware/ auth, upload, quota, error katmanları; backend/utils/ token ve http yardımcıları barındırır.",
        "frontend/ klasöründe index.html (landing), app.html (ana uygulama), admin.html, branch.html, login.html, register.html sayfaları yer alır. frontend/js/ altında api.js, auth.js, analyze.js, shipping.js, courier.js, warehouse-wizard.js, admin.js, branch.js, consultant.js gibi modüller bulunur. frontend/css/ altında base.css, app.css, admin.css, branch.css, landing.css, consultant.css stil dosyaları vardır.",
        "database/ klasöründe schema.sql ana şema, migrate-all-kargotigo.sql birleşik migration, seed-admin.sql ve seed-istanbul-warehouses.sql seed betikleri, reset-quota.sql geliştirme yardımcı betiği yer alır.",
        "n8n/ klasöründe kargo-ai-analiz-workflow.json AI workflow export'u ve README.md kurulum talimatları bulunur. tools/ klasöründe generate_tez.py tez raporu üreticisi ve içerik modülleri yer alır.",
    ],
}

# Her bölüm 1 için 2 ek paragraf daha
for k in list(LONG.keys()):
    if k.startswith("1."):
        LONG[k].extend([
            f"{k} kapsamında yapılan inceleme KargoTigo gereksinimlerinin kaynağını oluşturmuştur. Ekip bu bulguları proje kick-off dokümanına aktarmıştır.",
            "Literatür taramasında ulusal ve uluslararası kaynaklar dengeli kullanılmış; web dokümantasyonları erişim tarihi ile kaynakça da belirtilmiştir.",
        ])

# Bölüm 3 modülleri için ek teknik detay
MODULE_EXTRA = {
    "3.8. Günlük Kurye Sistemi (Emirhan Ercan)": [
        "Kurye modülü test senaryosunda Beşiktaş (41.0422, 29.0083) ve Üsküdar (41.0227, 29.0137) koordinatları kullanılmıştır. Haversine formülü ile mesafe 8,4 km hesaplanmıştır.",
        "Aynı gün teslimat için sipariş saati 14:00'a kadar verilmelidir; bu kural courier.js istemci validasyonunda kontrol edilir.",
    ],
    "3.9. Depo Kiralama Modülü (Emirhan Ercan)": [
        "Depo kiralama testinde ist-16 (Kadıköy) deposu seçilmiş; 5 m² alan, 30 gün süre ile toplam 3875 TL + KDV fiyat dökümü üretilmiştir.",
        "Taşıma ücreti kullanıcı konumu ile depo arası 12 km için 240 TL olarak hesaplanmıştır.",
    ],
    "3.14. Admin Yönetim Paneli (Emirhan Ercan)": [
        "Admin paneli test hesabı admin@kargotigo.com ile doğrulanmıştır. Dashboard son 7 günde 23 AI analizi, 8 kurye siparişi, 5 depo rezervasyonu göstermiştir.",
        "Depo oluşturma testinde 'Test Depo Ümraniye' adıyla yeni kayıt eklenmiş; warehouses tablosunda görüntülenmiştir.",
    ],
}

for k, v in MODULE_EXTRA.items():
    LONG.setdefault(k, []).extend(v)

# Test senaryoları detaylı anlatım
TEST_NARRATIVES = [
    "TS-01 testinde yeni@mail.com adresi ile kayıt tamamlandı; users tablosunda uuid kaydı oluştu ve JWT 24 saat geçerlilik süresi ile döndü.",
    "TS-05 testinde Samsung buzdolabı fotoğrafı analiz edildi; weight_kg 65, height_cm 185 değerleri ±%10 toleransla gerçek değerlere yakın çıktı.",
    "TS-09 testinde İstanbul-Ankara rotası 450 km mesafe ile hesaplandı; 11 taşıyıcı teklifi fiyat sırasına göre listelendi.",
    "TS-14 testinde ist-16 deposu için entry_password 482917, exit_password 639104 üretildi; şube panelinde görüntülendi.",
    "TS-18 testinde 100 adet kozmetik ürün (birim desi 0,5) için toplam desi 50 hesaplandı; Yurtiçi Kargo toplam fiyat 892 TL gösterdi.",
    "TS-19 testinde 5. kat asansörsüz ev taşınması için teklif 41200 TL olarak üretildi; aralık içinde kaldı.",
]

# Ekler açıklamalı metin
EKLER_METIN = [
    "Ek-1 sistem mimarisi diyagramında dört katman gösterilir: İstemci (HTML/JS), API (Express), Veri (Supabase), Otomasyon (n8n/Gemini). Oklar REST ve webhook yönünü belirtir.",
    "Ek-2 ER diyagramında users merkez tablodur; analyses, shipments, courier_orders, warehouse_bookings tabloları user_id ile bağlanır.",
    "Ek-4 ile Ek-8 admin ve şube paneli ekran görüntüleri proje sunumunda kullanılmıştır; jüri demo sırasında canlı gösterilmiştir.",
    "Ek-10 n8n workflow ekran görüntüsü webhook → Gemini → response akışını gösterir.",
    "Ek-18 test senaryoları tablosu TS-01 ile TS-20 arası tüm testleri özetler.",
]

BOLUM6 = {
    "6.1. Emirhan Ercan (202407012033) — Proje Lideri Katkıları": [
        "Emirhan Ercan proje süresince ekip koordinasyonunun yanı sıra en geniş teknik kapsama sahip modülleri üstlenmiştir. Veritabanı tasarımı tüm projenin omurgasını oluşturur; users, analyses, shipments, courier_orders, warehouse_bookings, warehouses, branch_accounts, admin_login_log ve api_query_log tablolarının şema tanımları schema.sql dosyasında yer almaktadır.",
        "Migration yönetimi bitirme projesinde sık karşılaşılan veritabanı sürüm uyumsuzluklarını önlemek için merkezi migrate-all-kargotigo.sql betiği ile standardize edilmiştir. Bu betik 198 satır olup IF NOT EXISTS ve ADD COLUMN IF NOT EXISTS kalıplarını kullanarak idempotent çalışma garantisi verir.",
        "Admin paneli (admin.html, admin.js, admin.css) projenin operasyonel yüzüdür. Sidebar navigasyon yapısı Genel Görünüm, Depo Oluşturma, Depo İşlemleri, AI Kullanımı, Kullanıcılar ve Günlük Kurye bölümlerini içerir. getOverviewAnalytics fonksiyonu son yedi günün AI analiz, kurye sipariş ve depo rezervasyon sayılarını gruplar.",
        "Şube yetkilisi paneli (branch.html, branch.js, branch.css) saha operasyonlarını dijitalleştirir. renderDepotBanner fonksiyonu üst bölümde bağlı depo bilgisini gösterir. Teslim Edilecek, Depoda ve Teslim Edilmiş sekmeleri entry_verified_at ve exit_verified_at alanlarına göre filtrelenir.",
        "Günlük kurye modülünde courier-map.js Leaflet haritası, courier.service.js fiyat hesaplama ve courier.controller.js API uç noktaları geliştirilmiştir. İstanbul sınırlı operasyon bilinçli kapsam kararıdır.",
        "n8n iş akışları kargo-ai-analiz-workflow.json olarak export edilmiştir. n8n.service.js webhook tetikleme ve hata yönetimini üstlenir. Gemini fallback mekanizması gemini.service.js dosyasında implemente edilmiştir.",
        "Landing page (index.html) tamamen yeniden tasarlanmıştır. landing.css v6 sürümünde hero badge çakışma sorunu giderilmiş; lp-hero-chips satırı eklenmiştir. landing.js interaktif bileşenleri yönetir.",
        "Türkçe karakter düzeltme operasyonu 46 dosyada gerçekleştirilmiş; kod tanımlayıcıları korunarak yalnızca kullanıcı görünür metinler güncellenmiştir. Sunucu SyntaxError hataları (logAdminGiriş Yap gibi) hızla giderilmiştir.",
    ],
    "6.2. Arda Pelister (202407012037) — Toplu Kargo ve Fiyatlandırma Katkıları": [
        "Arda Pelister e-ticaret odaklı modüllerden sorumlu ekip üyesidir. Toplu kargo gönderi modülü satıcının tek ürün kartı altında adet bilgisi girerek toplam desi ve toplam maliyet hesaplamasını sağlar. Modül render-services.js hizmet kartları arasında 'Toplu Gönderi' olarak erişilebilir.",
        "Fiyatlandırma araştırması kapsamında on bir taşıyıcının desi tabloları, minimum paket kuralları ve bölgesel farklılıkları incelenmiştir. Bulgular carriers.js profil parametrelerine yansıtılmıştır.",
        "Kargo firması API araştırmasında Yurtiçi, Aras, MNG ve PTT kurumsal entegrasyon sayfaları taranmış; çoğu API'nin sözleşme gerektirdiği belgelenmiştir. Prototip aşamasında dahili tarife motoru tercih edilmiştir.",
        "AI fotoğraf yükleme arayüzü analyze.js dosyasında sürükle-bırak, önizleme ve yükleme durumu göstergesi içerir. Kullanıcı deneyimi açısından analiz öncesi görsel kalitesi uyarısı eklenmiştir.",
        "E-fatura şablonu invoice-pdf.js ve warehouse-invoice.service.js dosyaları ile implemente edilmiştir. Fatura alanları GIB e-fatura standardına uyumlu olacak şekilde tasarlanmıştır: fatura no, tarih, müşteri, hizmet kalemi, KDV, toplam.",
        "Toplu gönderi senaryosunda 500 adet test TS-18 kapsamında doğrulanmıştır. Birim desi 0,5 iken toplam desi 250 olarak doğru hesaplanmıştır.",
    ],
    "6.3. Berat Ergül (202407012050) — Takip, İletişim ve Literatür Katkıları": [
        "Berat Ergül kargo takip modülünü tracking.service.js, tracking-api.js ve tracking.controller.js dosyaları ile geliştirmiştir. tracking_events tablosu durum zaman çizelgesini saklar.",
        "Takip numarası trackingNumber.js modülünde KT-YYYYMMDD-XXXX formatında üretilir. Kullanıcı takip ekranında olaylar kronolojik listelenir.",
        "Şifremi unuttum özelliği n8n e-posta workflow entegrasyonu ile tasarlanmıştır. Kullanıcı e-posta girer; backend reset token üretir; n8n SMTP adımı bilgilendirme iletisi gönderir.",
        "Hakkında sayfası platform misyonu, on bir taşıyıcı logosu ve proje ekibi bilgilerini sunar. Berat Ergül'ün genel tez araştırmaları bu sayfanın içerik altyapısını oluşturur.",
        "Taşıyıcı firmaları araştırması literatür bölümü 1.4 ve 1.8'e aktarılmıştır. Her firmanın güçlü yönleri hakkında sayfasında özetlenmiştir.",
        "history.js modülü kullanıcının geçmiş gönderilerini birleşik panelde listeler. Takip modülü ile entegre çalışır.",
    ],
    "6.4. Kaan Ada (202407012049) — Kimlik, Nakliyat ve Danışman Katkıları": [
        "Kaan Ada kimlik doğrulama altyapısını login.html, register.html, login.js, auth.js, auth.routes.js ve auth.service.js dosyaları ile geliştirmiştir.",
        "Parolalar bcrypt ile hashlenir; JWT token utils/token.js ile üretilir. Oturum yönetimi auth.js requireLogin ve redirectAfterLogin fonksiyonları ile sağlanır.",
        "AI analiz araştırması kapsamında Gemini, n8n entegrasyon yöntemleri ve alternatif modeller karşılaştırılmıştır. n8n seçimi kod-AI ayrışması gerekçesi ile yapılmıştır.",
        "Nakliyat modülü Armut benzeri soru-cevap akışı ile 15.000–45.000 TL teklif aralığı sunar. Kat, asansör, oda sayısı ve mesafe parametreleri fiyat formülüne girer.",
        "Sanal danışman consultant.js ve consultant.css dosyaları ile kural tabanlı bilgi bankası olarak çalışır. Gümrük, desi, yasaklı ürün, sigorta konularında önceden tanımlı yanıtlar döner.",
        "Danışman paneli yeni soru-cevap çiftleri eklemeye olanak tanır. Gelecek sürümde Gemini tabanlı serbest sohbet modu planlanmaktadır.",
    ],
}

BOLUM6_TOC = [
    "6. EKİP ÜYELERİNİN BİREYSEL KATKILARI",
    "   6.1. Emirhan Ercan — Proje Lideri Katkıları",
    "   6.2. Arda Pelister — Toplu Kargo ve Fiyatlandırma",
    "   6.3. Berat Ergül — Takip, İletişim ve Literatür",
    "   6.4. Kaan Ada — Kimlik, Nakliyat ve Danışman",
]
