# -*- coding: utf-8 -*-
"""KargoTigo tez raporu — genişletilmiş özgün içerik metinleri."""

TOC = [
    "KISALTMALAR",
    "GİRİŞ",
    "I. LİTERATÜR TARAMASI VE PROBLEM TANIMI",
    "   1.1. Dijital Lojistik Ekosisteminin Güncel Durumu",
    "   1.2. E-Ticaret Satıcılarının Operasyonel Zorlukları",
    "   1.3. Yapay Zeka ve Görsel Analiz Teknolojilerinin Lojistikte Kullanımı",
    "   1.4. Taşıyıcı Firmaları ve Fiyatlandırma Modelleri",
    "   1.5. Depolama, Son Mil ve Nakliyat Hizmetlerinin Dijitalleşmesi",
    "   1.6. Problem Tanımı ve Araştırma Soruları",
    "   1.7. Projenin Özgün Değeri ve Kapsam Sınırları",
    "   1.8. İlgili Sektör Uygulamalarının Karşılaştırmalı İncelenmesi",
    "II. SİSTEM ANALİZİ VE TASARIM",
    "   2.1. Proje Yönetimi ve Geliştirme Metodolojisi",
    "   2.2. Paydaş Analizi ve Kullanıcı Profilleri",
    "   2.3. Fonksiyonel Gereksinimler",
    "   2.4. Fonksiyonel Olmayan Gereksinimler",
    "   2.5. Use Case Senaryoları",
    "   2.6. Sistem Mimarisi",
    "   2.7. Backend Katmanı Tasarımı",
    "   2.8. Frontend Katmanı Tasarımı",
    "   2.9. Veritabanı Tasarımı ve Tablo İlişkileri",
    "   2.10. Güvenlik Mimarisi",
    "   2.11. n8n Otomasyon Mimarisi",
    "   2.12. Rol ve Yetki Modeli",
    "III. UYGULAMA VE MODÜL DETAYLARI",
    "   3.1. Proje Liderliği ve Ekip Koordinasyonu (Emirhan Ercan)",
    "   3.2. Kimlik Doğrulama ve Oturum Yönetimi (Kaan Ada)",
    "   3.3. Şifremi Unuttum ve Hakkında Sayfası (Berat Ergül)",
    "   3.4. Yapay Zeka Görsel Analiz Modülü (Arda Pelister / Kaan Ada)",
    "   3.5. Fiyatlandırma Motoru ve Taşıyıcı Karşılaştırma",
    "   3.6. Toplu Kargo Gönderi Modülü (Arda Pelister)",
    "   3.7. E-Fatura Şablonu ve Belge Üretimi (Arda Pelister)",
    "   3.8. Günlük Kurye Sistemi (Emirhan Ercan)",
    "   3.9. Depo Kiralama Modülü (Emirhan Ercan)",
    "   3.10. Nakliyat Teklif Sistemi (Kaan Ada)",
    "   3.11. Ağır Yük ve Uluslararası Taşımacılık",
    "   3.12. Kargo Takip Modülü (Berat Ergül)",
    "   3.13. Sanal Danışman ve Bilgi Bankası (Kaan Ada)",
    "   3.14. Admin Yönetim Paneli (Emirhan Ercan)",
    "   3.15. Şube Yetkilisi Paneli (Emirhan Ercan)",
    "   3.16. Landing Page ve Genel Arayüz Tasarımı",
    "   3.17. Veritabanı Migration ve Seed Yönetimi",
    "   3.18. API Uç Noktaları ve Servis Katmanı",
    "   3.19. Ekip Görev Dağılımı Özet Tablosu",
    "IV. TEST, DEĞERLENDİRME VE SONUÇLAR",
    "   4.1. Test Stratejisi ve Ortam Yapılandırması",
    "   4.2. Birim ve Entegrasyon Testleri",
    "   4.3. Kullanıcı Senaryosu Testleri",
    "   4.4. Güvenlik Testleri",
    "   4.5. Performans Gözlemleri",
    "   4.6. Kullanılabilirlik Değerlendirmesi",
    "   4.7. Sınırlılıklar ve Risk Analizi",
    "   4.8. Gelecek Çalışmalar",
    "V. KURULUM, DEPLOYMENT VE BAKIM",
    "   5.1. Geliştirme Ortamı Kurulumu",
    "   5.2. n8n Workflow Kurulum Adımları",
    "   5.3. Deployment ve Canlıya Alma Önerileri",
    "   5.4. Bakım ve İzleme",
    "   5.5. Proje Dizin Yapısı ve Dosya Organizasyonu",
    "VI. EKİP ÜYELERİNİN BİREYSEL KATKILARI",
    "   6.1. Emirhan Ercan — Proje Lideri Katkıları",
    "   6.2. Arda Pelister — Toplu Kargo ve Fiyatlandırma",
    "   6.3. Berat Ergül — Takip, İletişim ve Literatür",
    "   6.4. Kaan Ada — Kimlik, Nakliyat ve Danışman",
    "   6.5. Taşıyıcı Firmaları Profil Detayları",
    "   6.6. Kaynak Kod Dosya Envanteri",
    "VII. MATEMATİKSEL MODELLER VE HESAPLAMA FORMÜLLERİ",
    "   7.1. Desi ve Fatura Ağırlığı Hesabı",
    "   7.2. Taşıyıcı Fiyat Formülü",
    "   7.3. Kurye Ücret Formülü",
    "   7.4. Depo Kiralama Fiyat Formülü",
    "   7.5. Nakliyat Teklif Formülü",
    "   7.6. Toplu Gönderi Desi Formülü",
    "   7.7. Test Senaryoları Adım Adım Yürütme Kayıtları",
    "VIII. PROJE TAKVİMİ VE KİLOMETRE TAŞLARI",
    "   8.1. Proje Başarı Kriterleri ve Değerlendirme",
    "SONUÇ",
    "KAYNAKÇA",
    "EKLER",
]

KISALTMALAR = [
    ("AI", "Artificial Intelligence — Yapay Zeka"),
    ("API", "Application Programming Interface — Uygulama Programlama Arayüzü"),
    ("BCrypt", "Blowfish tabanlı parola hash algoritması"),
    ("BI", "Business Intelligence — İş Zekâsı"),
    ("CRUD", "Create, Read, Update, Delete — Temel veri işlemleri"),
    ("CSS", "Cascading Style Sheets — Stil tanımlama dili"),
    ("CSV", "Comma-Separated Values — Virgülle ayrılmış değerler"),
    ("Desi", "Kargo hacim-ağırlık birimi (cm³/3000)"),
    ("DOM", "Document Object Model — Belge nesne modeli"),
    ("EKAP", "Elektronik Kamu Alımları Platformu"),
    ("ESM", "ECMAScript Modules — JavaScript modül standardı"),
    ("GIB", "Gelir İdaresi Başkanlığı"),
    ("HTML", "HyperText Markup Language"),
    ("HTTP", "HyperText Transfer Protocol"),
    ("JSON", "JavaScript Object Notation"),
    ("JWT", "JSON Web Token — Oturum belirteci standardı"),
    ("KDV", "Katma Değer Vergisi"),
    ("Leaflet", "Açık kaynak harita kütüphanesi"),
    ("MVC", "Model-View-Controller mimari deseni"),
    ("n8n", "Low-code iş akışı otomasyon platformu"),
    ("ORM", "Object-Relational Mapping"),
    ("PDF", "Portable Document Format"),
    ("REST", "Representational State Transfer"),
    ("RLS", "Row Level Security — Satır düzeyinde güvenlik"),
    ("SMTP", "Simple Mail Transfer Protocol"),
    ("SQL", "Structured Query Language"),
    ("TC", "Türkiye Cumhuriyeti Kimlik Numarası"),
    ("UI", "User Interface — Kullanıcı arayüzü"),
    ("UX", "User Experience — Kullanıcı deneyimi"),
    ("UUID", "Universally Unique Identifier"),
]

def _p(*args):
    return list(args)

