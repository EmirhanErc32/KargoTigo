/** Tasima araclari ve fiziksel limitleri */
export const TRANSPORT_MODES = {
  bus: {
    id: "bus",
    label: "Otobus",
    emoji: "🚌",
    maxWeightKg: 400,
    maxLengthCm: 200,
    maxWidthCm: 120,
    maxHeightCm: 150,
    minDistanceKm: 50,
    maxDistanceKm: 800,
  },
  truck: {
    id: "truck",
    label: "Kamyon",
    emoji: "🚚",
    maxWeightKg: 8000,
    maxLengthCm: 600,
    maxWidthCm: 250,
    maxHeightCm: 280,
    minDistanceKm: 30,
  },
  trailer: {
    id: "trailer",
    label: "Tir",
    emoji: "🚛",
    maxWeightKg: 24000,
    maxLengthCm: 1360,
    maxWidthCm: 250,
    maxHeightCm: 400,
    minDistanceKm: 100,
  },
  ship: {
    id: "ship",
    label: "Gemi",
    emoji: "🚢",
    maxWeightKg: 50000,
    maxLengthCm: 1200,
    maxWidthCm: 250,
    maxHeightCm: 400,
    minDistanceKm: 300,
  },
  plane: {
    id: "plane",
    label: "Ucak Kargo",
    emoji: "✈️",
    maxWeightKg: 2000,
    maxLengthCm: 300,
    maxWidthCm: 200,
    maxHeightCm: 160,
    minDistanceKm: 200,
    maxDistanceKm: 3000,
  },
};

/** Yuk kategorileri */
export const CARGO_TYPES = {
  general: {
    id: "general",
    label: "Genel Agir Yuk",
    emoji: "📦",
    description: "100 kg ustu makine, ekipman, buyuk koli vb.",
    minWeightKg: 100,
    allowedModes: ["bus", "truck", "trailer", "ship", "plane"],
    defaultDims: { lengthCm: 120, widthCm: 80, heightCm: 100 },
  },
  pallet: {
    id: "pallet",
    label: "Palet Yuk",
    emoji: "🧱",
    description: "Euro/standart palet uzerinde toplu yuk.",
    minWeightKg: 100,
    allowedModes: ["bus", "truck", "trailer", "ship"],
    defaultDims: { lengthCm: 120, widthCm: 80, heightCm: 150 },
  },
  motorcycle: {
    id: "motorcycle",
    label: "Motosiklet",
    emoji: "🏍️",
    description: "Motosiklet veya scooter tasimasi.",
    minWeightKg: 80,
    allowedModes: ["bus", "truck", "trailer", "plane"],
    defaultDims: { lengthCm: 220, widthCm: 90, heightCm: 130 },
    defaultWeightKg: 180,
  },
  car: {
    id: "car",
    label: "Araba",
    emoji: "🚗",
    description: "Binek veya ticari arac tasimasi.",
    minWeightKg: 800,
    allowedModes: ["truck", "trailer", "ship"],
    defaultDims: { lengthCm: 450, widthCm: 180, heightCm: 150 },
    defaultWeightKg: 1400,
  },
};

/** Kategori bazli arac uygunluk kurallari */
export function isModeAllowedForCargo(cargoTypeId, modeId, pkg, distanceKm) {
  const cargo = CARGO_TYPES[cargoTypeId];
  const mode = TRANSPORT_MODES[modeId];
  if (!cargo || !mode) return { allowed: false, reason: "Gecersiz kategori veya arac." };

  if (!cargo.allowedModes.includes(modeId)) {
    return { allowed: false, reason: `${cargo.label} icin ${mode.label} kullanilamaz.` };
  }

  const w = Number(pkg.weightKg);
  const l = Number(pkg.lengthCm);
  const wd = Number(pkg.widthCm);
  const h = Number(pkg.heightCm);

  if (w > mode.maxWeightKg) {
    return { allowed: false, reason: `${mode.label} kapasitesi (${mode.maxWeightKg} kg) asildi.` };
  }
  if (l > mode.maxLengthCm || wd > mode.maxWidthCm || h > mode.maxHeightCm) {
    return { allowed: false, reason: `Boyutlar ${mode.label} limitini asiyor.` };
  }

  if (mode.minDistanceKm && distanceKm < mode.minDistanceKm) {
    return { allowed: false, reason: `${mode.label} icin minimum ${mode.minDistanceKm} km mesafe gerekir.` };
  }
  if (mode.maxDistanceKm && distanceKm > mode.maxDistanceKm) {
    return { allowed: false, reason: `${mode.label} bu mesafe icin uygun degil (max ${mode.maxDistanceKm} km).` };
  }

  // Ozel kurallar
  if (cargoTypeId === "car" && modeId === "bus") {
    return { allowed: false, reason: "Araba otobusle tasinamaz." };
  }
  if (cargoTypeId === "car" && modeId === "plane") {
    return { allowed: false, reason: "Araba ucak kargo ile tasinamaz." };
  }
  if (cargoTypeId === "pallet" && modeId === "bus" && w > 350) {
    return { allowed: false, reason: "350 kg ustu palet otobusle tasinamaz." };
  }
  if (cargoTypeId === "motorcycle" && modeId === "bus" && w > 250) {
    return { allowed: false, reason: "250 kg ustu motosiklet otobusle tasinamaz." };
  }
  if (cargoTypeId === "general" && modeId === "bus" && w > 400) {
    return { allowed: false, reason: "400 kg ustu yuk otobusle tasinamaz." };
  }
  if (cargoTypeId === "car" && modeId === "ship" && distanceKm < 300) {
    return { allowed: false, reason: "Araba gemi tasimasi icin kiyi/sehirler arasi uzun mesafe gerekir." };
  }
  if (modeId === "plane" && w > 1500 && cargoTypeId !== "motorcycle") {
    return { allowed: false, reason: "1500 kg ustu yuk ucak kargo ile tasinamaz." };
  }

  return { allowed: true };
}

export const HEAVY_REQUIREMENTS = {
  general: [
    "Urun adi ve detayli aciklama zorunludur",
    "Agirlik minimum 100 kg olmalidir",
    "Yukleme/bosaltma ekipmani gerekiyorsa belirtin",
  ],
  pallet: [
    "Palet sayisi ve palet tipi (Euro/standart) belirtilmeli",
    "Istiflenebilirlik durumu onemlidir",
    "350 kg ustu palet otobusle tasinamaz",
  ],
  motorcycle: [
    "Marka/model ve calisir durum bilgisi gerekli",
    "Yakit seviyesi ve akü durumu bildirilmeli",
    "Otobus sadece paketlenmis, 250 kg alti motosiklet icin",
  ],
  car: [
    "Marka, model, model yili ve plaka zorunlu",
    "Arac calisir durumda mi? (cekici gereksinimi)",
    "Sadece kamyon, tir veya gemi ile tasinabilir",
  ],
};
