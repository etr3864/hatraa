import { buildLetterHtml } from "./template";
import { buildEvidenceAppendicesHtml } from "./evidence-appendices";
import { loadAppendixPdfBuffers } from "./load-appendix-pdfs";
import { mergePdfBuffers } from "./merge-pdfs";
import type { PdfEvidenceItem } from "./evidence-types";
import type { LetterInput } from "@/lib/types";

interface RenderOptions {
  letterInput: LetterInput;
  content: string;
  withSignature: boolean;
  attorneyVerified?: boolean;
  signatureDataUrl?: string;
  evidence?: PdfEvidenceItem[];
}

export async function renderPDF(opts: RenderOptions): Promise<Buffer> {
  const {
    letterInput,
    content,
    withSignature,
    attorneyVerified,
    signatureDataUrl,
    evidence,
  } = opts;

  const evidenceHtml = await buildEvidenceAppendicesHtml(evidence ?? []);

  const isCompany = letterInput.senderType === "company";
  const html = buildLetterHtml({
    content,
    senderName: letterInput.senderName,
    senderAddress: letterInput.senderAddress,
    senderPhone: letterInput.senderPhone,
    senderEmail: letterInput.senderEmail,
    senderIdNumber: letterInput.senderIdNumber,
    companyName: isCompany ? letterInput.companyName : undefined,
    companyNumber: isCompany ? letterInput.companyNumber : undefined,
    signatoryRole: isCompany ? letterInput.signatoryRole : undefined,
    respondentName: letterInput.respondentName,
    respondentAddress: letterInput.respondentAddress,
    withSignature,
    attorneyVerified: !!attorneyVerified && withSignature,
    signatureDataUrl,
    evidenceHtml,
  });

  let browser;

  if (process.env.VERCEL) {
    const chromiumModule = await import("@sparticuz/chromium-min");
    const chromium = chromiumModule.default;
    const puppeteerModule = await import("puppeteer-core");
    const puppeteer = puppeteerModule.default;

    // chromium-min מוריד את ה-pack ב-runtime. שם הקובץ לפי ארכיטקטורה (x64), לא .tar.br הישן.
    // override: CHROMIUM_REMOTE_EXEC_PATH (מומלץ לארח את הקובץ ב-CDN קרוב ל-Vercel).
    const packVersion = "148.0.0";
    const packUrl =
      process.env.CHROMIUM_REMOTE_EXEC_PATH ??
      `https://github.com/Sparticuz/chromium/releases/download/v${packVersion}/chromium-v${packVersion}-pack.x64.tar`;

    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(packUrl),
      headless: true,
    });
  } else {
    const puppeteerModule = await import("puppeteer");
    const puppeteer = puppeteerModule.default;
    browser = await puppeteer.launch({ headless: true });
  }

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `<div></div>`,
      footerTemplate: `
        <div style="width:100%;padding:6px 18mm;font-family:Heebo,Arial,sans-serif;font-size:8pt;color:#b0b5bb;direction:rtl;text-align:center;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `,
      margin: { top: "10mm", bottom: "14mm", left: "0mm", right: "0mm" },
    });

    const mainPdf = Buffer.from(pdfBuffer);
    const appendixPdfs = await loadAppendixPdfBuffers(evidence ?? []);
    return mergePdfBuffers(mainPdf, appendixPdfs);
  } finally {
    await browser.close();
  }
}