GIRIS = _p(
    "Son on yılda Türkiye'de e-ticaret cirosu istikrarlı biçimde büyümüş; bu büyüme beraberinde paket gönderim hacminin de katlanarak artmasına yol açmıştır. Pazaryeri satıcıları, sosyal medya üzerinden satış yapan bireysel girişimciler ve ikinci el ürün gönderen son kullanıcılar, lojistik sürecin her aşamasında farklı zorluklarla karşılaşmaktadır. Ürün boyutunun yanlış bildirilmesi ek maliyet doğururken; depo ihtiyacının plansız karşılanması stok kaybına; teslimatın izlenememesi ise müşteri şikâyetlerine neden olmaktadır. Bu tablo, yalnızca fiyat hesaplayan basit araçların yetersiz kaldığını; operasyonel süreçleri uçtan uca destekleyen bütünleşik platformlara duyulan ihtiyacı ortaya koymaktadır.",
    "KargoTigo projesi, Doğuş Üniversitesi Meslek Yüksekokulu Bilgisayar Programcılığı Programı bitirme projesi kapsamında dört kişilik bir ekip tarafından geliştirilmiştir. Proje lideri Emirhan Ercan (202407012033) koordinasyonunda; Arda Pelister (202407012037), Kaan Ada (202407012049) ve Berat Ergül (202407012050) modüler görev paylaşımı ile çalışmıştır. Platformun temel fikri, kullanıcının elindeki ürün fotoğrafından yola çıkarak yapay zeka ile fiziksel özellik çıkarımı yapmak; elde edilen verilerle on bir taşıyıcı firma profili üzerinden fiyat karşılaştırması sunmak; bunun yanı sıra İstanbul odaklı günlük kurye, otuz noktalı depo kiralama, ev ve ofis nakliyatı, ağır yük taşımacılığı, toplu e-ticaret gönderisi, kargo izleme, e-fatura üretimi ve sanal lojistik danışmanlığı hizmetlerini tek çatı altında toplamaktır.",
    "Geliştirme sürecinde Node.js ve Express.js tabanlı REST API mimarisi benimsenmiş; veriler Supabase üzerinde PostgreSQL ilişkisel veritabanında saklanmıştır. Kimlik doğrulama JWT belirteci ve bcrypt parola hashleme ile sağlanmış; görsel analiz Google Gemini modeli üzerinden n8n iş akışı otomasyonu ile tetiklenmiştir. Yönetim tarafında admin paneli operasyonel istatistikler, depo oluşturma ve kullanıcı yönetimi sunarken; şube yetkilisi paneli saha personelinin giriş-çıkış doğrulamasını dijital ortamda yürütmesine olanak tanımaktadır.",
    "Bu rapor, projenin literatür temelli gerekçesinden başlayarak sistem analizi, tasarım kararları, modül bazlı uygulama ayrıntıları, test sonuçları ve genel değerlendirmeyi kapsamlı biçimde sunmaktadır. Her bölümde ekip üyelerinin katkıları açıkça belirtilmiş; teknik kararların gerekçeleri proje dosyalarına referans verilerek açıklanmıştır. Raporda anlatılan tüm modüller prototip düzeyinde işlevsel olarak doğrulanmış; henüz canlı taşıyıcı API bağlantısı gerektiren bileşenler dahili tarife motoru ile simüle edilmiştir.",
    "Çalışmanın hedef kitlesi; lojistik yazılımı geliştiren yazılımcılar, e-ticaret operasyon ekipleri ve benzer entegre platform tasarımı yapmayı planlayan akademik çalışmacılardır. Rapor boyunca KargoTigo'ya özgü mimari seçimler, veritabanı tabloları, API uç noktaları ve kullanıcı akışları somut örneklerle anlatılmıştır. Böylece okuyucunun yalnızca genel lojistik kavramlarını değil, bu projenin kendine has uygulama detaylarını kavraması amaçlanmıştır.",
    "Raporun geri kalan bölümleri şu yapıdadır: Birinci bölüm literatür taraması ve problem tanımını; ikinci bölüm gereksinim analizi ile mimari tasarımı; üçüncü bölüm modül modül uygulama detaylarını ve ekip görev dağılımını; dördüncü bölüm test, değerlendirme ve gelecek çalışmaları ele almaktadır. Sonuç bölümünde projenin genel başarısı, elde edilen kazanımlar ve öneriler özetlenmektedir.",
)

