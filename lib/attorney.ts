/**
 * מקור אמת יחיד לפרטי העו״ד בחבילת "מכתב מאומת".
 * לעדכון מהיר: שנה כאן, או הגדר env (עדיף בפרוד).
 *
 * NEXT_PUBLIC_* זמין גם ל־UI; שאר השדות לשרת/PDF.
 */
function env(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

export const ATTORNEY = {
  /** שם לתצוגה, למשל: עו״ד ישראל ישראלי */
  displayName: env("NEXT_PUBLIC_ATTORNEY_DISPLAY_NAME", 'עו"ד [שם להשלמה]'),

  /** שם המשרד (אופציונלי) */
  officeName: env("NEXT_PUBLIC_ATTORNEY_OFFICE_NAME", "[שם משרד להשלמה]"),

  /** מספר רישיון — להציג רק אחרי אישור משפטי */
  licenseNumber: env("NEXT_PUBLIC_ATTORNEY_LICENSE", ""),

  /** שורה משנית ב־PDF מתחת לשם העו״ד */
  signatureCaption: env(
    "NEXT_PUBLIC_ATTORNEY_SIGNATURE_CAPTION",
    "מאומת ומאושר"
  ),

  /** טלפון/מייל משרד (לייצוג בלוק "מאת" בעתיד) */
  phone: env("NEXT_PUBLIC_ATTORNEY_PHONE", ""),
  email: env("NEXT_PUBLIC_ATTORNEY_EMAIL", ""),
  address: env("NEXT_PUBLIC_ATTORNEY_ADDRESS", ""),
} as const;

/** תווית קצרה לאפסייל / UI — בלי placeholders גולמיים */
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
