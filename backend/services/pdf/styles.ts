export function getPdfStyles(): string {
  return `
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

  .parties {
    display: flex;
    justify-content: space-between;
    margin-bottom: 24px;
    gap: 32px;
  }

  .party-block { flex: 1; }

  .party-label {
    font-size: 9pt;
    font-weight: 700;
    color: #8c9098;
    margin-bottom: 6px;
  }

  .party-block p {
    font-size: 10.5pt;
    color: #0f1c28;
    line-height: 1.5;
  }

  .party-meta {
    margin-top: 8px;
    font-size: 10pt !important;
    color: #5a5f66 !important;
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

  .signature-area { margin-top: 40px; }

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

  .signature-name,
  .sender-meta {
    font-size: 10pt;
    color: #5a5f66;
  }

  .sender-sig p {
    font-size: 11pt;
    font-weight: 500;
    color: #0f1c28;
  }

  .appendix-page {
    page-break-before: always;
    padding: 10mm 20mm 15mm 20mm;
  }

  .appendix-title {
    font-size: 14pt;
    font-weight: 700;
    color: #1b2b3a;
    margin-bottom: 6px;
  }

  .appendix-meta {
    font-size: 10pt;
    color: #5a5f66;
    margin-bottom: 12px;
  }

  .appendix-desc {
    font-size: 10.5pt;
    color: #0f1c28;
    margin-bottom: 14px;
  }

  .appendix-image {
    max-width: 100%;
    max-height: 220mm;
    object-fit: contain;
    border: 1px solid #d8dade;
  }

  .appendix-note {
    font-size: 10.5pt;
    color: #5a5f66;
    margin-top: 16px;
  }

  .appendix-index {
    margin: 12px 0 0 20px;
    padding: 0;
    font-size: 11pt;
    color: #0f1c28;
    line-height: 1.8;
  }

  .appendix-index li {
    margin-bottom: 6px;
  }
`;
}
