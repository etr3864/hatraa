
const AI_DASH_CHARS = /[\u2014\u2013\u2015]/g;


export function stripAiDashes(text: string): string {
  if (!text) return text;
  return text.replace(AI_DASH_CHARS, "-");
}
