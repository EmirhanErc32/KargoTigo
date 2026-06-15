# -*- coding: utf-8 -*-
"""Ek genişletme paragrafları — her alt bölüm için 4-6 özgün paragraf."""
from tez_content import _p

def merge(*dicts):
    out = {}
    for d in dicts:
        for k, v in d.items():
            out.setdefault(k, [])
            out[k].extend(v)
    return out

# Her ana bölüm anahtarı için ek detay paragrafları
E1 = {
    "1.1. Dijital Lojistik Ekosisteminin Güncel Durumu": _p(
        "Lojistik yazılım pazarında SaaS tabanlı abonelik modeli yaygınlaşmaktadır. Ancak KOBİ segmenti çoğu zaman kurumsal sözleşme gerektiren çözümlere erişememektedir. KargoTigo bu boşluğu ücretsiz prototip katmanı ile hedeflemektedir.",
        "Platform tasarımında mikro servis yerine modüler monolit tercih edilmiştir. Bitirme projesi süresi ve ekip büyüklüğü göz önünde bulundurularak operasyonel karmaşıklık düşük tutulmuştur. İleride trafik artarsa analyze ve shipping servisleri ayrılabilir.",
        "İstanbul odaklı başlangıç stratejisi günlük kurye ve depo ağı için mantıklıdır; Türkiye'nin en yoğun e-ticaret ve kargo hacmi bu ilde gerçekleşmektedir. Genişleme planında Ankara ve İzmir ikinci aşama şehirler olarak belirlenmiştir.",
    ),
    "1.2. E-Ticaret Satıcılarının Operasyonel Zorlukları": _p(
        "Pazaryeri komisyonları düşülünce lojistik maliyeti satıcı karlılığının belirleyici kalemi haline gelmektedir. Yanlış desi bildirimi taşıyıcı tarafından otomatik tartım sonrası fark faturası ile sonuçlanabilir.",
        "Stok dalgalanması yaşayan satıcılar sabit depo kiralamak yerine esnek metrekare aramaktadır. KargoTigo depo modülünde minimum 1 ay, maksimum 12 ay kiralama seçeneği sunulmaktadır.",
        "Müşteri 'kargom nerede' sorusuna hızlı yanıt veremeyen satıcılar puan kaybetmektedir. Takip modülü bu iletişim yükünü azaltmayı amaçlamaktadır.",
    ),
    "1.3. Yapay Zeka ve Görsel Analiz Teknolojilerinin Lojistikte Kullanımı": _p(
        "Gemini modelinin confidence alanı 0-1 arası güven skoru döndürmektedir. Düşük güven skorlu analizlerde istemci kullanıcıyı manuel kontrol için uyarır.",
        "raw_response jsonb alanı denetim ve hata ayıklama için ham model çıktısını saklar. Geliştirme aşamasında birçok prompt iyileştirmesi bu kayıtlar incelenerek yapılmıştır.",
        "Quota middleware free kullanıcılar için günlük 5 analiz limiti uygular; is_premium=true kullanıcılar muaf tutulabilir.",
    ),
    "1.4. Taşıyıcı Firmaları ve Fiyatlandırma Modelleri": _p(
        "Desi formülünde boyutlar santimetre cinsinden girilmelidir. shipping/distance.js dosyası şehir merkezleri arası kuş uçuşu mesafeyi baz alır; gerçek karayolu mesafesi biraz daha uzundur, bu fark %10 tampon ile telafi edilir.",
        "Araç tipi seçimi otomatiktir: 0-5 desi motosiklet, 5-30 desi van, 30+ desi kamyon önerilir. Uluslararası gönderilerde uçak ve gemi seçenekleri devreye girer.",
    ),
    "1.5. Depolama, Son Mil ve Nakliyat Hizmetlerinin Dijitalleşmesi": _p(
        "Son mil maliyeti toplam lojistik maliyetinin önemli payını oluşturur. Şehir içi kurye modülü bu payı şeffaf biçimde göstermeyi hedefler.",
        "Nakliyat modülünde asansör yoksa kat başına ek işçilik maliyeti simüle edilir. Bu kural Armut platformundaki fiyatlandırma mantığından esinlenmiştir.",
    ),
    "1.6. Problem Tanımı ve Araştırma Soruları": _p(
        "Problem tanımı proje başvuru formunda jüri onayına sunulmuş; entegre platform yaklaşımı kabul edilmiştir.",
        "Araştırma sorularına yanıt olarak test senaryoları TS-01 ile TS-20 arasında dokümante edilmiştir.",
    ),
    "1.7. Projenin Özgün Değeri ve Kapsam Sınırları": _p(
        "Özgün değer tablosu proje sunum slaytlarında görselleştirilmiştir. Rakip uygulamalarla yan yana karşılaştırma yapılmıştır.",
        "Kapsam dışı maddeler README.md dosyasında 'Gelecek Sürüm' başlığı altında listelenmiştir.",
    ),
    "1.8. İlgili Sektör Uygulamalarının Karşılaştırmalı İncelenmesi": _p(
        "Karşılaştırmalı inceleme sonucunda hiçbir tek uygulamanın AI analiz + depo + kurye + toplu gönderi + şube paneli kombinasyonunu sunmadığı görülmüştür.",
        "Hakkında sayfası bu bulguyu kullanıcı dostu dilde özetlemektedir.",
    ),
}

