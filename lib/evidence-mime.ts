const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
  pdf: "application/pdf",
};

const ALIASES: Record<string, string> = {
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
  "image/x-png": "image/png",
  "image/heic-sequence": "image/heic",
  "image/heif-sequence": "image/heif",
};

export const SUPPORTED_EVIDENCE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

export function normalizeEvidenceMime(type: string, fileName: string): string {
  const raw = (type || "").split(";")[0].trim().toLowerCase();
  const aliased = ALIASES[raw] ?? raw;
  if (SUPPORTED_EVIDENCE_MIMES.has(aliased)) return aliased;

  const ext = fileName.includes(".")
    ? fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase()
    : "";
  return MIME_BY_EXT[ext] ?? "";
}

export function shortenFileName(name: string, max = 80): string {
  const trimmed = name.trim() || "file";
  if (trimmed.length <= max) return trimmed;
  const ext = trimmed.includes(".") ? trimmed.slice(trimmed.lastIndexOf(".")) : "";
  const base = trimmed.slice(0, Math.max(1, max - ext.length - 3));
  return `${base}...${ext}`;
}

export function isSupportedEvidenceMime(mime: string): boolean {
  return SUPPORTED_EVIDENCE_MIMES.has(mime);
}

export function cleanBase64(data: string): string {
  const raw = data.includes(",") ? (data.split(",").pop() ?? data) : data;
  return raw.replace(/\s/g, "");
}

function peekFileBytes(base64: string, maxBytes = 32): Uint8Array {
  const cleaned = cleanBase64(base64);
  if (!cleaned) return new Uint8Array();

  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(cleaned.slice(0, 256), "base64").subarray(0, maxBytes));
  }

  const sliceLen = Math.ceil(maxBytes / 3) * 4 + 8;
  const binary = atob(cleaned.slice(0, sliceLen));
  const bytes = new Uint8Array(Math.min(maxBytes, binary.length));
  for (let i = 0; i < bytes.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function detectMimeFromBytes(bytes: Uint8Array): string {
  if (bytes.length < 12) return "";

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return "image/gif";
  }
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return "application/pdf";
  }

  const head = String.fromCharCode(...Array.from(bytes.slice(0, 32)));
  if (head.includes("ftyp")) {
    const lower = head.toLowerCase();
    if (lower.includes("heic") || lower.includes("heix") || lower.includes("hevc")) {
      return "image/heic";
    }
    if (lower.includes("heif") || lower.includes("mif1") || lower.includes("msf1")) {
      return "image/heif";
    }
  }

  return "";
}

export function resolveEvidencePayload(
  type: string,
  fileName: string,
  base64: string
): { type: string; base64: string; name: string } {
  const cleaned = cleanBase64(base64);
  if (!cleaned) {
    throw new Error("לא הצלחנו לקרוא את הקובץ");
  }

  let mime = normalizeEvidenceMime(type, fileName);

  try {
    const detected = detectMimeFromBytes(peekFileBytes(cleaned));
    if (detected === "image/gif") {
      throw new Error("קבצי GIF לא נתמכים. שמור כ־JPG או PNG והעלה שוב.");
    }
    if (detected) mime = detected;
  } catch (err) {
    if (err instanceof Error && /GIF|לא נתמכים|לא הצלחנו/.test(err.message)) throw err;
    throw new Error("הקובץ פגום או לא ניתן לקריאה. נסה לשמור מחדש כ־JPG או PNG.");
  }

  if (!isSupportedEvidenceMime(mime)) {
    throw new Error(
      `סוג קובץ לא נתמך: ${shortenFileName(fileName)}. ניתן להעלות JPG, PNG, WebP, HEIC או PDF`
    );
  }

  return {
    type: mime,
    base64: cleaned,
    name: shortenFileName(fileName, 120),
  };
}

export function mapEvidenceFormatError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (
    /did not match the expected pattern|SyntaxError|InvalidCharacterError|INVALID_ARGUMENT|unsupported|mime/i.test(
      message
    )
  ) {
    return "אחת מהראיות בפורמט לא נתמך או פגום. נסה לשמור מחדש כ־JPG/PNG או PDF ולהעלות שוב.";
  }
  if (/[\u0590-\u05FF]/.test(message)) return message;
  return "שגיאה בחילוץ הפרטים. נסה שוב.";
}

export function mapUploadError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/did not match the expected pattern|SyntaxError|InvalidCharacterError/i.test(message)) {
    return "אחת מהראיות בפורמט לא נתמך או פגום. נסה לשמור מחדש כ־JPG/PNG או PDF ולהעלות שוב.";
  }
  if (/Failed to fetch|NetworkError|Load failed/i.test(message)) {
    return "העלאת הקובץ נכשלה בגלל בעיית רשת. בדוק חיבור ונסה שוב.";
  }
  if (/[\u0590-\u05FF]/.test(message)) return message;
  return "לא הצלחנו להעלות את הקובץ. נסה קובץ אחר.";
}

export async function resolveEvidenceFile(file: File): Promise<{
  name: string;
  type: string;
}> {
  const header = new Uint8Array(await file.slice(0, 64).arrayBuffer());
  let mime = normalizeEvidenceMime(file.type, file.name);

  try {
    const detected = detectMimeFromBytes(header);
    if (detected === "image/gif") {
      throw new Error("קבצי GIF לא נתמכים. שמור כ־JPG או PNG והעלה שוב.");
    }
    if (detected) mime = detected;
  } catch (err) {
    if (err instanceof Error && /GIF|לא נתמכים/.test(err.message)) throw err;
  }

  if (
    !isSupportedEvidenceMime(mime) &&
    !/\.(jpe?g|png|webp|heic|heif|pdf)$/i.test(file.name)
  ) {
    throw new Error(
      `סוג קובץ לא נתמך: ${shortenFileName(file.name)}. ניתן להעלות JPG, PNG, WebP, HEIC או PDF`
    );
  }

  if (!isSupportedEvidenceMime(mime)) {
    mime = normalizeEvidenceMime("", file.name);
  }
  if (!isSupportedEvidenceMime(mime)) {
    throw new Error(
      `סוג קובץ לא נתמך: ${shortenFileName(file.name)}. ניתן להעלות JPG, PNG, WebP, HEIC או PDF`
    );
  }

  return {
    name: shortenFileName(file.name, 120),
    type: mime,
  };
}