BOLUM1 = {
    "1.1. Dijital Lojistik Ekosisteminin Güncel Durumu": _p(
        "Dijital lojistik ekosistemi; taşıyıcı firmalar, üçüncü parti lojistik sağlayıcılar (3PL), depo operatörleri, e-ticaret platformları ve yazılım entegratörlerinden oluşan geniş bir ağdır. Türkiye pazarında yurtiçi taşıyıcıların büyük çoğunluğu desi tabanlı fiyatlandırma uygularken; uluslararası taşıyıcılar bölge, ağırlık kademesi ve ek gümrük süreçlerine göre farklı tarifeler sunmaktadır. Bu parçalı yapı, son kullanıcının aynı gönderi için birden fazla web sitesini ziyaret etmesine veya manuel hesaplama yapmasına yol açmaktadır.",
        "KargoTigo ekibi proje başlangıcında mevcut pazar uygulamalarını incelemiş; fiyat karşılaştırma sitelerinin çoğunlukla statik form girişi beklediğini, operasyonel modüllerin (depo, kurye, takip) ayrı platformlarda kaldığını tespit etmiştir. Örneğin bir satıcı ürün boyutunu bilmiyorsa önce kargo sitesine gidip manuel desi hesaplamakta; depo ihtiyacı doğduğunda farklı bir hizmet sağlayıcıyı aramakta; teslimat durumunu ise üçüncü bir takip ekranından kontrol etmektedir. Bu parçalanmış deneyim, KargoTigo'nun entegre platform vizyonunun temel gerekçesini oluşturmuştur.",
        "Son mil teslimat kavramı özellikle büyük şehirlerde kritik hale gelmiştir. İstanbul gibi yoğun nüfuslu metropollerde aynı gün teslimat talebi artarken; geleneksel kargo firmalarının operasyon pencereleri her senaryoya cevap verememektedir. KargoTigo günlük kurye modülü bu boşluğu doldurmayı hedefleyerek harita tabanlı nokta seçimi, mesafe bazlı ücretlendirme ve alım-teslim doğrulama kodları ile şehir içi operasyonu dijitalleştirmektedir.",
        "Depolama tarafında fulfillment ve kısa süreli kiralama modelleri e-ticaret büyümesiyle birlikte yaygınlaşmıştır. Satıcılar sezonluk stok dalgalanmalarında sabit depo kiralamak yerine esnek metrekare ve süre seçenekleri aramaktadır. KargoTigo depo modülü otuz İstanbul deposu seed verisi ile bu ihtiyaca yanıt vermekte; kullanıcının konumuna en yakın depoyu önermekte ve taşıma mesafesini fiyat dökümüne yansıtmaktadır.",
    ),
    "1.2. E-Ticaret Satıcılarının Operasyonel Zorlukları": _p(
        "E-ticaret satıcıları operasyonel açıdan birkaç tekrarlayan zorlukla karşılaşmaktadır. Birincisi, ürün katalog bilgisinin lojistik veriye dönüştürülmesidir. Pazaryerlerinde satılan bir elektronik cihazın kutusunun boyutu çoğu zaman sistemde tanımlı değildir; satıcı tahmin yürüterek desi bildirmek zorunda kalır. Yanlış bildirim taşıyıcı tarafında ek ücret faturasına veya iade sürecine yol açar. KargoTigo'nun yapay zeka fotoğraf analizi bu problemi doğrudan hedeflemektedir.",
        "İkinci zorluk toplu gönderi planlamasıdır. Kampanya dönemlerinde yüzlerce aynı ürünün farklı illere gönderilmesi gerektiğinde birim maliyetin doğru hesaplanması satış marjını belirler. Arda Pelister tarafından tasarlanan toplu kargo modülü, satıcının tek ürün kartı altında adet bilgisi girmesine ve sistem tarafından toplam desi ile toplam maliyetin otomatik hesaplanmasına olanak tanımaktadır. Her taşıyıcı için birim ve toplam fiyat ayrı sütunlarda gösterilmekte; en uygun teklif görsel olarak vurgulanmaktadır.",
        "Üçüncü zorluk belge ve fatura yönetimidir. Depo kiralama ve kurye ödemeleri sonrasında satıcının muhasebe kayıtları için düzenli fatura üretmesi gerekir. KargoTigo e-fatura şablonu Gelir İdaresi Başkanlığı e-Belge alan yapısına uyumlu olacak şekilde tasarlanmış; hizmet türü, süre, birim fiyat, KDV ve toplam tutar alanlarını otomatik doldurmaktadır.",
        "Dördüncü zorluk müşteri iletişimidir. Gönderi gecikmeleri, gümrük evrakları veya yasaklı ürün kuralları hakkında sık sorulan sorular operasyon ekibini yormaktadır. Kaan Ada tarafından geliştirilen sanal danışman modülü bu yükü hafifletmek için kural tabanlı bilgi bankası sunmaktadır.",
    ),
    "1.3. Yapay Zeka ve Görsel Analiz Teknolojilerinin Lojistikte Kullanımı": _p(
        "Yapay zeka destekli görsel analiz, lojistik sektöründe son yıllarda pratik uygulamalara dönüşmüştür. Çok modlu büyük dil modelleri; fotoğraf, metin ve yapılandırılmış veriyi birlikte işleyerek ürün tanıma, marka-model çıkarımı ve fiziksel boyut tahmini yapabilmektedir. Google Gemini API bu alanda grounding özelliği ile internet kaynaklarından doğrulama bilgisi çekebilmektedir.",
        "KargoTigo projesinde Kaan Ada liderliğinde yapılan AI araştırması kapsamında Gemini, alternatif görsel modeller ve n8n entegrasyon yöntemleri karşılaştırılmıştır. n8n seçiminin gerekçesi; iş akışının kod tabanından ayrıştırılması, görsel olmayan ekip üyelerinin süreci panel üzerinden izleyebilmesi ve SMTP gibi yan servislerin aynı platformda birleştirilmesidir. kargo-ai-analiz-workflow.json dosyasında webhook tetikleyici, Gemini düğümü ve JSON yanıt formatlayıcı adımları tanımlanmıştır.",
        "AI analiz sürecinde güvenilirlik kritik bir konudur. Model bazen tahmini ağırlık veya boyut üretebilir; bu nedenle KargoTigo kullanıcı onay adımı koymuştur. Analiz sonucu ekranda gösterildikten sonra kullanıcı değerleri düzenleyebilir veya onaylayabilir. Onaylanmayan analiz fiyatlandırma motoruna iletilmez. Ayrıca api_query_log tablosu ile günlük AI kullanım kotası izlenmekte; kötüye kullanım engellenmektedir.",
        "Arda Pelister'in sorumluluğundaki fotoğraf yükleme arayüzü sürükle-bırak desteği, önizleme ve yükleme ilerleme göstergesi içermektedir. analyze.js istemci modülü multipart form verisini backend'e iletmekte; analyze.controller.js dosyası n8n.service.js veya doğrudan gemini.service.js üzerinden analiz sonucunu döndürmektedir.",
    ),
    "1.4. Taşıyıcı Firmaları ve Fiyatlandırma Modelleri": _p(
        "Berat Ergül tarafından yürütülen kapsamlı taşıyıcı araştırması on bir firma profilini kapsamaktadır: Yurtiçi Kargo, Aras Kargo, MNG Kargo, PTT Kargo, Sürat Kargo, Sendeo, HepsiJET, UPS, DHL, FedEx ve Aramex. Yurtiçi taşıyıcılarda desi hesabı (en×boy×yükseklik/3000) ile gerçek ağırlık karşılaştırılarak yüksek olan değer fiyatlandırmada kullanılmaktadır.",
        "backend/services/shipping/carriers.js dosyasında her firma için baz ücret, desi katsayısı, mesafe eşiği, minimum teslim süresi ve desteklenen araç tipleri tanımlanmıştır. internal.provider.js motoru bu profilleri okuyarak shipments tablosuna yazılacak teklif listesini üretmektedir. En ucuz uygun firma istemci tarafında yeşil vurgu ile gösterilmektedir.",
        "Arda Pelister'in API araştırması sonucunda çoğu yurtiçi taşıyıcının kurumsal entegrasyon için sözleşme ve API anahtarı gerektirdiği; sandbox ortamlarının sınırlı olduğu belgelenmiştir. Bu nedenle prototip aşamasında canlı API yerine dahili tarife motoru kullanılmış; gelecek sürümde external provider adaptörü genişletilebilecek şekilde shipping/index.js katmanında soyutlama bırakılmıştır.",
        "Uluslararası gönderilerde gümrük, sigorta ve teslim süresi parametreleri fiyatı belirleyen ek faktörlerdir. international.service.js modülü bu senaryoları desteklemek üzere tasarlanmış; kullanıcı varış ülkesini seçtiğinde ilgili taşıyıcı profilleri devreye girmektedir.",
    ),
    "1.5. Depolama, Son Mil ve Nakliyat Hizmetlerinin Dijitalleşmesi": _p(
        "Depolama hizmetlerinin dijitalleşmesi kullanıcıya şeffaf metrekare fiyatı, süre seçimi ve konum bazlı öneri sunmayı gerektirir. KargoTigo warehouse-wizard.js dosyasında çok adımlı depo kiralama sihirbazı uygulanmıştır: konum belirleme, depo seçimi, ürün boyutu girme, kişisel bilgiler, fiyat dökümü, ödeme simülasyonu ve giriş-çıkış kodu üretimi.",
        "Nakliyat hizmetleri geleneksel olarak telefon görüşmesi ve saha keşfi ile fiyatlandırılmaktadır. Armut, TasiyiciBul ve benzeri platformlar soru-cevap tabanlı ön teklif modelini dijitalleştirmiştir. Kaan Ada tarafından geliştirilen KargoTigo nakliyat modülü bu modeli referans alarak kat bilgisi, asansör varlığı, oda sayısı, taşınacak eşya hacmi ve mesafe parametrelerini form adımlarına dağıtmaktadır. Sonuç olarak 15.000 ile 45.000 TL arasında dinamik teklif aralığı sunulmaktadır.",
        "Ağır yük modülü otobüs, kamyon, tır, gemi ve uçak taşıma senaryolarını heavy-cargo.js katalog yapısı ile desteklemektedir. heavy.service.js dosyası taşıma tipine göre farklı fiyat katsayıları uygulamaktadır. Bu modül B2B kullanıcıların büyük hacimli gönderilerini planlamasına yöneliktir.",
    ),
    "1.6. Problem Tanımı ve Araştırma Soruları": _p(
        "KargoTigo projesinin ele aldığı temel problem şudur: Bireysel göndericiler ve küçük e-ticaret satıcıları lojistik kararlarını parçalı araçlarla vermekte; operasyonel görünürlük kaybetmekte ve manuel veri girişinden kaynaklanan hatalarla ek maliyet oluşturmaktadır. Depo ve kurye operasyonları çoğu zaman telefon veya mesajlaşma ile yürütülmekte; dijital kayıt ve doğrulama mekanizmaları bulunmamaktadır.",
        "Bu problem çerçevesinde dört ana araştırma sorusu formüle edilmiştir. Birincisi: Ürün fotoğrafından otomatik fiziksel özellik çıkarımı fiyatlandırma sürecini ne ölçüde hızlandırır ve hata oranını azaltır? İkincisi: Fiyat karşılaştırma, kurye, depo, nakliyat ve takip modüllerinin tek platformda sunulması kullanıcı operasyonel verimliliğini artırır mı? Üçüncüsü: Admin ve şube panelleri saha doğrulama süreçlerini güvenli biçimde dijitalleştirebilir mi? Dördüncüsü: n8n tabanlı otomasyon katmanı AI ve e-posta süreçlerinin bakım maliyetini düşürür mü?",
        "Bu sorulara yanıt aramak için tasarım bilimi yaklaşımı benimsenmiş; prototip geliştirilerek işlevsel doğrulama yapılmıştır.",
    ),
    "1.7. Projenin Özgün Değeri ve Kapsam Sınırları": _p(
        "KargoTigo'nun özgün değeri birkaç boyutta toplanmaktadır. Birincisi, yapay zeka analizi ile on bir taşıyıcı fiyat karşılaştırmasının aynı oturumda tamamlanmasıdır. İkincisi, depo giriş-çıkış kodları ve şube doğrulama panelinin entegre sunulmasıdır. Üçüncüsü, toplu e-ticaret gönderi planlaması ile bireysel gönderi akışının aynı veritabanı modelinde birleştirilmesidir. Dördüncüsü, n8n ile AI ve e-posta süreçlerinin kod tabanından ayrıştırılmasıdır.",
        "Proje kapsam dışı bırakılan konular şunlardır: Canlı ödeme gateway entegrasyonu (demo simülasyon kullanılmıştır), native mobil uygulama (responsive web tercih edilmiştir), gerçek taşıyıcı API bağlantısı (dahili tarife motoru kullanılmıştır), rota optimizasyon algoritmaları (gelecek çalışma olarak bırakılmıştır).",
    ),
    "1.8. İlgili Sektör Uygulamalarının Karşılaştırmalı İncelenmesi": _p(
        "Piyasada KargoTigo'ya kısmen benzer birkaç uygulama kategorisi bulunmaktadır. Fiyat karşılaştırma siteleri yalnızca teklif listesi sunarken operasyon modülü içermez. Pazaryeri lojistik modülleri tek taşıyıcıya bağlıdır. 3PL platformları kurumsal müşteriye yöneliktir. KargoTigo bu kategorilerin kesişiminde bireysel ve KOBİ segmentine odaklanan entegre bir prototip sunmaktadır.",
        "Berat Ergül'ün genel tez araştırmaları kapsamında akademik kaynaklar, sektör raporları ve açık kaynak lojistik projeleri incelenmiş; karşılaştırmalı tablo proje sunum materyallerinde özetlenmiştir. Hakkında sayfası bu araştırma bulgularını son kullanıcı diline çevirerek platform misyonunu, taşıyıcı listesini ve ekip bilgilerini sunmaktadır.",
    ),
}

