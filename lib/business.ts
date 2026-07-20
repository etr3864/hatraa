function env(name: string, fallback: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) return fallback;
  const trimmed = value.trim();
  if (trimmed.includes("להשלמה") || trimmed.startsWith("[")) return fallback;
  return trimmed;
}

/** פרטי העוסק — override ב-env אם צריך (placeholders ישנים מתעלמים) */
export const BUSINESS = {
  brandName: env("NEXT_PUBLIC_BRAND_NAME", "התראה בקליק"),
  legalName: env("NEXT_PUBLIC_BUSINESS_LEGAL_NAME", "משה שועלי"),
  registrationType: env(
    "NEXT_PUBLIC_BUSINESS_REGISTRATION_TYPE",
    "עוסק מורשה"
  ),
  registrationNumber: env(
    "NEXT_PUBLIC_BUSINESS_REGISTRATION_NUMBER",
    "203439732"
  ),
  address: env(
    "NEXT_PUBLIC_BUSINESS_ADDRESS",
    "שאול המלך 39, תל אביב"
  ),
  phone: env("NEXT_PUBLIC_BUSINESS_PHONE", "0547951651"),
  email: env("NEXT_PUBLIC_BUSINESS_EMAIL", "Office.shualylaw@gmail.com"),
  privacyEmail: env(
    "NEXT_PUBLIC_PRIVACY_EMAIL",
    "Office.shualylaw@gmail.com"
  ),
  accessibilityCoordinatorName: env(
    "NEXT_PUBLIC_ACCESSIBILITY_COORDINATOR_NAME",
    "משה שועלי"
  ),
  accessibilityEmail: env(
    "NEXT_PUBLIC_ACCESSIBILITY_EMAIL",
    "Office.shualylaw@gmail.com"
  ),
  accessibilityPhone: env(
    "NEXT_PUBLIC_ACCESSIBILITY_PHONE",
    "0547951651"
  ),
  lastUpdatedLabel: env("NEXT_PUBLIC_LEGAL_LAST_UPDATED", "יולי 2026"),
} as const;

export function isBusinessPlaceholder(value: string): boolean {
  return value.includes("להשלמה") || value.startsWith("[");
}
