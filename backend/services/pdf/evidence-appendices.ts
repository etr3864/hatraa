import { escapeHtml } from "./escape";
import { getEvidenceBuffer } from "@/backend/services/storage/r2";
import type { PdfEvidenceItem } from "./evidence-types";

export type { PdfEvidenceItem } from "./evidence-types";

function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

function isPdf(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

function buildIndexHtml(items: PdfEvidenceItem[]): string {
  if (items.length === 0) return "";

  const rows = items
    .map((item) => {
      const kind = isPdf(item.mimeType)
        ? "PDF"
        : isImage(item.mimeType)
          ? "תמונה"
          : "קובץ";
      return `<li><strong>${escapeHtml(item.label)}</strong> - ${escapeHtml(item.fileName)} (${kind})</li>`;
    })
    .join("\n");

  return `<section class="appendix-page">
  <h2 class="appendix-title">רשימת נספחים</h2>
  <ol class="appendix-index">
    ${rows}
  </ol>
</section>`;
}

async function buildImageAppendixHtml(item: PdfEvidenceItem): Promise<string> {
  const desc = item.description
    ? `<p class="appendix-desc">${escapeHtml(item.description)}</p>`
    : "";
  const { buffer, contentType } = await getEvidenceBuffer(item.r2Key);
  const mime = contentType || item.mimeType;
  const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;

  return `<section class="appendix-page">
  <h2 class="appendix-title">${escapeHtml(item.label)}</h2>
  <p class="appendix-meta">${escapeHtml(item.fileName)}</p>
  ${desc}
  <img class="appendix-image" src="${dataUrl}" alt="${escapeHtml(item.label)}" />
</section>`;
}

function buildPdfCoverHtml(item: PdfEvidenceItem): string {
  const desc = item.description
    ? `<p class="appendix-desc">${escapeHtml(item.description)}</p>`
    : "";

  return `<section class="appendix-page">
  <h2 class="appendix-title">${escapeHtml(item.label)}</h2>
  <p class="appendix-meta">${escapeHtml(item.fileName)} · קובץ PDF</p>
  ${desc}
  <p class="appendix-note">המסמך המלא מצורף בעמודים הבאים כחלק מקובץ זה.</p>
</section>`;
}

/** עמודי HTML: רשימה + תמונות + שער ל-PDF (התוכן המלא ממוזג אחר כך). */
export async function buildEvidenceAppendicesHtml(
  items: PdfEvidenceItem[]
): Promise<string> {
  if (items.length === 0) return "";

  const parts: string[] = [buildIndexHtml(items)];

  for (const item of items) {
    if (isImage(item.mimeType)) {
      parts.push(await buildImageAppendixHtml(item));
      continue;
    }
    if (isPdf(item.mimeType)) {
      parts.push(buildPdfCoverHtml(item));
      continue;
    }
    throw new Error(`סוג ראיה לא נתמך ב-PDF: ${item.mimeType}`);
  }

  return parts.join("\n");
}