BOLUM2 = {
    "2.1. Proje Yönetimi ve Geliştirme Metodolojisi": _p(
        "Proje dört kişilik ekip ile yaklaşık iki akademik dönem süresince yürütülmüştür. Emirhan Ercan proje lideri olarak haftalık görev dağılımı, sprint planlaması ve kod birleştirme (merge) süreçlerini koordine etmiştir. Modüler geliştirme ilkesi benimsenmiş; her ekip üyesi kendi sorumluluk alanındaki frontend ve backend dosyalarında bağımsız çalışmış, ortak API sözleşmeleri lider tarafından belirlenmiştir.",
        "Versiyon kontrolü Git ile yapılmış; ana dal üzerinde feature branch'ler kullanılmıştır. Veritabanı değişiklikleri migrate-all-kargotigo.sql birleşik betiği ile yönetilmiş; her migration dosyası (migrate-quota.sql, migrate-branch-verify.sql, migrate-admin-panel.sql vb.) ayrı ayrı geliştirilip sonunda birleştirilmiştir.",
        "Dokümantasyon README.md, n8n/README.md ve bu tez raporu ile desteklenmiştir. Cache busting için frontend dosyalarında ?v=N sürüm parametreleri kullanılmıştır (app.js?v=29, branch.js?v=5, landing.css?v=6 gibi).",
    ),
    "2.2. Paydaş Analizi ve Kullanıcı Profilleri": _p(
        "Birincil paydaş bireysel göndericidir: İkinci el satış, hediye gönderimi veya kişisel eşya taşıma ihtiyacı olan kullanıcı. İkincil paydaş e-ticaret satıcısıdır: Toplu gönderi, depo ve fatura ihtiyacı olan KOBİ profili. Üçüncül paydaş admin kullanıcısıdır: Operasyonel görünürlük ve depo yönetimi ihtiyacı olan sistem yöneticisi. Dördüncül paydaş şube yetkilisidir: Saha doğrulama yapan depo personeli.",
        "Her profil için farklı arayüz tasarlanmıştır: app.html ana uygulama, admin.html yönetim paneli, branch.html şube paneli, login.html ve register.html kimlik ekranları, index.html tanıtım sayfası.",
    ),
    "2.3. Fonksiyonel Gereksinimler": _p(
        "FR-01: Kullanıcı e-posta ve parola ile kayıt olabilmeli. FR-02: Kullanıcı JWT ile oturum açabilmeli. FR-03: Kullanıcı ürün fotoğrafı yükleyerek AI analizi alabilmeli. FR-04: Kullanıcı analiz sonucunu onaylayabilmeli veya düzeltebilmeli. FR-05: Sistem on bir taşıyıcı için fiyat teklifi üretebilmeli. FR-06: Kullanıcı İstanbul haritasında kurye siparişi oluşturabilmeli. FR-07: Kullanıcı depo kiralayabilmeli ve giriş-çıkış kodu alabilmeli. FR-08: Kullanıcı nakliyat teklifi alabilmeli. FR-09: Kullanıcı toplu gönderi planı oluşturabilmeli. FR-10: Kullanıcı takip numarası ile gönderi durumu sorgulayabilmeli. FR-11: Kullanıcı sanal danışmana soru sorabilmeli. FR-12: Admin dashboard istatistikleri görüntüleyebilmeli. FR-13: Admin yeni depo oluşturabilmeli. FR-14: Şube yetkilisi teslim kayıtlarını doğrulayabilmeli. FR-15: Sistem şifre sıfırlama e-postası gönderebilmeli.",
    ),
    "2.4. Fonksiyonel Olmayan Gereksinimler": _p(
        "NFR-01: AI analiz yanıt süresi normal koşullarda 10 saniyeyi geçmemelidir. NFR-02: Arayüz mobil tarayıcılarda kullanılabilir olmalıdır. NFR-03: Parolalar düz metin saklanmamalıdır. NFR-04: API uç noktaları yetkisiz erişime karşı korunmalıdır. NFR-05: Günlük AI kotası aşıldığında anlamlı hata mesajı dönmelidir. NFR-06: Tüm kullanıcı mesajları Türkçe olmalıdır. NFR-07: Veritabanı migration betikleri tekrar çalıştırılabilir (idempotent) olmalıdır.",
    ),
    "2.5. Use Case Senaryoları": _p(
        "UC-01 Bireysel Gönderi: Kullanıcı giriş yapar, buzdolabı fotoğrafı yükler, AI analizini onaylar, Ankara-İzmir rotası için teklifleri karşılaştırır, Yurtiçi Kargo teklifini seçer. UC-02 E-Ticaret Toplu Gönderi: Satıcı 100 adet kozmetik ürünü için toplu kargo modülünde adet girer, toplam desi hesaplanır, en uygun taşıyıcı seçilir. UC-03 Depo Kiralama: Kullanıcı Kadıköy konumunu girer, ist-16 deposunu seçer, 30 gün 5 m² kiralama yapar, giriş kodu alır. UC-04 Kurye: Kullanıcı haritada Beşiktaş alım, Üsküdar teslim noktası seçer, same_day aciliyet ile sipariş verir. UC-05 Şube Doğrulama: Şube yetkilisi giriş kodunu girer, kayıt 'Depoda' sekmesine taşınır.",
    ),
    "2.6. Sistem Mimarisi": _p(
        "KargoTigo üç katmanlı mimari ile tasarlanmıştır. Sunum katmanı (frontend/) HTML5, CSS3 ve ES modüllerinden oluşur. Uygulama katmanı (backend/) Express.js REST API sunar. Veri katmanı Supabase PostgreSQL barındırır. Otomasyon katmanı n8n self-hosted instance üzerinde çalışır.",
        "İstek akışı: Tarayıcı → fetch(api.js) → Express route → controller → service → Supabase → JSON yanıt → render.js/ui.js ile DOM güncelleme. Kimlik doğrulama auth.middleware.js dosyasında JWT doğrulaması yapılır.",
    ),
    "2.7. Backend Katmanı Tasarımı": _p(
        "backend/server.js giriş noktasıdır. Route dosyaları auth.routes.js, analyze.routes.js, shipping.routes.js, courier.routes.js, warehouse.routes.js, tracking.routes.js, admin.routes.js ve heavy.routes.js olarak ayrılmıştır. Her route ilgili controller'a delegasyon yapar. Controller ince katmandır; iş mantığı service dosyalarındadır.",
        "admin.service.js dosyası 469 satırlık kapsamlı yönetim mantığı içerir: getOverviewAnalytics, createWarehouseRecord, listAdminLogins, grouped shipments sorguları vb. warehouse.service.js depo listeleme, rezervasyon ve fiyat hesaplama işlevlerini barındırır. courier.service.js mesafe, hacim ve aciliyet parametreleri ile ücret üretir.",
    ),
    "2.8. Frontend Katmanı Tasarımı": _p(
        "Frontend build gerektirmeyen modüler yapıdadır. api.js merkezi HTTP istemcisidir; Authorization header otomatik eklenir. auth.js oturum yönetimi ve yönlendirme sağlar. render-services.js hizmet kartlarını oluşturur. landing.css, admin.css, branch.css, app.css ve base.css stil dosyaları ayrı paneller için özelleştirilmiştir.",
        "Emirhan Ercan tarafından yeniden tasarlanan index.html landing page modern hero bölümü, hizmet chip'leri, özellik kartları ve CTA butonları içermektedir. Önceki sürümdeki hero badge çakışma sorunu landing.css v6 ile giderilmiştir.",
    ),
    "2.9. Veritabanı Tasarımı ve Tablo İlişkileri": _p(
        "users tablosu merkezi kimlik kaydıdır; is_premium alanı kota muafiyeti için eklenmiştir. analyses tablosu AI sonuçlarını saklar; sources jsonb alanı Google grounding kaynaklarını tutar. shipments tablosu teklif ve gönderi kayıtlarını barındırır; tracking_number alanı takip modülü ile ilişkilidir.",
        "courier_orders tablosu pickup_point_id, delivery_point_id, delivery_code, price_breakdown gibi genişletilmiş alanlar içerir. warehouse_bookings tablosu entry_password, exit_password, entry_verified_at, exit_verified_at alanları ile saha doğrulamayı destekler. branch_accounts tablosu şube personeli ile depo/kurye tipini eşler. admin_login_log tablosu yönetici oturum geçmişini tutar.",
    ),
    "2.10. Güvenlik Mimarisi": _p(
        "Parolalar auth.service.js içinde bcrypt ile hashlenir. JWT token utils/token.js ile üretilir ve doğrulanır. admin.middleware.js admin rol kontrolü yapar. quota.middleware.js günlük AI limitini kontrol eder. Supabase RLS tüm tablolarda etkinleştirilmiş; anon erişim engellenmiştir. Backend service_role anahtarı ile güvenli erişim sağlanır.",
        "Şifremi unuttum akışında tek kullanımlık sıfırlama token'ı kısa ömürlü üretilir; n8n SMTP düğümü e-posta iletir. Token kullanıldıktan sonra geçersiz kılınır.",
    ),
    "2.11. n8n Otomasyon Mimarisi": _p(
        "n8n/kargo-ai-analiz-workflow.json dosyası webhook → Gemini → response formatı akışını tanımlar. n8n.service.js backend'den webhook'u tetikler. Bağlantı hatasında gemini.service.js doğrudan API çağrısı yaparak fallback sağlar. Şifre sıfırlama workflow'u ayrı n8n projesinde tanımlanmış; SMTP kimlik bilgileri ortam değişkenlerinde saklanır.",
    ),
    "2.12. Rol ve Yetki Modeli": _p(
        "Dört rol tanımlıdır: user, admin, branch, guest. Admin e-postası seed-admin.sql ile admin@kargotigo.com olarak tanımlanmıştır. Şube hesapları migrate-branch-users.sql ile oluşturulur. Her rol farklı HTML sayfasına yönlendirilir: admin → admin.html, branch → branch.html, user → app.html.",
    ),
}

