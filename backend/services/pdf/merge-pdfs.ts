import { PDFDocument } from "pdf-lib";

/** ממזג PDF ראשי עם נספחי PDF. נכשל אם אחד מהם פגום. */
export async function mergePdfBuffers(
  mainPdf: Buffer,
  appendixPdfs: Buffer[]
): Promise<Buffer> {
  if (appendixPdfs.length === 0) return mainPdf;

  const merged = await PDFDocument.load(mainPdf, { ignoreEncryption: true });

  for (const bytes of appendixPdfs) {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    for (const page of pages) {
      merged.addPage(page);
    }
  }

  const out = await merged.save();
  return Buffer.from(out);
}
