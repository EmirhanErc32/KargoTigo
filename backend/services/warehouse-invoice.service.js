function fmt(n) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 }).format(n || 0);
}

function fmtDate(iso) {
  if (!iso) return new Date().toLocaleDateString("tr-TR");
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export function buildInvoiceHtml({ booking, warehouse }) {
  const fullName = `${booking.first_name || ""} ${booking.last_name || ""}`.trim();
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8"/>
<title>E-Fatura ${booking.invoice_no}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f172a; padding: 16px; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .invoice { max-width: 720px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: visible; background: #fff; }
  .head { background: #0c1e35; background: linear-gradient(135deg, #0c1e35, #1a3558); color: #fff; padding: 28px 32px; display: flex; justify-content: space-between; align-items: flex-start; }
  .head h1 { font-size: 22px; margin-bottom: 4px; }
  .head p { opacity: 0.8; font-size: 13px; }
  .badge { background: #10b981; color: #fff; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; }
  .body { padding: 28px 32px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  .block h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; margin-bottom: 8px; }
  .block p { font-size: 14px; line-height: 1.6; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th, td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
  th { background: #f8fafc; font-weight: 700; color: #475569; font-size: 12px; text-transform: uppercase; }
  td.num { text-align: right; }
  .totals { margin-left: auto; width: 280px; }
  .totals div { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
  .totals .grand { font-size: 18px; font-weight: 800; color: #0c1e35; border-top: 2px solid #0c1e35; padding-top: 12px; margin-top: 8px; }
  .foot { background: #f8fafc; padding: 20px 32px; font-size: 12px; color: #64748b; line-height: 1.6; }
  @media print { body { padding: 0; } .invoice { border: none; } }
</style>
</head>
<body>
<div class="invoice">
  <div class="head" style="background:#0c1e35;color:#fff;padding:28px 32px;display:flex;justify-content:space-between;align-items:flex-start;">
    <div>
      <h1 style="font-size:22px;margin-bottom:4px;color:#fff;">KargoTigo Depo Hizmetleri</h1>
      <p style="opacity:0.8;font-size:13px;color:#fff;">E-Arsiv Fatura</p>
      <p style="margin-top:8px;color:#fff;">Fatura No: <strong>${booking.invoice_no}</strong></p>
      <p style="color:#fff;">Tarih: ${fmtDate(booking.paid_at || booking.created_at)}</p>
    </div>
    <span class="badge" style="background:#10b981;color:#fff;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:700;">ODENDI</span>
  </div>
  <div class="body" style="padding:28px 32px;">
    <div class="grid" style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px;">
      <div class="block">
        <h3>Musteri Bilgileri</h3>
        <p><strong>${fullName}</strong><br/>
        TC: ${booking.tc_no || "—"}<br/>
        ${booking.email || ""}<br/>
        ${booking.contact_phone || ""}<br/>
        ${booking.personal_address || ""}</p>
      </div>
      <div class="block">
        <h3>Depo Bilgileri</h3>
        <p><strong>${warehouse?.name || booking.warehouse_name}</strong><br/>
        ${warehouse?.district || booking.district}, ${warehouse?.city || booking.city}<br/>
        ${warehouse?.address || ""}<br/>
        Alan: ${booking.area_sqm} m² · ${booking.storage_days} gun</p>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead>
        <tr><th style="padding:12px 14px;text-align:left;border-bottom:1px solid #e2e8f0;background:#f8fafc;font-weight:700;color:#475569;font-size:12px;text-transform:uppercase;">Hizmet</th><th style="padding:12px 14px;text-align:left;border-bottom:1px solid #e2e8f0;background:#f8fafc;font-weight:700;color:#475569;font-size:12px;text-transform:uppercase;">Detay</th><th style="padding:12px 14px;text-align:right;border-bottom:1px solid #e2e8f0;background:#f8fafc;font-weight:700;color:#475569;font-size:12px;text-transform:uppercase;">Tutar</th></tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:12px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;">Depolama Ucreti</td>
          <td style="padding:12px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;">${booking.area_sqm} m² × ${booking.storage_days} gun · teslimat musteri</td>
          <td style="padding:12px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;text-align:right;">${fmt(booking.storage_subtotal)}</td>
        </tr>
        <tr>
          <td style="padding:12px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;">KDV (%20)</td>
          <td style="padding:12px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;">Matrah uzerinden</td>
          <td style="padding:12px 14px;border-bottom:1px solid #e2e8f0;font-size:14px;text-align:right;">${fmt(booking.kdv)}</td>
        </tr>
      </tbody>
    </table>
    <div class="totals" style="margin-left:auto;width:280px;">
      <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;"><span>Ara Toplam</span><span>${fmt(booking.subtotal)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;"><span>KDV</span><span>${fmt(booking.kdv)}</span></div>
      <div class="grand" style="display:flex;justify-content:space-between;font-size:18px;font-weight:800;color:#0c1e35;border-top:2px solid #0c1e35;padding-top:12px;margin-top:8px;"><span>Genel Toplam</span><span>${fmt(booking.total_price)}</span></div>
    </div>
  </div>
  <div class="foot" style="background:#f8fafc;padding:20px 32px;font-size:12px;color:#64748b;line-height:1.6;">
    Bu belge elektronik ortamda oluşturulmuştur. Depo giriş şifresi teslim sırasında, çıkış şifresi teslim alma sırasında kullanilir.
    Rezervasyon No: ${booking.id}
  </div>
</div>
</body>
</html>`;
}
