export function getPdfStyles(): string {
  return `
  @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700&family=Frank+Ruhl+Libre:wght@700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Heebo', Arial, sans-serif;
    font-size: 11pt;
    color: #1a1a1a;
    background: white;
    direction: rtl;
    line-height: 1.75;
  }

  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 14mm 18mm 18mm 18mm;
    margin: 0 auto;
  }

  .letterhead {
    margin-bottom: 22px;
    text-align: center;
  }

  .lh-contacts {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px 10px;
    font-size: 8pt;
    color: #5a5f66;
    margin-bottom: 14px;
  }

  .lh-sep { color: #c9a84c; }

  .lh-brand { margin-top: 4px; }

  .lh-name {
    font-family: 'Frank Ruhl Libre', 'Times New Roman', serif;
    font-size: 22pt;
    font-weight: 700;
    color: #c9a84c;
    letter-spacing: 0.04em;
    line-height: 1.2;
  }

  .lh-rule {
    width: 56%;
    max-width: 280px;
    height: 1px;
    background: #c9a84c;
    margin: 8px auto 8px;
  }

  .lh-office {
    font-size: 10pt;
    font-weight: 500;
    color: #1b2b3a;
  }

  .letter-meta {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    margin-bottom: 14px;
  }

  .meta-date {
    font-size: 10pt;
    color: #1a1a1a;
    flex-shrink: 0;
    text-align: left;
    direction: ltr;
  }

  .meta-addressee {
    text-align: right;
    flex: 1;
  }

  .meta-label {
    font-size: 10pt;
    font-weight: 700;
    margin-bottom: 2px;
  }

  .meta-name,
  .meta-addr {
    font-size: 10.5pt;
    line-height: 1.45;
  }

  .meta-behalf {
    margin-top: 6px;
    font-size: 9.5pt;
    color: #5a5f66;
  }

  .without-prejudice {
    text-align: center;
    font-size: 10pt;
    font-weight: 700;
    margin: 10px 0 6px;
  }

  .meta-email {
    text-align: center;
    font-size: 9pt;
    color: #5a5f66;
    margin-bottom: 16px;
  }

  .meta-email span {
    text-decoration: underline;
    color: #1a1a1a;
  }

  .letter-subject {
    text-align: center;
    margin: 8px 0 22px;
  }

  .letter-subject p {
    font-size: 11.5pt;
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 3px;
    line-height: 1.5;
  }

  .letter-body p {
    font-size: 11pt;
    margin-bottom: 12px;
    text-align: justify;
  }

  .signature-area {
    margin-top: 36px;
    page-break-inside: avoid;
  }

  .signature-block {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .sig-closing {
    font-size: 11pt;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .sig-stack {
    position: relative;
    min-width: 220px;
    min-height: 72px;
    display: flex;
    align-items: center;
  }

  .sig-scribble {
    position: absolute;
    inset-inline-start: -8px;
    top: 50%;
    transform: translateY(-55%);
    width: 200px;
    height: auto;
    opacity: 0.28;
    pointer-events: none;
    z-index: 0;
  }

  .sig-hand {
    position: absolute;
    inset-inline-start: 0;
    top: -6px;
    max-height: 48px;
    max-width: 160px;
    object-fit: contain;
    z-index: 1;
    opacity: 0.9;
  }

  .sig-text {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .sig-name {
    font-size: 11pt;
    font-weight: 700;
    color: #1a1a1a;
  }

  .sig-office {
    font-size: 10.5pt;
    font-weight: 700;
    color: #1a1a1a;
  }

  .sig-meta {
    font-size: 9.5pt;
    color: #5a5f66;
    margin-top: 2px;
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
