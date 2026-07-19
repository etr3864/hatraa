
function env(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

export const ATTORNEY = {

  displayName: env("NEXT_PUBLIC_ATTORNEY_DISPLAY_NAME", 'עו"ד [שם להשלמה]'),


  officeName: env("NEXT_PUBLIC_ATTORNEY_OFFICE_NAME", "[שם משרד להשלמה]"),


  licenseNumber: env("NEXT_PUBLIC_ATTORNEY_LICENSE", ""),


  signatureCaption: env(
    "NEXT_PUBLIC_ATTORNEY_SIGNATURE_CAPTION",
    "מאומת ומאושר"
  ),


  phone: env("NEXT_PUBLIC_ATTORNEY_PHONE", ""),
  email: env("NEXT_PUBLIC_ATTORNEY_EMAIL", ""),
  address: env("NEXT_PUBLIC_ATTORNEY_ADDRESS", ""),
} as const;


export function attorneyShortLabel(): string {
  const name = ATTORNEY.displayName.includes("להשלמה")
    ? 'עו"ד'
    : ATTORNEY.displayName;

  if (
    ATTORNEY.officeName &&
    !ATTORNEY.officeName.includes("להשלמה")
  ) {
    return `${name}, ${ATTORNEY.officeName}`;
  }
  return name;
}
