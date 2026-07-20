function env(name: string, fallback: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) return fallback;
  const trimmed = value.trim();
  // Ignore stale Vercel placeholders that would override real defaults
  if (trimmed.includes("להשלמה") || trimmed.startsWith("[")) return fallback;
  return trimmed;
}

export const ATTORNEY = {
  displayName: env("NEXT_PUBLIC_ATTORNEY_DISPLAY_NAME", 'עו"ד משה שועלי'),
  officeName: env("NEXT_PUBLIC_ATTORNEY_OFFICE_NAME", "משרד עו״ד צבר"),
  licenseNumber: env("NEXT_PUBLIC_ATTORNEY_LICENSE", ""),
  signatureCaption: env(
    "NEXT_PUBLIC_ATTORNEY_SIGNATURE_CAPTION",
    "מאומת ומאושר"
  ),
  phone: env("NEXT_PUBLIC_ATTORNEY_PHONE", "0547951651"),
  email: env("NEXT_PUBLIC_ATTORNEY_EMAIL", "Office.shualylaw@gmail.com"),
  address: env(
    "NEXT_PUBLIC_ATTORNEY_ADDRESS",
    "שאול המלך 39, תל אביב"
  ),
} as const;

export function attorneyShortLabel(): string {
  if (
    ATTORNEY.officeName &&
    !ATTORNEY.officeName.includes("להשלמה")
  ) {
    return `${ATTORNEY.displayName}, ${ATTORNEY.officeName}`;
  }
  return ATTORNEY.displayName;
}