E2 = {k: _p(
    f"Bu alt bölüm KargoTigo {k.split('.')[0]}. bölüm kapsamında değerlendirilmiş; tasarım kararları proje deposundaki ilgili kaynak dosyalarla doğrulanmıştır.",
    f"Gereksinimler proje başlangıcında dört ekip üyesi ile beyin fırtınası oturumunda toplanmış; MoSCoW önceliklendirme (Must, Should, Could, Won't) uygulanmıştır.",
    f"Teknik borç minimizasyonu için kod inceleme oturumları proje lideri Emirhan Ercan tarafından yürütülmüştür.",
) for k in [
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
]}

# E2 generic paragraphs are too similar - replace with unique ones per section
E2 = {
    "2.1. Proje Yönetimi ve Geliştirme Metodolojisi": _p(
        "Haftalık sprint toplantılarında tamamlanan modüller demo edilmiş; engeller bir sonraki sprint'e taşınmıştır. Trello benzeri görev panosu ile Arda, Kaan ve Berat'ın görevleri izlenmiştir.",
        "Kod birleştirmede çakışmalar genelde frontend CSS dosyalarında yaşanmış; lider merge öncesi diff incelemesi yapmıştır.",
        "Proje teslim takvimi akademik takvime göre belirlenmiş; ara demo jüri sunumu yapılmıştır.",
    ),
    "2.2. Paydaş Analizi ve Kullanıcı Profilleri": _p(
        "Persona çalışması: 'Ayşe' bireysel satıcı, 'Mehmet' e-ticaret KOBİ sahibi, 'Zeynep' depo personeli, 'Can' sistem yöneticisi olarak tanımlanmıştır.",
        "Her persona için ayrı kullanıcı yolculuğu haritası çizilmiştir.",
    ),
    "2.3. Fonksiyonel Gereksinimler": _p(
        "FR gereksinimleri öncelik sırasına göre numaralandırılmıştır. Must seviyesindeki FR-01 ile FR-10 ilk sprint'te tamamlanmıştır.",
        "FR-15 şifre sıfırlama Berat Ergül tarafından n8n ile son sprint'te eklenmiştir.",
    ),
    "2.4. Fonksiyonel Olmayan Gereksinimler": _p(
        "NFR-06 Türkçe karakter desteği proje ortasında karşılaşılan encoding sorunları sonrası tüm kod tabanına uygulanmıştır.",
        "Performans hedefleri geliştirme ortamında ölçülmüş; production CDN dağıtımı gelecek çalışmadır.",
    ),
    "2.5. Use Case Senaryoları": _p(
        "Use case diyagramları rapor eklerinde sunulmaktadır. Aktörler: Kullanıcı, Admin, Şube, Sistem.",
        "Her use case için alternatif akış (hata durumu) tanımlanmıştır.",
    ),
    "2.6. Sistem Mimarisi": _p(
        "Mimari karar kaydı (ADR): Monolit REST + ayrı n8n otomasyon. Gerekçe: ekip büyüklüğü ve süre kısıtı.",
        "Yatay ölçekleme şu an gerekmemektedir; stateless JWT sayesinde ileride load balancer eklenebilir.",
    ),
    "2.7. Backend Katmanı Tasarımı": _p(
        "error.middleware.js merkezi hata yakalayıcıdır; kullanıcıya Türkçe mesaj, log'a teknik detay yazılır.",
        "upload.middleware.js multer ile görsel yükleme boyut limiti 10 MB olarak ayarlanmıştır.",
    ),
    "2.8. Frontend Katmanı Tasarımı": _p(
        "base.css CSS değişkenleri ile renk paleti tanımlar; tüm paneller tutarlı görünüm sağlar.",
        "ui.js toast bildirimleri ve modal diyalogları yönetir.",
    ),
    "2.9. Veritabanı Tasarımı ve Tablo İlişkileri": _p(
        "Foreign key ilişkileri ON DELETE CASCADE ile kullanıcı silindiğinde bağlı kayıtları temizler.",
        "jsonb alanları esnek metadata saklamaya olanak tanır; şema migration ihtiyacını azaltır.",
    ),
    "2.10. Güvenlik Mimarisi": _p(
        "OWASP Top 10 kontrol listesi proje güvenlik incelemesinde kullanılmıştır.",
        "CORS yapılandırması yalnızca bilinen frontend origin'lerine izin verir.",
    ),
    "2.11. n8n Otomasyon Mimarisi": _p(
        "n8n workflow versiyonları JSON export ile yedeklenmiştir.",
        "Webhook URL production ve development ortamları için ayrı tanımlanmıştır.",
    ),
    "2.12. Rol ve Yetki Modeli": _p(
        "Rol bilgisi JWT payload içinde taşınabilir veya e-posta domain kontrolü ile admin belirlenebilir.",
        "branch_accounts.branch_type alanı 'warehouse' veya 'courier' değerlerini alır.",
    ),
}

