import { getUser, getDisplayName } from "./auth.js";

const ULKE_EVRAKLARI = {
  ab: "Avrupa Birliği gönderilerinde <strong>İngilizce ticari fatura</strong>, ceki listesi ve sanayi ürünleri için <strong>A.TR belgesi</strong> zorunludur. Şirket alıcılarında <strong>EORI numarası</strong> gereklidir.",
  us: "ABD gönderilerinde <strong>ticari/proforma fatura</strong> ve <strong>Air Waybill</strong> eklenmelidir. 800 Dolar altı gönderiler <strong>De Minimis</strong> kapsaminda gumruk vergisinden muaftir.",
  gb: "Ingiltere icin <strong>ticari fatura</strong>, ceki listesi ve sevk irsaliyesi gerekir. A.TR belgesi gecersizdir; faturaya <strong>mense beyani</strong> eklenmelidir.",
  cn: "Çin gönderilerinde İngilizce-Çince fatura ve alıcı firmanın <strong>CR Code</strong> bilgisi zorunludur. Elektronik ürünlerde <strong>CCC sertifikasi</strong> gerekebilir.",
  jp: "Japonya gönderilerinde detayli Ingilizce fatura ve kimyasal/gıda ürünlerinde <strong>MSDS/sertifika</strong> belgeleri istenir.",
};

const VERILER = {
  gumruk: "Gümrük süreçlerinde <strong>De Minimis</strong> sinirlari, alıcı <strong>EORI/TC</strong> bilgisi ve ticari degerine gore <strong>ETGB</strong> beyani kontrol edilmelidir.",
  yasakli: "Hava tasimaciliginda <strong>lityum piller</strong> (MSDS'siz), <strong>yanıcı spreyler</strong> ve bozulabilir gıda ürünleri kesinlikle yasaktir.",
  desi: "Faturalandirma reel ağırlık veya desiden hangisi büyükse ona göre yapılır. <strong>Formül:</strong> (En x Boy x Yükseklik) / 5000",
  sure: "Express hava: Avrupa 1-2, Amerika 2-3, Asya 3-5 is gunu. Economy hatlarda Avrupa ortalama 5-7 iş günü surer.",
  hasar: "Hasar durumunda kapıda <strong>Hasar Tespit Tutanağı</strong> tutturun, fotoğraf çekin ve teslimden sonra <strong>7 iş günü</strong> içinde destek talebi açın.",
  ihracat: "Mikro ihracat (ETGB): 300 kg ve 15.000 Euro altı gönderiler için gümrük müşavirliği ücreti ödemeden hızlı beyan yapılır. KDV iadesi mümkündür.",
  sigorta: "Zorunlu değil ama ticari mallar için önerilir. Kapsam: kaza, hırsızlık, kayıp. Geçerli olması için ticari fatura sisteme yüklenmelidir.",
  hscode: "HS Code (GTIP), ürünün gümrük kimlik numarasıdır. Yanlış kod paketin bloke edilmesine ve ceza kesilmesine yol acabilir.",
  kapıda: "Yurt dışı hatlarında kapıda ödeme bulunmaz. Taşıma ücreti gönderici tarafından peşin ödenir, gümrük harçları alıcıya dijital faturalandirilir.",
};

const EVRAK_LABELS = {
  ab: "AB evraklari",
  us: "ABD evraklari",
  gb: "Ingiltere evraklari",
  cn: "Cin evraklari",
  jp: "Japonya evraklari",
};

const TOPICS = [
  { key: "evrak", label: "Gerekli evraklar", dynamic: true },
  { key: "gumruk", label: "Gumruk kurallari" },
  { key: "desi", label: "Desi hesaplama" },
  { key: "sure", label: "Teslimat süresi" },
  { key: "ihracat", label: "Mikro ihracat" },
  { key: "yasakli", label: "Yasaklı ürünler" },
];

let initialized = false;
let typing = false;
let panelOpen = false;

function welcomeText() {
  const first = getDisplayName().split(/\s+/)[0];
  if (first) {
    return `Merhaba ${first}! Kargo fiyat karşılaştırması, şehir içi kurye ve depo kiralama konularında yardımcı olabilirim.`;
  }
  return "Merhaba! Kargo fiyat karşılaştırması, şehir içi kurye ve depo kiralama konularında yardımcı olabilirim.";
}

