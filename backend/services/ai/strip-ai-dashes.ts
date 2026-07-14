/** מקפים ארוכים (em/en dash) הם סימן בולט לטקסט שנוצר ע״י AI. אסור במכתבים. */
const AI_DASH_CHARS = /[\u2014\u2013\u2015]/g;

/** מחליף — / – / ― במקף רגיל. חובה על כל תוכן מכתב לפני שמירה או PDF. */
export function stripAiDashes(text: string): string {
  if (!text) return text;
  return text.replace(AI_DASH_CHARS, "-");
}
