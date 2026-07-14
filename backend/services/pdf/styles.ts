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
`;
}
