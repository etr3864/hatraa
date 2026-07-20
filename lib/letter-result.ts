import type { LetterInput } from "@/lib/types";

export const LETTER_RESULT_KEY = "letterResult";

export interface StoredLetterResult {
  leadId: string;
  letterId: string;
  content: string;
  upsellMessage: string;
  fileName: string;
  letterInput: LetterInput;
  attorneyVerified?: boolean;
}

export function readStoredLetterResult(): StoredLetterResult | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LETTER_RESULT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredLetterResult;
    if (!parsed?.leadId || !parsed?.content || !parsed?.letterInput) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearStoredLetterResult(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LETTER_RESULT_KEY);
}

export function isPaidLetterResult(
  result: Pick<StoredLetterResult, "attorneyVerified"> | null
): boolean {
  return !!result?.attorneyVerified;
}
