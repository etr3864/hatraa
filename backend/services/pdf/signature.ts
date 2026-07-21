import { escapeHtml } from "./escape";
import { ATTORNEY, attorneySignatureName } from "@/lib/attorney";
import { loadSignatureScribbleDataUrl } from "./load-scribble";

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
  const signed = opts.withSignature || opts.attorneyVerified;

  if (signed) {
    const scribble = loadSignatureScribbleDataUrl();
    const scribbleImg = scribble
      ? `<img src="${scribble}" alt="" class="sig-scribble" />`
      : "";
    const handImg =
      opts.signatureDataUrl
        ? `<img src="${opts.signatureDataUrl}" alt="" class="sig-hand" />`
        : "";

    return `<div class="signature-block signature-block--attorney">
  <p class="sig-closing">בכבוד רב,</p>
  <div class="sig-stack">
    ${scribbleImg}
    ${handImg}
    <div class="sig-text">
      <p class="sig-office">${escapeHtml(ATTORNEY.officeName)}</p>
      <p class="sig-name">${escapeHtml(attorneySignatureName())}</p>
    </div>
  </div>
</div>`;
  }

  return `<div class="signature-block signature-block--sender">
  <p class="sig-closing">בכבוד רב,</p>
  <p class="sig-name">${opts.displaySender}</p>
  <p class="sig-meta">${escapeHtml(opts.senderPhone)} | ${escapeHtml(opts.senderEmail)}</p>
</div>`;
}
