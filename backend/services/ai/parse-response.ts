export function sanitizeForFileName(name: string): string {
  return name.replace(/\s+/g, "_").replace(/[^\w\u0590-\u05ff_]/g, "").slice(0, 20);
}

export function getCurrentMonthHebrew(): string {
  const months = [
    "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
    "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
  ];
  const now = new Date();
  return `${months[now.getMonth()]}_${now.getFullYear()}`;
}

export function parseModelJson(raw: string): {
  content: string;
  upsellMessage: string;
  fileName: string;
} {
  const cleaned = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("שגיאה בייצור המכתב. אנא נסה שוב.");
    parsed = JSON.parse(match[0]);
  }

  const content = typeof parsed.content === "string" ? parsed.content.trim() : "";
  if (!content) throw new Error("שגיאה בייצור המכתב. אנא נסה שוב.");

  return {
    content,
    upsellMessage: typeof parsed.upsellMessage === "string" ? parsed.upsellMessage.trim() : "",
    fileName:
      typeof parsed.fileName === "string" && parsed.fileName.trim()
        ? parsed.fileName.trim()
        : `מכתב_התראה_${sanitizeForFileName(String(parsed.respondentName ?? "נמען"))}_${getCurrentMonthHebrew()}`,
  };
}
