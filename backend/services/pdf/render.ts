import { buildLetterHtml } from "./template";
import type { LetterInput } from "@/lib/types";

function getHebrewDate(): string {
  const now = new Date();
  const gregorian = now.toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const dayStr = now.toLocaleDateString("he-IL-u-ca-hebrew", { day: "numeric" });
  const month = now.toLocaleDateString("he-IL-u-ca-hebrew", { month: "long" });
  const yearStr = now.toLocaleDateString("he-IL-u-ca-hebrew", { year: "numeric" });

  const dayNum = parseInt(dayStr);
  const yearNum = parseInt(yearStr);

  const hebrewDay = numberToHebrewLetters(dayNum);
  const hebrewYear = numberToHebrewLetters(yearNum % 1000);

  return `${gregorian} | ${hebrewDay} ב${month} ${hebrewYear}`;
}

function numberToHebrewLetters(num: number): string {
  const ones = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
  const tens = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
  const hundreds = ["", "ק", "ר", "ש", "ת"];

  if (num === 15) return "ט״ו";
  if (num === 16) return "ט״ז";

  let result = "";
  let n = num;

  if (n >= 100) {
    const h = Math.floor(n / 100);
    if (h <= 4) {
      result += hundreds[h];
    } else {
      for (let i = 0; i < Math.floor(h / 4); i++) result += "ת";
      if (h % 4 > 0) result += hundreds[h % 4];
    }
    n %= 100;
  }
  if (n >= 10) {
    if (n === 15) { result += "טו"; n = 0; }
    else if (n === 16) { result += "טז"; n = 0; }
    else { result += tens[Math.floor(n / 10)]; n %= 10; }
  }
  if (n > 0) {
    result += ones[n];
  }

  if (result.length > 1) {
    result = result.slice(0, -1) + "״" + result.slice(-1);
  } else if (result.length === 1) {
    result += "׳";
  }

  return result;
}

interface RenderOptions {
  letterInput: LetterInput;
  content: string;
  withSignature: boolean;
  signatureDataUrl?: string;
}

export async function renderPDF(opts: RenderOptions): Promise<Buffer> {
  const { letterInput, content, withSignature, signatureDataUrl } = opts;

  const html = buildLetterHtml({
    content,
    senderName: letterInput.senderName,
    senderAddress: `${letterInput.senderAddress}`,
    senderPhone: letterInput.senderPhone,
    senderEmail: letterInput.senderEmail,
    senderIdNumber: letterInput.senderIdNumber,
    respondentName: letterInput.respondentName,
    withSignature,
    signatureDataUrl,
  });

  let browser;

  if (process.env.VERCEL) {
    const chromiumModule = await import("@sparticuz/chromium");
    const chromium = chromiumModule.default;
    const puppeteerModule = await import("puppeteer-core");
    const puppeteer = puppeteerModule.default;

    const executablePath = await chromium.executablePath();
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath,
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
      headerTemplate: `
        <div style="width:100%;padding:10mm 20mm 8px 20mm;border-bottom:1px solid #d8dade;font-family:Heebo,Arial,sans-serif;font-size:9pt;color:#5a5f66;direction:rtl;display:flex;justify-content:space-between;align-items:center;">
          <span>מכתב התראה</span>
          <span style="font-size:8pt;color:#8c9098;">${getHebrewDate()}</span>
        </div>
      `,
      footerTemplate: `
        <div style="width:100%;padding:8px 20mm;font-family:Heebo,Arial,sans-serif;font-size:8pt;color:#b0b5bb;direction:rtl;text-align:center;">
          עמוד <span class="pageNumber"></span> מתוך <span class="totalPages"></span>
        </div>
      `,
      margin: { top: "25mm", bottom: "15mm", left: "0mm", right: "0mm" },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