# BOLUM3 will be very large - split by team member modules
BOLUM3 = {
    "3.1. Proje Liderliği ve Ekip Koordinasyonu (Emirhan Ercan)": _p(
        "Emirhan Ercan (202407012033) proje lideri olarak tüm ekibe görev dağılımı yapmış, haftalık ilerleme toplantıları düzenlemiş ve teknik kararları koordine etmiştir. Liderlik kapsamında veritabanı şemasının (schema.sql) tasarlanması, migrate-all-kargotigo.sql birleşik migration betiğinin hazırlanması, backend server.js ve ortak middleware yapılandırması gerçekleştirilmiştir.",
        "n8n iş akışlarının kurulumu, Gemini API anahtar yönetimi ve webhook URL yapılandırması proje lideri tarafından yürütülmüştür. AI analiz kotası (migrate-quota.sql, quota.service.js, quota.middleware.js) ve admin giriş loglama (admin_login_log tablosu) bu koordinasyon kapsamında tamamlanmıştır.",
        "Genel site arayüzü olarak index.html landing page tamamen yeniden tasarlanmış; landing.css ve landing.js dosyaları modern görsel dil ile güncellenmiştir. app.html ana uygulama kabuğu tüm hizmet modüllerini barındıracak şekilde organize edilmiştir.",
    ),
    "3.2. Kimlik Doğrulama ve Oturum Yönetimi (Kaan Ada)": _p(
        "Kaan Ada (202407012049) login-register ekranlarını geliştirmiştir. login.html ve register.html sade formlar içerir; login.js istemci doğrulaması yapar. backend/routes/auth.routes.js POST /register ve POST /login uç noktalarını sunar.",
        "Parolalar auth.service.js içinde bcrypt salt rounds ile hashlenir. Başarılı girişte JWT üretilir; istemci localStorage'a kaydeder. auth.js requireLogin, redirectAfterLogin ve redirectToLogin fonksiyonları ile oturum kontrolü sağlar. Token süresi dolduğunda api.js 401 yakalar ve giriş sayfasına yönlendirir.",
        "Güvenlik açısından parola minimum uzunluk kontrolü, e-posta format doğrulaması ve tekrarlayan kayıt engelleme (unique email constraint) uygulanmıştır.",
    ),
    "3.3. Şifremi Unuttum ve Hakkında Sayfası (Berat Ergül)": _p(
        "Berat Ergül (202407012050) şifremi unuttum özelliğini n8n e-posta entegrasyonu ile tasarlamıştır. Kullanıcı login ekranından e-posta adresini girer; backend geçici sıfırlama token'ı üretir; n8n workflow SMTP adımı ile bağlantı içeren e-posta gönderir. Token tek kullanımlık ve süre sınırlıdır.",
        "Hakkında sayfası platform misyonunu, vizyonunu, entegre on bir taşıyıcı markasını ve dört kişilik proje ekibini tanıtır. Berat Ergül'ün genel tez araştırmaları bu sayfanın içerik altyapısını oluşturmuştur. Sayfa responsive tasarıma sahiptir ve landing page footer bağlantısı ile erişilebilir.",
        "Kargo firmaları araştırması carrier-brands.js ve carriers.js dosyalarına yansımış; her firma logosu frontend/assets/carriers/ klasöründe SVG formatında tutulmaktadır.",
    ),
    "3.4. Yapay Zeka Görsel Analiz Modülü (Arda Pelister / Kaan Ada)": _p(
        "AI modülü Arda Pelister'in fotoğraf yükleme arayüzü ve Kaan Ada'nın entegrasyon araştırması iş birliği ile geliştirilmiştir. analyze.js sürükle-bırak alanı, dosya önizlemesi ve yükleme durumu gösterir. POST /api/analyze multipart/form-data ile görseli backend'e iletir.",
        "analyze.controller.js isteği n8n.service.js'e yönlendirir. n8n Gemini'den product_name, brand, model, weight_kg, length_cm, width_cm, height_cm alanlarını JSON olarak döndürür. Sonuç analyses tablosuna kaydedilir; sources alanına Google grounding linkleri yazılır.",
        "Kullanıcı onay ekranında her alan düzenlenebilir. confirmed=true yapıldıktan sonra shipping modülüne geçilir. Günlük kota api_query_log tablosunda endpoint='analyze' kayıtları ile izlenir.",
    ),
    "3.5. Fiyatlandırma Motoru ve Taşıyıcı Karşılaştırma": _p(
        "shipping/index.js sağlayıcı adaptörüdür. internal.provider.js desi hesabı yapar: hacim_desi = (L×W×H)/3000; fatura_desi = max(hacim_desi, ağırlık). distance.js şehirler arası mesafe tahmini üretir. Her taşıyıcı profili için baz + desi×katsayı + mesafe×km ücreti hesaplanır.",
        "shipping.js istemci modülü teklif kartlarını render eder; en ucuz teklif vurgulanır. Araç tipi (motosiklet, van, kamyon, uçak, gemi) gönderi profiline göre filtrelenir. shipments tablosuna seçilen teklif kaydedilir.",
    ),
    "3.6. Toplu Kargo Gönderi Modülü (Arda Pelister)": _p(
        "Arda Pelister (202407012037) toplu kargo modülünü e-ticaret satıcıları için tasarlamıştır. Satıcı tek ürün tanımı girer: ürün adı, birim boyut, birim ağırlık. Adet alanına 10, 50 veya 500 gibi değerler girildiğinde sistem toplam desi = birim_desi × adet ve toplam_ağırlık = birim_ağırlık × adet hesaplar.",
        "Her taşıyıcı için birim_fiyat ve toplam_fiyat ayrı gösterilir. Kampanya dönemlerinde satıcı farklı adet senaryolarını karşılaştırarak lojistik bütçesi planlayabilir. Modül render-services.js içinde 'Toplu Gönderi' hizmet kartı olarak erişilebilir.",
        "Arda Pelister'in fiyatlandırma araştırması bu modülün gerçekçi tarife hesabı yapmasını sağlamıştır; taşıyıcı bazlı minimum desi ve maksimum paket kuralları hesaba katılır.",
    ),
    "3.7. E-Fatura Şablonu ve Belge Üretimi (Arda Pelister)": _p(
        "E-fatura modülü invoice-pdf.js ve warehouse-invoice.service.js dosyaları ile çalışır. Depo veya kurye ödemesi tamamlandığında HTML fatura şablonu doldurulur: fatura no, tarih, müşteri bilgisi, hizmet kalemi, KDV %20, ara toplam, genel toplam.",
        "Şablon tarayıcı window.print() veya PDF dönüştürme ile indirilebilir. GIB e-fatura alan yapısına uyum için fatura_no warehouse_bookings.invoice_no alanına yazılır. Gelecekte GIB API entegrasyonu için altyapı hazırlanmıştır.",
    ),
    "3.8. Günlük Kurye Sistemi (Emirhan Ercan)": _p(
        "Günlük kurye modülü Emirhan Ercan tarafından geliştirilmiştir. courier-map.js Leaflet haritası ile İstanbul sınırlı alım ve teslim noktası seçimi sağlar. istanbul-points.js önceden tanımlı nokta listesi sunar.",
        "courier.service.js mesafe_km, weight_kg, volume_liters ve urgency (same_day, next_day) parametreleri ile fiyat üretir. price_breakdown jsonb alanında mesafe ücreti, ağırlık ek ücreti ve aciliyet çarpanı ayrıştırılır. Sipariş sonrası delivery_code üretilir; kurye tesliminde doğrulanır.",
        "courier_orders tablosu sender_name, recipient_name, sender_phone, recipient_phone alanları ile tam adres bilgisi tutar. Şube panelinde kurye tipi branch_accounts ile ilişkilendirilebilir.",
    ),
    "3.9. Depo Kiralama Modülü (Emirhan Ercan)": _p(
        "Depo modülü otuz İstanbul deposu ile seed-istanbul-warehouses.sql ve istanbul-warehouses.js verisi kullanır. warehouse-wizard.js çok adımlı sihirbaz: konum, depo seçimi, ürün boyutu, kişisel bilgiler (TC, adres), fiyat dökümü, ödeme, kod üretimi.",
        "Fiyat hesabı: storage_subtotal = alan × aylık_m²_fiyat × (gün/30); transport_fee mesafeye bağlı; KDV %20 eklenir. entry_password ve exit_password rastgele 6 haneli kodlar olarak üretilir. Şube yetkilisi bu kodları branch.js doğrulama formunda kontrol eder.",
    ),
    "3.10. Nakliyat Teklif Sistemi (Kaan Ada)": _p(
        "Kaan Ada (202407012049) nakliyat modülünü Armut benzeri soru-cevap akışı ile geliştirmiştir. Form adımları: taşınma tipi (ev/ofis), oda sayısı, kat bilgisi, asansör var/yok, eşya hacmi (az/orta/çok), alım ve varış adresi.",
        "Fiyat algoritması kural tabanlıdır: baz_fiyat 15000 TL; kat başına asansörsüz +2000 TL; oda sayısı çarpanı; mesafe katsayısı. Sonuç 15000–45000 TL aralığında clamp edilir. Kullanıcıya aralık ve tahmini süre gösterilir.",
        "Modül ek hizmet olarak render-services.js'de 'Nakliyat' kartı ile sunulur. Gelecekte saha keşif randevusu entegrasyonu planlanmaktadır.",
    ),
    "3.11. Ağır Yük ve Uluslararası Taşımacılık": _p(
        "heavy.js ve heavy.service.js ağır yük katalog modülünü sunar. heavy-cargo.js otobüs, kamyon, tır, gemi, uçak senaryolarını tanımlar. heavy-carriers.js taşıyıcı profillerini içerir. international.js uluslararası gönderi formu sunar; international.service.js bölge bazlı fiyat üretir.",
    ),
    "3.12. Kargo Takip Modülü (Berat Ergül)": _p(
        "Berat Ergül (202407012050) kargo takip modülünü geliştirmiştir. tracking.service.js tracking_events tablosundan durum zaman çizelgesi üretir. tracking-api.js istemci sorgusu yapar. trackingNumber.js benzersiz takip numarası üretir (KT- prefix).",
        "Kullanıcı takip numarası girdiğinde 'Hazırlanıyor', 'Transferde', 'Dağıtımda', 'Teslim Edildi' gibi aşamalar kronolojik listelenir. history.js geçmiş gönderileri tek panelde gösterir.",
    ),
    "3.13. Sanal Danışman ve Bilgi Bankası (Kaan Ada)": _p(
        "Kaan Ada sanal danışman modülünü consultant.js ve consultant.css ile geliştirmiştir. Kural tabanlı eşleme: kullanıcı sorusunda anahtar kelime aranır; eşleşme varsa önceden tanımlı yanıt döner. Konular: gümrük evrakları, yasaklı ürünler, desi hesabı, sigorta, kapıda ödeme, depo süresi, kurye saatleri.",
        "Danışman paneli yöneticilerin yeni soru-cevap çifti eklemesine olanak tanır. Gelecekte Gemini tabanlı serbest sohbet moduna geçiş planlanmaktadır.",
    ),
    "3.14. Admin Yönetim Paneli (Emirhan Ercan)": _p(
        "admin.html sidebar layout ile yeniden tasarlanmıştır. Bölümler: Genel Görünüm, Depo Oluşturma, Depo İşlemleri, AI Kullanımı, Kullanıcılar, Günlük Kurye. admin.js her bölüm için render fonksiyonu içerir. admin.css sidebar ve kart stillerini tanımlar.",
        "Dashboard getOverviewAnalytics ile son 7 gün AI, kurye, depo grafikleri gösterir. Depo oluşturma formu createWarehouseRecord API'sini çağırır. Son girişler admin_login_log listesinden sidebar'da gösterilir.",
    ),
    "3.15. Şube Yetkilisi Paneli (Emirhan Ercan)": _p(
        "branch.html şube personeline özeldir. Üstte renderDepotBanner ile bağlı depo bilgisi gösterilir. Sekmeler: Teslim Edilecek, Depoda, Teslim Edilmiş. branch.js?v=5 her ürün kartında müşteri adı, boyut, giriş-çıkış kodları ve doğrulama butonu sunar.",
        "entry_verified_at ve exit_verified_at alanları migrate-branch-verify.sql ile eklenmiştir. Doğrulama sonrası kayıt ilgili sekmeye taşınır. branch.css profesyonel saha arayüzü sağlar.",
    ),
    "3.16. Landing Page ve Genel Arayüz Tasarımı": _p(
        "index.html tamamen yeniden yazılmıştır. Hero bölümü, hizmet chip'leri, özellik kartları, taşıyıcı logoları ve CTA butonları içerir. landing.css v6 ile hero badge çakışma sorunu giderilmiş; chip'ler kart üstünde ayrı satırda konumlandırılmıştır.",
        "Tüm arayüz metinleri Türkçe karakter desteği ile güncellenmiştir (ö, ş, ı, ç, ü, ğ). API hata mesajları da Türkçeleştirilmiştir.",
    ),
    "3.17. Veritabanı Migration ve Seed Yönetimi": _p(
        "migrate-all-kargotigo.sql 198 satırlık birleşik betiktir. migrate-kargotigo.sql, migrate-warehouse-v2.sql, migrate-quota.sql, migrate-courier-orders.sql, migrate-admin-panel.sql, migrate-branch-verify.sql ve migrate-branch-users.sql adım adım birleştirilmiştir. seed-admin.sql admin kullanıcısı, seed-istanbul-warehouses.sql depo verisi içerir.",
    ),
    "3.18. API Uç Noktaları ve Servis Katmanı": _p(
        "Auth: POST /api/auth/register, POST /api/auth/login. Analyze: POST /api/analyze. Shipping: POST /api/shipping/quote, GET /api/shipping/carriers. Courier: POST /api/courier/quote, POST /api/courier/order. Warehouse: GET /api/warehouse/list, POST /api/warehouse/book. Tracking: GET /api/tracking/:code. History: GET /api/history. Admin: GET /api/admin/overview, POST /api/admin/warehouses, GET /api/admin/logins. Branch: GET /api/admin/branch/shipments, POST /api/admin/branch/verify-entry, POST /api/admin/branch/verify-exit.",
    ),
    "3.19. Ekip Görev Dağılımı Özet Tablosu": _p(
        "Emirhan Ercan (202407012033) — Proje lideri: görev dağılımı, admin paneli, veritabanı, n8n, genel arayüz, şube paneli, AI backend, depo, günlük kurye.",
        "Arda Pelister (202407012037) — Toplu kargo, e-fatura şablonu, AI fotoğraf yükleme, fiyatlandırma araştırması, kargo API/fiyat politikası incelemesi.",
        "Berat Ergül (202407012050) — Kargo takip, şifremi unuttum (n8n), hakkında sayfası, taşıyıcı araştırması, genel tez literatürü.",
        "Kaan Ada (202407012049) — Nakliyat sistemi, AI analiz araştırması/entegrasyonu, login-register, JWT/hash, sanal danışman.",
    ),
}