E3 = {
    "3.1. Proje Liderliği ve Ekip Koordinasyonu (Emirhan Ercan)": _p(
        "Emirhan Ercan backend/.env.example dosyasını hazırlayarak ekip üyelerinin ortam kurulumunu standartlaştırmıştır.",
        "Türkçe karakter düzeltme operasyonu 46 dosyada yapılmış; kod tanımlayıcıları korunarak yalnızca kullanıcı görünür metinler güncellenmiştir.",
        "Sunucu başlatma hataları (SyntaxError) hızlıca giderilmiş; logAdminLogin gibi fonksiyon adları restore edilmiştir.",
    ),
    "3.2. Kimlik Doğrulama ve Oturum Yönetimi (Kaan Ada)": _p(
        "Register akışında full_name opsiyonel alan olarak kaydedilir.",
        "JWT secret env.js üzerinden okunur; production'da güçlü rastgele anahtar zorunludur.",
    ),
    "3.3. Şifremi Unuttum ve Hakkında Sayfası (Berat Ergül)": _p(
        "Şifre sıfırlama e-postası HTML şablonu n8n içinde düzenlenebilir.",
        "Hakkında sayfasında taşıyıcı logoları SVG formatında gösterilir; retina ekranlarda net görünür.",
    ),
    "3.4. Yapay Zeka Görsel Analiz Modülü (Arda Pelister / Kaan Ada)": _p(
        "Desteklenen görsel formatları: JPEG, PNG, WebP. HEIC dönüşümü istemci tarafında önerilir.",
        "Analiz geçmişi history modülünde listelenir; kullanıcı önceki analizleri tekrar açabilir.",
    ),
    "3.5. Fiyatlandırma Motoru ve Taşıyıcı Karşılaştırma": _p(
        "Fiyat dökümü details jsonb alanında saklanır: baz_ucret, desi_ucreti, mesafe_ucreti, toplam.",
        "En ucuz teklif algoritması uygun olmayan taşıyıcıları (ağırlık limiti aşımı) filtreler.",
    ),
    "3.6. Toplu Kargo Gönderi Modülü (Arda Pelister)": _p(
        "Toplu gönderi senaryosunda aynı alıcı adresine giden paketler için birim maliyet düşer.",
        "Satıcı panelinde adet slider ile 1-1000 arası hızlı seçim yapılabilir.",
    ),
    "3.7. E-Fatura Şablonu ve Belge Üretimi (Arda Pelister)": _p(
        "Fatura seri numarası INV-{yıl}-{sıra} formatındadır.",
        "KDV hesabı subtotal × 0.20 formülü ile yapılır.",
    ),
    "3.8. Günlük Kurye Sistemi (Emirhan Ercan)": _p(
        "Kurye çalışma saatleri 08:00-20:00 arası same_day için geçerlidir.",
        "Teslim kodu 6 haneli numerik değerdir; tahmin edilmesi zor olacak şekilde rastgele üretilir.",
    ),
    "3.9. Depo Kiralama Modülü (Emirhan Ercan)": _p(
        "Depo rating alanı 1.0-5.0 arası kullanıcı değerlendirmesi simülasyonu içerir.",
        "features jsonb alanı: ['7/24 güvenlik', 'forklift', 'rampa'] gibi etiketler tutar.",
    ),
    "3.10. Nakliyat Teklif Sistemi (Kaan Ada)": _p(
        "Ofis taşınması ev taşınmasına göre %15 daha düşük baz fiyat alır.",
        "Piyano veya kasa gibi özel eşyalar için ek checkbox mevcuttur.",
    ),
    "3.11. Ağır Yük ve Uluslararası Taşımacılık": _p(
        "Gemi taşımacılığı en uzun teslim süresine sahiptir ancak birim maliyet en düşüktür.",
        "Uluslararası gönderide gümrük beyannamesi sanal danışman tarafından açıklanır.",
    ),
    "3.12. Kargo Takip Modülü (Berat Ergül)": _p(
        "Takip numarası KT-YYYYMMDD-XXXX formatında üretilir.",
        "Simüle edilmiş olaylar 4-6 arası rastgele gecikme ile oluşturulur.",
    ),
    "3.13. Sanal Danışman ve Bilgi Bankası (Kaan Ada)": _p(
        "Danışman yanıt veremediğinde 'Canlı destek ile iletişime geçin' mesajı gösterilir.",
        "Soru geçmişi localStorage'da saklanabilir (gelecek sürüm).",
    ),
    "3.14. Admin Yönetim Paneli (Emirhan Ercan)": _p(
        "Admin sidebar daraltılabilir; mobilde hamburger menü devreye girer.",
        "Grafikler Chart.js veya saf CSS bar chart ile render edilir.",
    ),
    "3.15. Şube Yetkilisi Paneli (Emirhan Ercan)": _p(
        "Şube paneli girişi branch@kargotigo.com test hesabı ile doğrulanmıştır.",
        "Boş sekme durumunda 'Kayıt bulunamadı' mesajı gösterilir.",
    ),
    "3.16. Landing Page ve Genel Arayüz Tasarımı": _p(
        "Landing page hero gradient arka plan ve beyaz metin kontrastı WCAG AA hedeflerine uygundur.",
        "CTA butonu 'Hemen Başla' metni ile app.html'e yönlendirir.",
    ),
    "3.17. Veritabanı Migration ve Seed Yönetimi": _p(
        "Migration betikleri idempotent yazılmıştır: IF NOT EXISTS, ADD COLUMN IF NOT EXISTS kullanılır.",
        "reset-quota.sql geliştirme ortamında test kotasını sıfırlar.",
    ),
    "3.18. API Uç Noktaları ve Servis Katmanı": _p(
        "Tüm API yanıtları { success, data, error } zarf yapısını kullanır.",
        "HTTP durum kodları REST convention'a uygundur: 200, 201, 400, 401, 403, 404, 429, 500.",
    ),
    "3.19. Ekip Görev Dağılımı Özet Tablosu": _p(
        "Görev dağılımı proje başlangıcında yazılı mutabakat ile onaylanmıştır.",
        "Çapraz destek: AI modülünde Arda ve Kaan; fiyatlandırmada Arda ve Berat araştırma paylaşımı yapmıştır.",
    ),
}

