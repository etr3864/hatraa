import { escapeHtml } from "./escape";
import { ATTORNEY, attorneyLetterheadName } from "@/lib/attorney";

export function buildLetterheadHtml(): string {
  const contacts = [
    ATTORNEY.address,
    ATTORNEY.phone,
    ATTORNEY.email,
  ].filter((v) => v && !v.includes("להשלמה"));

  const contactHtml = contacts
    .map((c) => `<span class="lh-contact">${escapeHtml(c)}</span>`)
    .join('<span class="lh-sep">·</span>');

  return `<header class="letterhead">
  <div class="lh-contacts">${contactHtml}</div>
  <div class="lh-brand">
    <p class="lh-name">${escapeHtml(attorneyLetterheadName())}</p>
    <div class="lh-rule"></div>
    <p class="lh-office">משרד עורכי דין</p>
  </div>
</header>`;
}
