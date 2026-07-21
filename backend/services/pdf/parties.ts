import { escapeHtml } from "./escape";
import { getHebrewDateLabel } from "./hebrew-date";

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
  attorneyVerified?: boolean;
}

function formatDate(): string {
  const d = new Date();
  return `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

function clientLabel(opts: PartiesOptions): string {
  if (opts.companyName) {
    return opts.signatoryRole
      ? `${escapeHtml(opts.companyName)} (${escapeHtml(opts.signatoryRole)}: ${escapeHtml(opts.senderName)})`
      : `${escapeHtml(opts.companyName)} (${escapeHtml(opts.senderName)})`;
  }
  return escapeHtml(opts.senderName);
}

export function buildPartiesHtml(opts: PartiesOptions): string {
  const onBehalf =
    opts.attorneyVerified
      ? `<p class="meta-behalf">בשם: ${clientLabel(opts)}</p>`
      : "";

  return `<div class="letter-meta">
  <div class="meta-addressee">
    <p class="meta-label">לכבוד</p>
    <p class="meta-name">${escapeHtml(opts.respondentName)}</p>
    ${opts.respondentAddress ? `<p class="meta-addr">${escapeHtml(opts.respondentAddress)}</p>` : ""}
    ${onBehalf}
  </div>
  <div class="meta-date">
    <span>${formatDate()}</span>
    <span class="meta-date-hebrew">${escapeHtml(getHebrewDateLabel())}</span>
  </div>
</div>
<p class="without-prejudice">-מבלי לפגוע בזכויות-</p>`;
}