BOLUM4 = {
    "4.1. Test Stratejisi ve Ortam Yapılandırması": _p(
        "Testler yerel geliştirme ortamında Node.js backend (port 3000) ve statik frontend dosya sunucusu ile yürütülmüştür. Supabase cloud veritabanı test projesi kullanılmıştır. n8n yerel veya Docker instance üzerinde çalıştırılmıştır. Gemini API test anahtarı .env dosyasında yapılandırılmıştır.",
        "Test yaklaşımı işlevsel senaryo testidir; otomatik birim test çerçevesi kapsam dışı bırakılmış, manuel kontrol listesi uygulanmıştır.",
    ),
    "4.2. Birim ve Entegrasyon Testleri": _p(
        "Auth servisi: geçerli kayıt, mükerrer e-posta, hatalı parola senaryoları test edilmiştir. Analyze servisi: geçerli görsel, boş dosya, kota aşımı test edilmiştir. Shipping servisi: farklı desi/mesafe kombinasyonlarında sıralama tutarlılığı doğrulanmıştır.",
    ),
    "4.3. Kullanıcı Senaryosu Testleri": _p(
        "UC-01 ile UC-05 senaryoları uçtan uca çalıştırılmıştır. Bireysel gönderi akışı 3-8 saniye analiz + 2 saniye fiyat listesi süresinde tamamlanmıştır. Depo kiralama sihirbazı 7 adımda sorunsuz ilerlemiştir.",
    ),
    "4.4. Güvenlik Testleri": _p(
        "Yetkisiz admin erişimi 403 döndürmüştür. Süresi dolmuş JWT yeniden giriş gerektirmiştir. SQL injection denemeleri parametreli sorgular ile engellenmiştir. RLS anon erişimi reddetmiştir.",
    ),
    "4.5. Performans Gözlemleri": _p(
        "AI analiz ortalama 3-8 saniye. Admin dashboard sorguları sayfalama ile 2 saniye altında. Statik frontend anında yüklenmektedir. 30 depo listesi filtresi 500ms altında yanıt vermektedir.",
    ),
    "4.6. Kullanılabilirlik Değerlendirmesi": _p(
        "Ekip içi kullanılabilirlik gözlemi yapılmıştır. Sihirbaz adımları net etiketlenmiştir. Hata mesajları Türkçe ve anlaşılırdır. Mobil tarayıcıda responsive düzen bozulmamaktadır.",
    ),
    "4.7. Sınırlılıklar ve Risk Analizi": _p(
        "Canlı taşıyıcı API yok; tarifeler simüle. Ödeme demo. Nakliyat fiyatı keşif gerektirir. AI tahminleri her zaman doğru olmayabilir; insan onayı zorunlu. n8n tek nokta arızası riski fallback ile azaltılmıştır.",
    ),
    "4.8. Gelecek Çalışmalar": _p(
        "Gerçek taşıyıcı API entegrasyonu, canlı ödeme (iyzico/Stripe), React Native mobil uygulama, rota optimizasyonu, ML talep tahmini, çoklu şehir depo genişlemesi, GIB e-fatura API bağlantısı ve BI raporlama modülü önerilmektedir.",
    ),
}

