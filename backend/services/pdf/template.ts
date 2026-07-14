import { getPdfStyles } from "./styles";
import { buildPartiesHtml } from "./parties";
import { buildBodyHtml } from "./body";
import { buildDisplaySender, buildSignatureHtml } from "./signature";

export interface PdfTemplateOptions {
  content: string;
  senderName: string;
  senderAddress: string;
  senderPhone: string;
  senderEmail: string;
  senderIdNumber?: string;
  companyName?: string;
  companyNumber?: string;
  signatoryRole?: string;
  respondentName: string;
  respondentAddress?: string;
  withSignature: boolean;
  attorneyVerified?: boolean;
  signatureDataUrl?: string;
  evidenceHtml?: string;
}

export function buildLetterHtml(opts: PdfTemplateOptions): string {
  const displaySender = buildDisplaySender({
    senderName: opts.senderName,
    companyName: opts.companyName,
    signatoryRole: opts.signatoryRole,
  });

  const parties = buildPartiesHtml(opts);
  const body = buildBodyHtml(opts.content);
  const signature = buildSignatureHtml({
    withSignature: opts.withSignature,
    signatureDataUrl: opts.signatureDataUrl,
    displaySender,
    senderPhone: opts.senderPhone,
    senderEmail: opts.senderEmail,
  });

  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="UTF-8" />
<style>
${getPdfStyles()}
</style>
</head>
<body>
<div class="page">

  ${parties}

  ${body}

  <div class="signature-area">
    ${signature}
  </div>

</div>
${opts.evidenceHtml ?? ""}
</body>
</html>`;
}
