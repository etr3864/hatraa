function env(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
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
  const name = ATTORNEY.displayName.includes("להשלמה")
    ? 'עו"ד'
    : ATTORNEY.displayName;

  if (ATTORNEY.officeName && !ATTORNEY.officeName.includes("להשלמה")) {
    return `${name}, ${ATTORNEY.officeName}`;
  }
  return name;
}
