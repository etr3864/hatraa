function env(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

/** פרטי העוסק — מעדכנים ב-env בלי לגעת בקוד */
export const BUSINESS = {
  brandName: env("NEXT_PUBLIC_BRAND_NAME", "התראה בקליק"),
  legalName: env(
    "NEXT_PUBLIC_BUSINESS_LEGAL_NAME",
    "[שם העסק / החברה להשלמה]"
  ),
  registrationType: env(
    "NEXT_PUBLIC_BUSINESS_REGISTRATION_TYPE",
    "עוסק מורשה / חברה בע״מ"
  ),
  registrationNumber: env(
    "NEXT_PUBLIC_BUSINESS_REGISTRATION_NUMBER",
    "[מספר עוסק / ח.פ. להשלמה]"
  ),
  address: env(
    "NEXT_PUBLIC_BUSINESS_ADDRESS",
    "[כתובת העסק להשלמה]"
  ),
  phone: env("NEXT_PUBLIC_BUSINESS_PHONE", "[טלפון להשלמה]"),
  email: env(
    "NEXT_PUBLIC_BUSINESS_EMAIL",
    "[דוא״ל ליצירת קשר להשלמה]"
  ),
  privacyEmail: env(
    "NEXT_PUBLIC_PRIVACY_EMAIL",
    "[דוא״ל פרטיות להשלמה]"
  ),
  accessibilityCoordinatorName: env(
    "NEXT_PUBLIC_ACCESSIBILITY_COORDINATOR_NAME",
    "[שם רכז/ת נגישות להשלמה]"
  ),
  accessibilityEmail: env(
    "NEXT_PUBLIC_ACCESSIBILITY_EMAIL",
    "[דוא״ל נגישות להשלמה]"
  ),
  accessibilityPhone: env(
    "NEXT_PUBLIC_ACCESSIBILITY_PHONE",
    "[טלפון נגישות להשלמה]"
  ),
  lastUpdatedLabel: env(
    "NEXT_PUBLIC_LEGAL_LAST_UPDATED",
    "יולי 2026"
  ),
} as const;

export function isBusinessPlaceholder(value: string): boolean {
  return value.includes("להשלמה") || value.startsWith("[");
}