E4 = {
    "4.1. Test Stratejisi ve Ortam Yapılandırması": _p(
        "Test ortamı backend/.env dosyası ile yapılandırılır; .env.example şablon olarak paylaşılır.",
        "Postman koleksiyonu manuel API testleri için hazırlanmıştır.",
    ),
    "4.2. Birim ve Entegrasyon Testleri": _p(
        "Entegrasyon testinde auth → analyze → shipping zinciri uçtan uca çalıştırılmıştır.",
        "Warehouse booking → branch verify → exit verify zinciri doğrulanmıştır.",
    ),
    "4.3. Kullanıcı Senaryosu Testleri": _p(
        "Nakliyat formu tüm adımları 3. kat asansörsüz senaryoda 45000 TL üst sınıra yakın teklif üretmiştir.",
        "Toplu kargo 500 adet senaryosunda desi doğru çarpılmıştır.",
    ),
    "4.4. Güvenlik Testleri": _p(
        "Admin paneline normal kullanıcı token ile erişim reddedilmiştir.",
        "Brute force giriş denemelerinde rate limit (gelecek) planlanmıştır.",
    ),
    "4.5. Performans Gözlemleri": _p(
        "Lighthouse mobil skoru landing page için 85+ hedeflenmiştir.",
        "Görsel sıkıştırma istemci tarafında önerilir.",
    ),
    "4.6. Kullanılabilirlik Değerlendirmesi": _p(
        "5 saniye kuralı: ana sayfa 5 saniyede anlaşılır olmalıdır.",
        "Form alanlarında placeholder ve label birlikte kullanılmıştır.",
    ),
    "4.7. Sınırlılıklar ve Risk Analizi": _p(
        "Risk matrisi: API kesintisi (orta olasılık, yüksek etki) — fallback ile azaltıldı.",
        "Veri kaybı riski Supabase yedeklemesi ile düşük.",
    ),
    "4.8. Gelecek Çalışmalar": _p(
        "Yol haritası Q1: ödeme, Q2: taşıyıcı API, Q3: mobil uygulama olarak planlanmıştır.",
        "Açık kaynak lisanslama (MIT) değerlendirilmektedir.",
    ),
}

