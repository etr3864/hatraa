import fs from "fs";
import path from "path";

let cached: string | undefined;

export function loadSignatureScribbleDataUrl(): string | undefined {
  if (cached !== undefined) return cached || undefined;

  const filePath = path.join(
    process.cwd(),
    "backend/services/pdf/assets/signature-scribble.png"
  );

  try {
    if (!fs.existsSync(filePath)) {
      cached = "";
      return undefined;
    }
    const buffer = fs.readFileSync(filePath);
    cached = `data:image/png;base64,${buffer.toString("base64")}`;
    return cached;
  } catch {
    cached = "";
    return undefined;
  }
}
