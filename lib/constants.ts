import type { Category, Tone, Goal } from "./types";

export const CATEGORIES: Record<Category, { label: string; description: string }> = {
  consumer: { label: "צרכנות", description: "חברות סלולר, ביטוח, מוצרים פגומים" },
  banking: { label: "בנקים", description: "עמלות, חיובים שגויים, חשבון בנק" },
  employment: { label: "דיני עבודה", description: "פיטורים, שכר, זכויות עובד" },
  rental: { label: "שכירות", description: "פיקדון, ליקויים, פינוי" },
  tort: { label: "נזיקין", description: "נזק לרכוש, גוף, רשלנות" },
};

export const TONES: Record<Tone, { label: string; description: string }> = {
  firm: { label: "נחרץ", description: "ישיר ותקיף, דורש פעולה מידית" },
  businesslike: { label: "עניני", description: "מקצועי וניטרלי, מציג עובדות" },
  conciliatory: { label: "מפויס", description: "רך יותר, מנסה להגיע לפתרון" },
  threatening: { label: "מאיים", description: "מזהיר מפורשות מפנייה לערכאות" },
};

export const GOALS: Record<Goal, { label: string; description: string }> = {
  compensation: { label: "פיצוי כספי", description: "רוצה שיחזירו כסף" },
  fix: { label: "תיקון / ביצוע", description: "רוצה שיתקנו או יספקו את מה שהובטח" },
  apology: { label: "התנצלות", description: "רוצה הכרה בעוול" },
  intimidate: { label: "הפחדה לפני תביעה", description: "רוצה ליצור לחץ" },
};

/** מחיר חתימת עו״ד בשקלים — מקור אמת יחיד */
export const SIGNATURE_PRICE = 250;

/** @deprecated השתמש ב-SIGNATURE_PRICE */
export const UPSELL_PRICE = SIGNATURE_PRICE;

export const LETTER_DEADLINE_DAYS = 14;

export const MAX_RECORDING_SECONDS = 480; // 8 דקות

export const LOADER_MIN_MS = 40000;
export const LOADER_MAX_MS = 55000;

export const RATE_LIMIT_PER_DAY = 10;

export const SITE_NAME = "התראה בקליק";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hatraa.co.il";

export const VALID_CATEGORIES: Category[] = [
  "consumer",
  "banking",
  "employment",
  "rental",
  "tort",
];