SONUC = _p(
    "Bu bitirme projesinde KargoTigo adlı yapay zeka destekli entegre lojistik yönetim platformu başarıyla prototip düzeyinde geliştirilmiş ve işlevsel olarak doğrulanmıştır. Dört kişilik ekip modüler görev dağılımı ile on bir taşıyıcı profili, AI görsel analiz, günlük kurye, otuz depo noktası, nakliyat teklifi, toplu gönderi, kargo takip, e-fatura, sanal danışman, admin ve şube panellerini tek platformda birleştirmiştir.",
    "Proje lideri Emirhan Ercan'ın koordinasyonunda veritabanı tasarımı, n8n otomasyonu, admin ve şube panelleri, depo-kurye modülleri hayata geçirilmiştir. Arda Pelister toplu kargo, e-fatura ve fiyatlandırma araştırmaları ile katkı sağlamıştır. Berat Ergül kargo takip, şifremi unuttum, hakkında sayfası ve taşıyıcı literatürünü tamamlamıştır. Kaan Ada kimlik doğrulama, nakliyat modülü, AI entegrasyonu ve sanal danışmanı geliştirmiştir.",
    "Test sonuçları prototip hedeflerini karşılamıştır. Entegre mimari operasyonel verimlilik potansiyeli göstermiştir. Gelecek çalışmalarda canlı API, ödeme ve mobil istemci önceliklendirilmelidir.",
    "KargoTigo, Doğuş Üniversitesi Meslek Yüksekokulu Bilgisayar Programcılığı Programı bitirme projesi kapsamında edinilen yazılım geliştirme, veritabanı tasarımı, API geliştirme, yapay zeka entegrasyonu ve ekip çalışması becerilerinin somut bir uygulamasıdır.",
)

KAYNAKLAR = [
    "Aras Kargo. Kurumsal Entegrasyon ve API Dokümantasyonu. https://www.araskargo.com.tr/ (erişim: Mart 2026).",
    "Ballou, R. H. Business Logistics/Supply Chain Management. 5. baskı. Prentice Hall, 2004.",
    "Chopra, S.; Meindl, P. Supply Chain Management: Strategy, Planning, and Operation. 7. baskı. Pearson, 2016.",
    "DHL Türkiye. Express Gönderi Rehberi. https://www.dhl.com/tr-tr (erişim: Mart 2026).",
    "Express.js. Resmi Dokümantasyon. https://expressjs.com/ (erişim: Mart 2026).",
    "Fielding, R. T. Architectural Styles and the Design of Network-based Software Architectures. Doktora tezi, UC Irvine, 2000.",
    "Gelir İdaresi Başkanlığı. e-Fatura ve e-Arşiv Uygulama Rehberi. https://ebelge.gib.gov.tr/ (erişim: Mart 2026).",
    "Google. Gemini API — Multimodal Generation. https://ai.google.dev/ (erişim: Mart 2026).",
    "Hevner, A. R.; March, S. T.; Park, J. Design Science in Information Systems Research. MIS Quarterly, 28(1), 75-105, 2004.",
    "Leaflet. Interactive Maps Documentation. https://leafletjs.com/ (erişim: Mart 2026).",
    "MDN Web Docs. JavaScript Modules. https://developer.mozilla.org/ (erişim: Mart 2026).",
    "MNG Kargo. Bireysel ve Kurumsal Hizmet Tarifeleri. https://www.mngkargo.com.tr/ (erişim: Mart 2026).",
    "n8n.io. Workflow Automation Platform Documentation. https://docs.n8n.io/ (erişim: Mart 2026).",
    "Node.js Foundation. Node.js v20 LTS Documentation. https://nodejs.org/docs/ (erişim: Mart 2026).",
    "OWASP. Authentication Cheat Sheet ve JWT Security. https://cheatsheetseries.owasp.org/ (erişim: Mart 2026).",
    "PostgreSQL Global Development Group. PostgreSQL 15 Documentation. https://www.postgresql.org/docs/ (erişim: Mart 2026).",
    "Sommerville, I. Software Engineering. 10. baskı. Pearson, 2016.",
    "Supabase. Database, Auth ve RLS Dokümantasyonu. https://supabase.com/docs (erişim: Mart 2026).",
    "Türk Dil Kurumu. Yazım Kılavuzu. Ankara, 2022.",
    "Türkiye İstatistik Kurumu. E-Ticaret İstatistikleri, 2024-2025. https://www.tuik.gov.tr/ (erişim: Mart 2026).",
    "W3C. HTML5 ve CSS3 Spesifikasyonları. https://www.w3.org/ (erişim: Mart 2026).",
    "Yurtiçi Kargo. Desi Hesaplama ve Kurumsal API Bilgileri. https://www.yurticikargo.com/ (erişim: Mart 2026).",
]

