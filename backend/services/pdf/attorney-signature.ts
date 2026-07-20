import { getEvidenceBuffer, isR2Configured } from "@/backend/services/storage/r2";

const DEFAULT_R2_KEY = "private/attorney-signature.png";

export async function loadAttorneySignatureDataUrl(): Promise<
  string | undefined
> {
  const fromEnv = signatureFromEnv();
  if (fromEnv) return fromEnv;

  if (!isR2Configured()) return undefined;

  const key =
    process.env.ATTORNEY_SIGNATURE_R2_KEY?.trim() || DEFAULT_R2_KEY;

  try {
    const { buffer, contentType } = await getEvidenceBuffer(key);
    const mime = contentType?.startsWith("image/")
      ? contentType
      : "image/png";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return undefined;
  }
}

function signatureFromEnv(): string | undefined {
  const raw = process.env.ATTORNEY_SIGNATURE_BASE64?.trim();
  if (!raw) return undefined;
  if (raw.startsWith("data:image/")) return raw;
  return `data:image/png;base64,${raw.replace(/\s/g, "")}`;
}
