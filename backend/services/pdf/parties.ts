import { escapeHtml } from "./escape";

interface PartiesOptions {
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
}

export function buildPartiesHtml(opts: PartiesOptions): string {
  const {
    senderName,
    senderAddress,
    senderPhone,
    senderEmail,
    senderIdNumber,
    companyName,
    companyNumber,
    signatoryRole,
    respondentName,
    respondentAddress,
  } = opts;

  const displaySender = companyName
    ? `${escapeHtml(companyName)}${signatoryRole ? ` - ${escapeHtml(signatoryRole)}: ${escapeHtml(senderName)}` : ` - ${escapeHtml(senderName)}`}`
    : escapeHtml(senderName);

  const idLine = companyNumber
    ? `<p>ח.פ.: ${escapeHtml(companyNumber)}</p>`
    : senderIdNumber
      ? `<p>ת.ז.: ${escapeHtml(senderIdNumber)}</p>`
      : "";

  return `<div class="parties">
    <div class="party-block">
      <div class="party-label">מאת</div>
      <p>${displaySender}</p>
      ${idLine}
      <p>${escapeHtml(senderAddress)}</p>
      <p>${escapeHtml(senderPhone)}</p>
      <p>${escapeHtml(senderEmail)}</p>
    </div>
    <div class="party-block">
      <div class="party-label">אל</div>
      <p>${escapeHtml(respondentName)}</p>
      ${respondentAddress ? `<p>${escapeHtml(respondentAddress)}</p>` : ""}
    </div>
  </div>`;
}