EKLER = [
    "Ek-1: KargoTigo sistem mimarisi blok diyagramı",
    "Ek-2: Veritabanı ER diyagramı (users, analyses, shipments ilişkileri)",
    "Ek-3: Tam API uç noktaları ve istek/yanıt örnekleri",
    "Ek-4: Admin paneli — Genel Görünüm ekran görüntüsü",
    "Ek-5: Admin paneli — Depo Oluşturma ekran görüntüsü",
    "Ek-6: Admin paneli — Depo İşlemleri ekran görüntüsü",
    "Ek-7: Şube yetkilisi paneli — Teslim Edilecek sekmesi",
    "Ek-8: Şube yetkilisi paneli — Doğrulama formu",
    "Ek-9: AI analiz sonuç ekranı ve kaynak linkleri",
    "Ek-10: n8n kargo-ai-analiz-workflow.json iş akışı görüntüsü",
    "Ek-11: Kurye harita seçim ekranı (Leaflet)",
    "Ek-12: Depo kiralama sihirbazı adımları",
    "Ek-13: Toplu kargo gönderi fiyat tablosu",
    "Ek-14: Nakliyat teklif formu ekranı",
    "Ek-15: E-fatura şablon PDF örneği",
    "Ek-16: Sanal danışman soru-cevap ekranı",
    "Ek-17: Kargo takip zaman çizelgesi",
    "Ek-18: Test senaryoları (TS-01 — TS-20) sonuç tablosu",
    "Ek-19: Ekip görev dağılımı Gantt şeması",
    "Ek-20: Kaynak kod dizin yapısı (BitirmeProjesi/)",
]

# Ek genişletme paragrafları — her bölüme eklenecek detay
EXTRA_B1 = {
    "1.1. Dijital Lojistik Ekosisteminin Güncel Durumu": _p(
        "Türkiye'de kargo sektörü yıllık milyarlarca gönderi hacmi ile önemli bir ekonomik aktör haline gelmiştir. TÜİK verilerine göre e-ticaret oranı perakende içinde sürekli artış göstermektedir. Bu büyüme lojistik yazılımına olan talebi doğrudan etkilemektedir.",
        "KargoTigo geliştirme ekibi proje kick-off toplantısında pazar analizi sunumu yapmış; rakip uygulamaların güçlü ve zayıf yönlerini beyaz tahta üzerinde listelemiştir. Entegrasyon eksikliği en sık tekrarlanan zayıf yön olarak kayda geçmiştir.",
    ),
    "1.4. Taşıyıcı Firmaları ve Fiyatlandırma Modelleri": _p(
        "HepsiJET ve Sendeo pazaryeri odaklı taşıyıcılardır; e-ticaret satıcılarına özel tarifeler sunarlar. PTT Kargo geniş ağa sahip olmakla birlikte desi eşiği farklılık gösterebilir. Sürat Kargo bölgesel avantaj sağlar.",
        "Uluslararası taşıyıcılarda UPS ve FedEx express hizmetleri premium fiyatlandırma uygular; DHL Avrupa hattında güçlüdür; Aramex Orta Doğu ve Kuzey Afrika rotalarında tercih edilir.",
    ),
}

EXTRA_B3 = {
    "3.8. Günlük Kurye Sistemi (Emirhan Ercan)": _p(
        "Kurye aciliyet seviyesi same_day seçildiğinde fiyat çarpanı 1.4, next_day seçildiğinde 1.0 uygulanır. Motosiklet 30 kg altı paketler için varsayılan araçtır; daha ağır yüklerde van tipine geçilir.",
        "Harita üzerinde seçilen noktalar pickup_point_id ve delivery_point_id olarak courier_orders tablosuna yazılır. Mesafe haversine formülü veya önceden kalibre edilmiş nokta matrisi ile hesaplanır.",
    ),
    "3.9. Depo Kiralama Modülü (Emirhan Ercan)": _p(
        "Depo tipleri standard, cold, fulfillment ve bonded olarak sınıflandırılmıştır. Soğuk depo gıda ürünleri için; fulfillment e-ticaret stok yönetimi için; bonded gümrüklü depo senaryoları için ayrılmıştır.",
        "Kullanıcı konumu user_lat/user_lng alanlarına kaydedilir; en yakın depo önerisi mesafe sıralaması ile yapılır. Taşıma ücreti transport_distance_km × km_birim_fiyat formülü ile hesaplanır.",
    ),
    "3.6. Toplu Kargo Gönderi Modülü (Arda Pelister)": _p(
        "Toplu gönderi ekranında satıcı CSV şablonu indirip toplu ürün listesi yükleyebilir (gelecek sürüm). Mevcut prototipte manuel adet girişi desteklenmektedir.",
        "Fiyat karşılaştırma tablosunda sütunlar: Taşıyıcı, Birim Fiyat, Toplam Fiyat, Tahmini Teslim, Araç Tipi. En düşük toplam fiyat yeşil arka plan ile işaretlenir.",
    ),
}

# Uzun giriş ek paragraflar
GIRIS_EXTRA = _p(
    "Projenin teknik altyapısı bilinçli olarak 'build gerektirmeyen' frontend mimarisi üzerine kurulmuştur. Bu karar, dört kişilik ekibin farklı frontend deneyim seviyelerinde olması ve hızlı prototipleme ihtiyacı göz önünde bulundurularak alınmıştır. ES modülleri ile kod ayrıştırması sağlanmış; api.js, auth.js, analyze.js gibi dosyalar bağımsız sorumluluk taşımaktadır.",
    "Backend tarafında Express.js tercih edilmesinin gerekçesi; geniş topluluk desteği, middleware ekosistemi ve REST API geliştirme hızıdır. Supabase seçimi ise yönetilen PostgreSQL, otomatik yedekleme ve geliştirme hızı avantajları nedeniyle yapılmıştır. Self-hosted PostgreSQL alternatifi değerlendirilmiş ancak ekip operasyon yükünü azaltmak için cloud tercih edilmiştir.",
    "Yapay zeka tarafında Gemini seçiminin arkasında çok modlu görsel analiz, Türkçe ürün tanıma performansı ve Google Search Grounding özelliği yatmaktadır. Alternatif olarak değerlendirilen modeller arasında maliyet, API kotası ve n8n düğüm desteği kriterleri kullanılmıştır.",
)

OZET = """Günümüzde e-ticaret hacminin artması, bireysel göndericilerin ve küçük işletmelerin kargo süreçlerinde doğru fiyatlandırma, depolama ve son mil teslimat kararlarını hızlı vermesini zorunlu kılmaktadır. Mevcut çözümler çoğunlukla ya yalnızca fiyat karşılaştırması sunmakta ya da operasyonel süreçleri birbirinden kopuk platformlarda yürütmektedir. Bu bitirme projesinde, söz konusu ihtiyaca yanıt vermek üzere KargoTigo adlı web tabanlı entegre lojistik yönetim platformu geliştirilmiştir.

Sistem; yapay zeka destekli ürün görsel analizi, on bir taşıyıcı firması için fiyat karşılaştırması, İstanbul sınırlı günlük kurye operasyonu, otuz noktalı depo kiralama, ağır yük ve nakliyat teklif modülleri, kargo izleme, toplu e-ticaret gönderi planlama, e-fatura üretimi ve sanal lojistik danışmanlığı bileşenlerini tek arayüzde birleştirmektedir. Sunucu tarafında Node.js tabanlı REST mimarisi; veri katmanında Supabase üzerinde PostgreSQL; kimlik doğrulamada JWT ve bcrypt; görsel analizde n8n otomasyon platformu aracılığıyla Google Gemini entegrasyonu kullanılmıştır.

Yönetim ve saha operasyonları için ayrı admin ile şube yetkilisi panelleri tasarlanmış; depo giriş-çıkış ve kurye teslim doğrulamaları kod tabanlı güvenlik mekanizmalarıyla desteklenmiştir. Proje dört kişilik ekip çalışmasıyla yürütülmüş; Emirhan Ercan proje liderliği, Arda Pelister toplu kargo ve e-fatura, Berat Ergül takip ve literatür, Kaan Ada kimlik doğrulama ve nakliyat modüllerinden sorumlu olmuştur.

Geliştirilen prototip uçtan uca senaryolarla test edilmiş; kullanıcı, admin ve şube rollerinde işlevsel doğrulama sağlanmıştır. Elde edilen bulgular, entegre lojistik platformlarının operasyonel verimlilik sağlayabileceğini göstermektedir."""

ABSTRACT = """The growth of e-commerce requires individuals and small businesses to make rapid decisions on pricing, warehousing, and last-mile delivery. Existing tools often provide isolated services without operational continuity. This graduation project presents KargoTigo, a web-based integrated logistics management platform developed by a four-member team at Dogus University.

The system combines AI-powered product image analysis, multi-carrier price comparison across eleven carriers, Istanbul intra-city courier operations, thirty warehouse rental points, heavy cargo and relocation quoting, shipment tracking, bulk dispatch planning, e-invoice generation, and a virtual logistics consultant. The backend uses Node.js REST architecture with Supabase PostgreSQL, JWT and bcrypt authentication, and Google Gemini integrated through n8n workflows.

Dedicated admin and branch panels support warehouse and courier verification. Functional validation was performed for all roles. Results indicate integrated logistics platforms can improve operational efficiency. Future work includes live carrier APIs, payment gateways, and mobile clients."""
