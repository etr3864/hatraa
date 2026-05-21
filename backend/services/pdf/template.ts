import { todayFormatted } from "@/lib/utils";

interface PdfTemplateOptions {
  content: string;
  senderName: string;
  senderAddress: string;
  senderPhone: string;
  senderEmail: string;
  senderIdNumber?: string;
  respondentName: string;
  withSignature: boolean;
  signatureDataUrl?: string;
}

export function buildLetterHtml(opts: PdfTemplateOptions): string {
  const {
    content,
    senderName,
    senderAddress,
    senderPhone,
    senderEmail,
    senderIdNumber,
    respondentName,
    withSignature,
    signatureDataUrl,
  } = opts;

  const paragraphs = content
    .split(/\n{2,}/)
    .filter((p) => p.trim().length > 0)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("\n");

  const signatureBlock = withSignature && signatureDataUrl
    ? `<div class="signature-block">
        <img src="${signatureDataUrl}" alt="חתימת עורך דין" class="signature-img" />
        <p class="signature-name">עו"ד — מאומת ומאושר</p>
       </div>`
    : `<div class="sender-sig">
        <p>${senderName}</p>
       </div>`;

  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="UTF-8" />
<style>
  @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Heebo', Arial, sans-serif;
    font-size: 12pt;
    color: #0f1c28;
    background: white;
    direction: rtl;
    line-height: 1.7;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 10mm 20mm 15mm 20mm;
    margin: 0 auto;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid #d8dade;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }

  .header-logo {
    font-size: 10pt;
    color: #8c9098;
    font-weight: 500;
  }

  .header-date {
    font-size: 10pt;
    color: #5a5f66;
  }

  .parties {
    display: flex;
    justify-content: space-between;
    margin-bottom: 24px;
    gap: 32px;
  }

  .party-block {
    flex: 1;
  }

  .party-label {
    font-size: 9pt;
    font-weight: 700;
    color: #8c9098;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 6px;
  }

  .party-block p {
    font-size: 10.5pt;
    color: #0f1c28;
    line-height: 1.5;
  }

  .letter-title {
    text-align: center;
    margin-bottom: 6px;
  }

  .letter-title h1 {
    font-size: 16pt;
    font-weight: 700;
    color: #1b2b3a;
  }

  .letter-subject {
    text-align: center;
    font-size: 11pt;
    color: #5a5f66;
    margin-bottom: 28px;
  }

  .letter-body p {
    font-size: 11pt;
    color: #0f1c28;
    margin-bottom: 14px;
    text-align: justify;
  }

  .signature-area {
    margin-top: 40px;
  }

  .signature-block {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .signature-img {
    max-height: 60px;
    max-width: 200px;
    object-fit: contain;
  }

  .signature-name {
    font-size: 10pt;
    color: #5a5f66;
  }

  .sender-sig p {
    font-size: 11pt;
    font-weight: 500;
    color: #0f1c28;
  }

  .footer {
    margin-top: 40px;
    padding-top: 12px;
    border-top: 1px solid #e8e4dc;
    text-align: center;
    font-size: 8.5pt;
    color: #b0b5bb;
  }
</style>
</head>
<body>
<div class="page">

  <div class="parties">
    <div class="party-block">
      <div class="party-label">מאת</div>
      <p>${senderName}</p>
      ${senderIdNumber ? `<p>ת.ז.: ${senderIdNumber}</p>` : ""}
      <p>${senderAddress}</p>
      <p>${senderPhone}</p>
      <p>${senderEmail}</p>
    </div>
    <div class="party-block">
      <div class="party-label">אל</div>
      <p>${respondentName}</p>
    </div>
  </div>

  <div class="letter-title">
    <h1>מכתב התראה</h1>
  </div>
  <div class="letter-subject">${todayFormatted()}</div>

  <div class="letter-body">
    ${paragraphs}
  </div>

  <div class="signature-area">
    ${signatureBlock}
  </div>

</div>
</body>
</html>`;
}
