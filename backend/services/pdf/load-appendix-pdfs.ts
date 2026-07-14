import { getEvidenceBuffer } from "@/backend/services/storage/r2";
import type { PdfEvidenceItem } from "./evidence-types";

export type { PdfEvidenceItem } from "./evidence-types";

export async function loadAppendixPdfBuffers(
  items: PdfEvidenceItem[]
): Promise<Buffer[]> {
  const pdfs = items.filter((i) => i.mimeType === "application/pdf");
  const buffers: Buffer[] = [];

  for (const item of pdfs) {
    const { buffer } = await getEvidenceBuffer(item.r2Key);
    buffers.push(buffer);
  }

  return buffers;
}
