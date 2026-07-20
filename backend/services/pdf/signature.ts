import { escapeHtml } from "./escape";
import { ATTORNEY } from "@/lib/attorney";

interface SignatureOptions {
  withSignature: boolean;
  attorneyVerified?: boolean;
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
  const {
    withSignature,
    attorneyVerified,
    signatureDataUrl,
    displaySender,
    senderPhone,
    senderEmail,
  } = opts;

  // Paid attorney letter: always show attorney identity (image optional)
  if (withSignature || attorneyVerified) {
    const licenseLine = ATTORNEY.licenseNumber
      ? `<p class="signature-name">רישיון ${escapeHtml(ATTORNEY.licenseNumber)}</p>`
      : "";
    const image = signatureDataUrl
      ? `<img src="${signatureDataUrl}" alt="חתימת עורך דין" class="signature-img" />`
      : `<div class="signature-placeholder"><span>חתימת עו&quot;ד</span></div>`;

    return `<div class="signature-block">
        ${image}
        <p class="signature-name">${escapeHtml(ATTORNEY.displayName)}</p>
        ${licenseLine}
        <p class="signature-name">${escapeHtml(ATTORNEY.signatureCaption)}</p>
       </div>`;
  }

  return `<div class="sender-sig">
        <p>${displaySender}</p>
        <p class="sender-meta">${escapeHtml(senderPhone)} | ${escapeHtml(senderEmail)}</p>
       </div>`;
}
