import multer from "multer";

/**
 * Gorseli diske degil, bellege (RAM) alir; cunku dosyayi dogrudan
 * Gemini'ye base64 olarak gonderecegiz, kalici saklamamiza gerek yok.
 */
const storage = multer.memoryStorage();

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export const uploadImage = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter(req, file, cb) {
    if (ALLOWED.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Desteklenmeyen dosya turu. JPEG/PNG/WEBP yukleyin."));
    }
  },
}).single("image");
