# KargoTigo — AI Destekli Akıllı Kargo Analizi ve Fiyatlandırma

Kullanıcının yüklediği **ürün fotoğrafını** yapay zeka (Google Gemini) ile analiz eden,
ürünün **marka/model/ağırlık/boyut** bilgilerini **Google araması** ile internetten bulup
**kaynaklarıyla** doğrulatan, kullanıcı onayından sonra **en uygun kargo aracını
(kamyon, uçak, motosiklet, van, gemi) ve fiyatını** hesaplayan bir web uygulaması.

> Bitirme projesi olarak tasarlanmıştır. Modüler, açıklamalı ve genişletilebilir bir mimariye sahiptir.

---

## Özellikler

- 📷 **Fotoğraf yükleme** (sürükle-bırak) + önizleme
- 🤖 **Gemini görsel analizi** — ürünü tanır
- 🔎 **Google Search Grounding** — ağırlık/boyut bilgisini internetten bulur ve **kaynak linkleri** sunar (doğruluk kanıtı)
- ✅ **Kullanıcı onayı** — AI'nin bulduğu değerleri düzenleyip onaylama adımı
- 🚚 **Tüm kargo firmaları için fiyatlandırma** — Yurtiçi, Aras, MNG, PTT, Sürat, Sendeo, HepsiJET (yurt içi) + UPS, DHL, FedEx, Aramex (uluslararası). Her firma için desi/ağırlık/mesafe bazlı fiyat, kullanılacak araç ve teslim süresi; en ucuz uygun firma vurgulanır.
- 🔐 **JWT token'lı kimlik doğrulama** (kayıt / giriş)
- 🗄️ **Supabase** veritabanı entegrasyonu (kullanıcı, analiz, gönderi kayıtları)
- 🧩 **Modüler yapı** — backend servisleri ve frontend JS modülleri ayrı ayrı

---

## Mimari

```
BitirmeProjesi/
├── backend/                 # Node.js + Express API
│   ├── config/              # env & supabase yapılandırması
│   ├── controllers/         # istek işleyiciler (auth, analyze, shipping)
│   ├── middleware/          # auth, upload, hata yönetimi
│   ├── routes/              # API endpoint tanımları
│   ├── services/            # iş mantığı
│   │   ├── auth.service.js
│   │   ├── gemini.service.js
│   │   └── shipping/        # kargo adaptörü + firma tarifeleri + motor
│   │       ├── carriers.js   # kargo firmaları ve fiyat profilleri
│   │       ├── distance.js   # şehirler arası mesafe tahmini
│   │       ├── internal.provider.js # firma bazlı hesaplama motoru
│   │       └── index.js      # sağlayıcı adaptörü (internal/external)
│   ├── utils/               # token, http yardımcıları
│   └── server.js            # giriş noktası
├── frontend/                # HTML + CSS + modüler JS (build gerektirmez)
│   ├── css/                 # base / components / app
│   ├── js/                  # api, auth, analyze, shipping, render, app...
│   ├── index.html           # ana uygulama (3 adımlı sihirbaz)
│   └── login.html           # giriş / kayıt
└── database/
    └── schema.sql           # Supabase tabloları
```

### Akış

1. Kullanıcı giriş yapar (JWT token alınır) →
2. Fotoğraf yükler →
3. Backend görseli Gemini'ye gönderir; Gemini ürünü tanır ve **Google'dan** ağırlık/boyut bulur →
4. Sonuç + kaynaklar kullanıcıya gösterilir, kullanıcı **onaylar/düzeltir** →
5. Onaylı bilgilerle kargo motoru çalışır, **araç seçenekleri ve fiyatlar** listelenir.

---

## Kurulum

### 1) Gereksinimler

- **Node.js 18+** (geliştirme Node 22 ile yapıldı)
- Bir **Google Gemini API anahtarı** — https://aistudio.google.com/app/apikey (ücretsiz)
- Bir **Supabase** projesi — https://supabase.com (ücretsiz)

### 2) Veritabanını hazırla

1. Supabase'de yeni proje oluştur.
2. **SQL Editor**'ı aç, `database/schema.sql` dosyasının tamamını yapıştır ve çalıştır.
3. **Project Settings → API** kısmından `URL` ve `service_role` anahtarını al.

### 3) Backend'i ayarla

```bash
cd backend
npm install
cp .env.example .env
```

`.env` dosyasını doldur:

```
JWT_SECRET=...            # güçlü rastgele değer
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
```

Güçlü bir JWT anahtarı üretmek için:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 4) Çalıştır

```bash
cd backend
npm start
```

Sonra tarayıcıda aç: **http://localhost:3000**
(Backend, `frontend/` klasörünü de aynı adresten servis eder; ayrıca sunucuya gerek yok.)

Sağlık kontrolü: http://localhost:3000/api/health

---

## API Uç Noktaları

| Yöntem | Yol                            | Açıklama                              | Auth |
| ------ | ------------------------------ | ------------------------------------- | ---- |
| POST   | `/api/auth/register`           | Kayıt ol, token döner                 | ❌   |
| POST   | `/api/auth/login`              | Giriş yap, token döner                | ❌   |
| GET    | `/api/auth/me`                 | Mevcut kullanıcı                      | ✅   |
| POST   | `/api/analyze`                 | Fotoğraf analizi (multipart `image`)  | ⭕\* |
| PATCH  | `/api/analyze/:id/confirm`     | Analizi onayla/düzelt                 | ✅   |
| POST   | `/api/shipping/quote`          | Kargo fiyat teklifi                   | ⭕\* |
| GET    | `/api/shipping/cities`         | Bilinen şehir listesi                 | ❌   |

\* İsteğe bağlı: Giriş yapılmışsa sonuç veritabanına kaydedilir.

---

## Gerçek Kargo API'si Bağlama (opsiyonel)

Fiyatlandırma varsayılan olarak **yerleşik hesaplama motoru** ile çalışır.
Gerçek bir kargo sağlayıcısı entegre etmek için:

1. `.env` içinde:
   ```
   SHIPPING_PROVIDER=external
   SHIPPING_API_URL=https://saglayici.com/rates
   SHIPPING_API_KEY=...
   ```
2. `backend/services/shipping/index.js` içindeki `quoteExternal()` fonksiyonunda,
   sağlayıcının istek gövdesini ve dönen cevabın `options` formatına dönüşümünü düzenle.

Harici API hata verirse sistem otomatik olarak yerleşik motora döner (kesintisizlik).

---

## Güvenlik Notları

- `service_role` anahtarı ve `GEMINI_API_KEY` **yalnızca backend'de** tutulur, frontend'e asla konmaz.
- Şifreler **bcrypt** ile hash'lenir.
- Giriş/kayıt uç noktalarında **rate limiting** vardır.
- `.env` dosyası `.gitignore` ile dışlanmıştır — git'e gönderilmez.

---

## Teknolojiler

- **Backend:** Node.js, Express, JWT (jsonwebtoken), bcryptjs, Multer, Supabase JS
- **AI:** Google Gemini (görsel + Google Search Grounding)
- **Frontend:** Saf HTML + CSS + modüler JavaScript (framework yok, build yok)
- **Veritabanı:** Supabase (PostgreSQL)
