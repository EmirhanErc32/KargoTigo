# n8n — KargoTigo Görsel Analiz Workflow

Profesyonel, çok adımlı workflow. **Native Google Gemini** düğümlerini kullanır (Code yerine).

## Akış

```
Webhook → Veriyi Hazırla → Görsel Var mı?
  ├─ [HAYIR] → Hata Yanıtı → Respond
  └─ [EVET] → Base64→Binary → Gemini Görsel Analizi
            → JSON Ayıkla → Gemini Internet Araştırması (Google Search)
            → Sonuçları Birleştir → Respond
```

## Kurulum (5 adım)

### 1) Workflow'u import et

n8n → **Import from File** → `kargo-ai-analiz-workflow.json`

### 2) Gemini Credential oluştur

1. n8n → **Credentials** → **Add Credential**
2. **Google Gemini(PaLM) API** veya **Google Gemini API** seç
3. API Key: `<KENDI_GEMINI_API_ANAHTARINIZ>` (Google AI Studio'dan alın)
4. Kaydet

### 3) Credential'ı düğümlere bağla

Şu iki düğümde credential seç:
- **4 — Gemini Görsel Analizi**
- **6 — Gemini Internet Araştırması**

### 4) Workflow'u Active yap

Sağ üst **Active** anahtarını aç.

### 5) Production URL'i backend'e yaz

Webhook düğümünden **Production URL** kopyala:
```
https://0l5y2qra.rcld.app/webhook/kargo-analiz
```

`backend/.env`:
```
N8N_WEBHOOK_URL=https://0l5y2qra.rcld.app/webhook/kargo-analiz
```

---

## Sorun giderme

### 503 / "high demand" hatasi
Gemini gecici olarak yogun olabilir. Cozumler:
1. 1-2 dakika bekleyip tekrar deneyin
2. `backend/.env` icinde `GEMINI_MODEL=gemini-2.0-flash` kullanin (zaten guncellendi)
3. n8n **Gemini Analiz** code dugumunde `gemini-2.5-flash` yerine `gemini-2.0-flash` yazin
4. Backend n8n basarisiz olursa otomatik yedek modelleri dener

### n8n kontrol listesi
- Workflow **Active** olmali (sag ust anahtar)
- Production URL = `backend/.env` icindeki `N8N_WEBHOOK_URL`
- Gemini API key: https://aistudio.google.com/app/apikey

---

## Veri sözleşmesi

**Gelen (backend → n8n):**
```json
{
  "image": "<base64>",
  "mimeType": "image/jpeg",
  "hint": "Siemens bulaşık makinesi"
}
```

**Giden (n8n → backend):**
```json
{
  "product_name": "Bulaşık Makinesi",
  "brand": "Siemens",
  "model": "SN23HW00TR",
  "category": "Beyaz Eşya",
  "weight_kg": 45,
  "length_cm": 60,
  "width_cm": 60,
  "height_cm": 85,
  "confidence": 0.92,
  "notes": "...",
  "sources": [{ "title": "...", "uri": "https://..." }]
}
```

---

## Test

**Test modu** (Execute workflow sonrası tek seferlik):
```
https://0l5y2qra.rcld.app/webhook-test/kargo-analiz
```

**Production** (Active sonrası sürekli):
```
https://0l5y2qra.rcld.app/webhook/kargo-analiz
```
