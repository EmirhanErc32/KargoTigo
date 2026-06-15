/**
 * Fatura HTML'ini PDF'e cevirir.
 * Izole iframe + html2canvas + jsPDF (tek gorsel) — html2pdf kirpma sorununu onler.
 */
export function viewInvoiceHtml(html) {
  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
}

function getJsPDF() {
  if (window.jspdf?.jsPDF) return window.jspdf.jsPDF;
  if (typeof window.jsPDF === "function") return window.jsPDF;
  return null;
}

function getHtml2Canvas() {
  return typeof window.html2canvas === "function" ? window.html2canvas : null;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureInvoiceCanvas(html) {
  const html2canvas = getHtml2Canvas();
  if (!html2canvas) {
    throw new Error("PDF kütüphanesi yüklenemedi. Sayfayi yenileyin.");
  }

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: "820px",
    height: "1400px",
    border: "0",
    visibility: "hidden",
    pointerEvents: "none",
  });
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win.document;
  doc.open();
  doc.write(html);
  doc.close();

  await wait(350);

  const invoiceEl = doc.querySelector(".invoice");
  if (!invoiceEl) {
    iframe.remove();
    throw new Error("Fatura şablonu yüklenemedi.");
  }

  const width = Math.ceil(invoiceEl.scrollWidth || invoiceEl.offsetWidth || 720);
  const height = Math.ceil(invoiceEl.scrollHeight || invoiceEl.offsetHeight || 1000);

  try {
    return await html2canvas(invoiceEl, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      window: win,
    });
  } finally {
    iframe.remove();
  }
}

function canvasToPdf(canvas, filename) {
  const JsPDF = getJsPDF();
  if (!JsPDF) throw new Error("PDF kütüphanesi yüklenemedi.");

  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  const pdf = new JsPDF("p", "mm", "a4");
  const margin = 8;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = (canvas.height * contentWidth) / canvas.width;

  pdf.addImage(imgData, "JPEG", margin, margin, contentWidth, contentHeight);

  if (contentHeight > pageHeight - margin * 2) {
    let remaining = contentHeight - (pageHeight - margin * 2);
    let offset = margin - (pageHeight - margin * 2);
    while (remaining > 0) {
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", margin, offset, contentWidth, contentHeight);
      remaining -= pageHeight - margin * 2;
      offset -= pageHeight - margin * 2;
    }
  }

  pdf.save(`${filename}.pdf`);
}

export async function downloadInvoicePdf(html, filename = "fatura") {
  if (!html) throw new Error("Fatura bulunamadı.");

  if (!getHtml2Canvas() || !getJsPDF()) {
    throw new Error("PDF kütüphanesi yüklenemedi. Sayfayi yenileyin.");
  }

  const overlay = document.createElement("div");
  overlay.textContent = "PDF hazirlaniyor…";
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    background: "rgba(255,255,255,0.9)",
    zIndex: "2147483647",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "15px",
    fontWeight: "600",
    color: "#0f172a",
  });
  document.body.appendChild(overlay);

  try {
    const canvas = await captureInvoiceCanvas(html);
    canvasToPdf(canvas, filename);
  } finally {
    overlay.remove();
  }

  return { fallback: false };
}
