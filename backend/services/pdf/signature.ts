import { escapeHtml } from "./escape";

interface SignatureOptions {
  withSignature: boolean;
  signatureDataUrl?: string;
  displaySender: string;
  senderPhone: string;
  senderEmail: string;
}

export function buildDisplaySender(opts: {
  senderName: string;
  companyName?: string;
  signatoryRole?: string;
}): string {
  const { senderName, companyName, signatoryRole } = opts;
  return companyName
    ? `${escapeHtml(companyName)}${signatoryRole ? ` - ${escapeHtml(signatoryRole)}: ${escapeHtml(senderName)}` : ` - ${escapeHtml(senderName)}`}`
    : escapeHtml(senderName);
}

export function buildSignatureHtml(opts: SignatureOptions): string {
  const { withSignature, signatureDataUrl, displaySender, senderPhone, senderEmail } = opts;

  if (withSignature && signatureDataUrl) {
    return `<div class="signature-block">
        <img src="${signatureDataUrl}" alt="חתימת עורך דין" class="signature-img" />
        <p class="signature-name">עו&quot;ד - מאומת ומאושר</p>
       </div>`;
  }

  return `<div class="sender-sig">
        <p>${displaySender}</p>
        <p class="sender-meta">${escapeHtml(senderPhone)} | ${escapeHtml(senderEmail)}</p>
       </div>`;
}
