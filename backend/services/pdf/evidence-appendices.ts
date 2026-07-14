import { escapeHtml } from "./escape";
import { getEvidenceBuffer } from "@/backend/services/storage/r2";

export interface PdfEvidenceItem {
  label: string;
  fileName: string;
  mimeType: string;
  r2Key: string;
  description?: string | null;
}

function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

export async function buildEvidenceAppendicesHtml(
  items: PdfEvidenceItem[]
): Promise<string> {
  if (items.length === 0) return "";

  const sections: string[] = [];

  for (const item of items) {
    const desc = item.description
      ? `<p class="appendix-desc">${escapeHtml(item.description)}</p>`
      : "";

    if (isImage(item.mimeType)) {
      try {
        const { buffer, contentType } = await getEvidenceBuffer(item.r2Key);
        const mime = contentType || item.mimeType;
        const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;
        sections.push(`<section class="appendix-page">
  <h2 class="appendix-title">${escapeHtml(item.label)}</h2>
  <p class="appendix-meta">${escapeHtml(item.fileName)}</p>
  ${desc}
  <img class="appendix-image" src="${dataUrl}" alt="${escapeHtml(item.label)}" />
</section>`);
      } catch {
        sections.push(fallbackAppendix(item, desc));
      }
    } else {
      sections.push(fallbackAppendix(item, desc));
    }
  }

  return sections.join("\n");
}

function fallbackAppendix(item: PdfEvidenceItem, desc: string): string {
  const kind = item.mimeType === "application/pdf" ? "קובץ PDF" : "קובץ מצורף";
  return `<section class="appendix-page">
  <h2 class="appendix-title">${escapeHtml(item.label)}</h2>
  <p class="appendix-meta">${escapeHtml(item.fileName)} · ${kind}</p>
  ${desc}
  <p class="appendix-note">הקובץ נשמר במערכת ומצורף לרשומת הליד. ניתן להוריד אותו ממסך ניהול הלידים.</p>
</section>`;
}
