import { escapeHtml } from "./escape";
import { ATTORNEY } from "@/lib/attorney";

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
  /** מכתב בשם עו״ד (אחרי תשלום) */
  attorneyVerified?: boolean;
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
    attorneyVerified,
  } = opts;

  if (attorneyVerified) {
    const officeLine =
      ATTORNEY.officeName && !ATTORNEY.officeName.includes("להשלמה")
        ? `<p>${escapeHtml(ATTORNEY.officeName)}</p>`
        : "";
    const licenseLine = ATTORNEY.licenseNumber
      ? `<p>רישיון: ${escapeHtml(ATTORNEY.licenseNumber)}</p>`
      : "";
    const phoneLine = ATTORNEY.phone
      ? `<p>${escapeHtml(ATTORNEY.phone)}</p>`
      : "";
    const emailLine = ATTORNEY.email
      ? `<p>${escapeHtml(ATTORNEY.email)}</p>`
      : "";
    const addressLine = ATTORNEY.address
      ? `<p>${escapeHtml(ATTORNEY.address)}</p>`
      : "";

    const clientLabel = companyName
      ? `${escapeHtml(companyName)}${signatoryRole ? ` (${escapeHtml(signatoryRole)}: ${escapeHtml(senderName)})` : ` (${escapeHtml(senderName)})`}`
      : escapeHtml(senderName);

    return `<div class="parties">
    <div class="party-block">
      <div class="party-label">מאת</div>
      <p>${escapeHtml(ATTORNEY.displayName)}</p>
      ${officeLine}
      ${licenseLine}
      ${addressLine}
      ${phoneLine}
      ${emailLine}
      <p class="party-meta">בשם: ${clientLabel}</p>
    </div>
    <div class="party-block">
      <div class="party-label">אל</div>
      <p>${escapeHtml(respondentName)}</p>
      ${respondentAddress ? `<p>${escapeHtml(respondentAddress)}</p>` : ""}
    </div>
  </div>`;
  }

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
