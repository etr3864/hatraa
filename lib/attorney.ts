function env(name: string, fallback: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) return fallback;
  const trimmed = value.trim();
  if (trimmed.includes("להשלמה") || trimmed.startsWith("[")) return fallback;
  return trimmed;
}

export const ATTORNEY = {
  displayName: env("NEXT_PUBLIC_ATTORNEY_DISPLAY_NAME", "צבר שועלי"),
  officeName: env(
    "NEXT_PUBLIC_ATTORNEY_OFFICE_NAME",
    "שועלי משרד עורכי דין"
  ),
  letterheadName: env(
    "NEXT_PUBLIC_ATTORNEY_LETTERHEAD_NAME",
    "שועלי משרד עו״ד"
  ),
  licenseNumber: env("NEXT_PUBLIC_ATTORNEY_LICENSE", ""),
  signatureCaption: env(
    "NEXT_PUBLIC_ATTORNEY_SIGNATURE_CAPTION",
    "מאומת ומאושר"
  ),
  phone: env("NEXT_PUBLIC_ATTORNEY_PHONE", "0547951651"),
  email: env("NEXT_PUBLIC_ATTORNEY_EMAIL", "Office.shualylaw@gmail.com"),
  address: env("NEXT_PUBLIC_ATTORNEY_ADDRESS", "שאול המלך 39, תל אביב"),
} as const;

export function attorneySignatureName(): string {
  return `עורך דין ${ATTORNEY.displayName}`;
}

export function attorneyLetterheadName(): string {
  return ATTORNEY.letterheadName;
}

export function attorneyShortLabel(): string {
  if (ATTORNEY.officeName && !ATTORNEY.officeName.includes("להשלמה")) {
    return `${attorneySignatureName()}, ${ATTORNEY.officeName}`;
  }
  return attorneySignatureName();
}
