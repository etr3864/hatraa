const HEBREW_SUFFIXES = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ז׳", "ח׳"];

export function evidenceLabel(index: number): string {
  const suffix = HEBREW_SUFFIXES[index] ?? String(index + 1);
  return `נספח ${suffix}`;
}