export function initConsultant() {
  if (initialized) return;
  initialized = true;

  const root = document.createElement("div");
  root.id = "consultant-root";
  root.innerHTML = `
    <button class="consultant-fab" id="consultantFab" type="button" aria-label="Sanal danisman">
      <span class="fab-icon">💬</span>
      <span class="fab-label">Danisman</span>
    </button>
    <div class="consultant-panel" id="consultantPanel" role="dialog" aria-label="Sanal danisman" aria-hidden="true">
      <div class="consultant-header">
        <div class="consultant-header-info">
          <div class="consultant-avatar">🤖</div>
          <div>
            <h3>Lojistik Asistani</h3>
            <div class="status"><span class="dot"></span> Cevrimici</div>
          </div>
        </div>
        <button class="consultant-close" id="consultantClose" type="button" aria-label="Kapat">&times;</button>
      </div>
      <div class="consultant-messages" id="consultantMessages"></div>
      <div class="consultant-footer">
        <select id="consultantCountry" aria-label="Hedef bolge">
          <option value="ab">🇪🇺 Avrupa Birligi</option>
          <option value="us">🇺🇸 Amerika</option>
          <option value="gb">🇬🇧 Ingiltere</option>
          <option value="cn">🇨🇳 Cin</option>
          <option value="jp">🇯🇵 Japonya</option>
        </select>
        <div class="consultant-chips" id="consultantChips"></div>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  const fab = root.querySelector("#consultantFab");
  const panel = root.querySelector("#consultantPanel");
  const closeBtn = root.querySelector("#consultantClose");
  const country = root.querySelector("#consultantCountry");
  const chipsEl = root.querySelector("#consultantChips");
  const messages = root.querySelector("#consultantMessages");

  function nowTime() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function scrollBottom() {
    messages.scrollTop = messages.scrollHeight;
  }

  function renderMessage(role, text, time) {
    const wrap = document.createElement("div");
    wrap.className = `consultant-msg ${role}`;
    wrap.innerHTML = `
      <div class="meta">${role === "bot" ? "Asistan" : "Siz"} · ${time}</div>
      <div class="consultant-bubble">${text}</div>
    `;
    messages.appendChild(wrap);
    scrollBottom();
    return wrap;
  }

  function showTyping() {
    const el = document.createElement("div");
    el.className = "consultant-typing";
    el.id = "consultantTyping";
    el.innerHTML = `
      <div class="typing-dots"><span></span><span></span><span></span></div>
      <span class="typing-label">Asistan yaziyor...</span>
    `;
    messages.appendChild(el);
    scrollBottom();
    return el;
  }

  function hideTyping() {
    document.getElementById("consultantTyping")?.remove();
  }

  function resetChat() {
    messages.innerHTML = "";
    typing = false;
    hideTyping();
  }

  function startFreshChat() {
    resetChat();
    renderMessage("bot", welcomeText(), nowTime());
  }

  function renderChips() {
    const region = country.value;
    chipsEl.innerHTML = TOPICS.map((t) => {
      const label = t.dynamic ? EVRAK_LABELS[region] : t.label;
      return `<button class="consultant-chip" type="button" data-key="${t.key}">${label}</button>`;
    }).join("");
  }

  async function handleTopic(key, label) {
    if (typing) return;
    typing = true;

    renderMessage("user", label, nowTime());

    showTyping();
    const delay = 900 + Math.random() * 800;
    await new Promise((r) => setTimeout(r, delay));

    hideTyping();

    const answer = key === "evrak"
      ? ULKE_EVRAKLARI[country.value]
      : VERILER[key] || "Bu konu hakkında bilgi bulunamadı.";

    renderMessage("bot", answer, nowTime());
    typing = false;
  }

  function openPanel() {
    panel.classList.add("open");
    fab.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    panelOpen = true;
    startFreshChat();
    renderChips();
    scrollBottom();
  }

  function closePanel() {
    panel.classList.remove("open");
    fab.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    panelOpen = false;
    resetChat();
  }

  fab.addEventListener("click", () => {
    if (panelOpen) closePanel();
    else openPanel();
  });
  closeBtn.addEventListener("click", closePanel);
  country.addEventListener("change", renderChips);

  chipsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".consultant-chip");
    if (!btn) return;
    handleTopic(btn.dataset.key, btn.textContent.trim());
  });

  renderChips();
}
