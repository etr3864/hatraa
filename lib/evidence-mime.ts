const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
};

const ALIASES: Record<string, string> = {
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
  "image/x-png": "image/png",
};

export const SUPPORTED_EVIDENCE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

export function normalizeEvidenceMime(type: string, fileName: string): string {
  const raw = (type || "").split(";")[0].trim().toLowerCase();
  const aliased = ALIASES[raw] ?? raw;
  if (SUPPORTED_EVIDENCE_MIMES.has(aliased)) return aliased;

  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "";
}

export function shortenFileName(name: string, max = 80): string {
  const trimmed = name.trim() || "file";
  if (trimmed.length <= max) return trimmed;
  const ext = trimmed.includes(".") ? trimmed.slice(trimmed.lastIndexOf(".")) : "";
  const base = trimmed.slice(0, Math.max(1, max - ext.length - 1));
  return `${base}…${ext}`;
}

export function isSupportedEvidenceMime(mime: string): boolean {
  return SUPPORTED_EVIDENCE_MIMES.has(mime);
}