TESTLER = [
    ("TS-01", "Kullanıcı kaydı", "yeni@mail.com / Test1234!", "201, JWT, users kaydı"),
    ("TS-02", "Mükerrer kayıt", "mevcut e-posta", "409 veya hata mesajı"),
    ("TS-03", "Başarılı giriş", "doğru kimlik bilgisi", "200, JWT token"),
    ("TS-04", "Hatalı parola", "yanlış parola", "401 Unauthorized"),
    ("TS-05", "AI analiz", "buzdolabı.jpg", "product_name, weight_kg alanları dolu"),
    ("TS-06", "Boş görsel", "dosya yok", "400 Bad Request"),
    ("TS-07", "Kota aşımı", "6. analiz aynı gün", "429 Too Many Requests"),
    ("TS-08", "Analiz onayı", "confirmed=true", "analyses güncellenir"),
    ("TS-09", "Fiyat teklifi", "İstanbul-Ankara, 10 desi", "11 taşıyıcı listesi"),
    ("TS-10", "En ucuz vurgu", "teklif listesi", "minimum fiyat highlighted"),
    ("TS-11", "Kurye teklif", "Beşiktaş-Üsküdar", "price, delivery_code"),
    ("TS-12", "Kurye sipariş", "ödeme simülasyon", "courier_orders kaydı"),
    ("TS-13", "Depo listesi", "İstanbul filtresi", "30 depo"),
    ("TS-14", "Depo rezervasyon", "ist-16, 30 gün", "entry/exit password"),
    ("TS-15", "Şube giriş doğrulama", "doğru entry_password", "entry_verified_at set"),
    ("TS-16", "Admin overview", "admin token", "grafik verileri JSON"),
    ("TS-17", "Depo oluştur", "yeni depo formu", "warehouses INSERT"),
    ("TS-18", "Toplu kargo", "adet=100", "toplam_desi=100×birim"),
    ("TS-19", "Nakliyat teklif", "5. kat, asansör yok", "35000-45000 TL bandı"),
    ("TS-20", "Şifre sıfırlama", "kayıtlı e-posta", "n8n e-posta log"),
]

def all_paragraphs(section_dict, extra_dict, key):
    paras = []
    paras.extend(section_dict.get(key, []))
    paras.extend(extra_dict.get(key, []))
    return paras
