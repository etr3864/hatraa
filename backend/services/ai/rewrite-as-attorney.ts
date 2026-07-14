import Anthropic from "@anthropic-ai/sdk";
import type { LetterInput } from "@/lib/types";
import { ATTORNEY } from "@/lib/attorney";
import { getKnowledge } from "./knowledge";
import { verifyLetter } from "./verify";
import { stripAiDashes } from "./strip-ai-dashes";
import { sanitizeInput } from "../security/sanitize";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    client = new Anthropic({ apiKey });
  }
  return client;
}

const REWRITE_SYSTEM = `אתה עורך דין ישראלי. המשימה היחידה: לשכתב מכתב התראה קיים ללשון ייצוג משפטי.

## חובה
- שמור עובדות, תאריכים, סכומים, שמות, כתובות ודרישות במדויק
- שמור ציטוטי חוק וסעיפים כמו שהם במכתב המקורי. אסור להוסיף, למחוק או לשנות סעיף/חוק/פסק דין
- שנה רק את הקול: מגוף ראשון של הלקוח ללשון עו"ד הכותב בשם הלקוח
- פתיח בסגנון: הנני פונה אליך בשם [שם הלקוח]...
- החתימה בסוף המכתב היא בשם העו"ד/המשרד שסופקו, עם אזכור שהפנייה היא בשם הלקוח
- אסור להשתמש במקף ארוך (em/en dash). רק מקף רגיל (-), פסיק או נקודתיים
- אל תמציא פרטים שלא קיימים במכתב או בפרטי העו"ד שסופקו
- אל תוסיף הצהרות על ייעוץ שלא במכתב המקורי

## פלט
החזר JSON בלבד (ללא markdown):
{"content":"המכתב המלא בלשון ייצוג"}`;

function buildClientLabel(input: LetterInput): string {
  if (input.senderType === "company") {
    const company = sanitizeInput(input.companyName ?? input.senderName);
    const role = input.signatoryRole ? `, באמצעות ${sanitizeInput(input.signatoryRole)} ` : " ";
    return `החברה ${company}${role}(${sanitizeInput(input.senderName)})`;
  }
  return sanitizeInput(input.senderName);
}

function buildAttorneyBlock(): string {
  const lines = [
    `שם: ${ATTORNEY.displayName}`,
    ATTORNEY.officeName && !ATTORNEY.officeName.includes("להשלמה")
      ? `משרד: ${ATTORNEY.officeName}`
      : null,
    ATTORNEY.licenseNumber ? `רישיון: ${ATTORNEY.licenseNumber}` : null,
    ATTORNEY.phone ? `טלפון: ${ATTORNEY.phone}` : null,
    ATTORNEY.email ? `מייל: ${ATTORNEY.email}` : null,
    ATTORNEY.address ? `כתובת: ${ATTORNEY.address}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

function parseRewriteJson(raw: string): string {
  const cleaned = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("שגיאה בניסוח מחדש של המכתב");
    parsed = JSON.parse(match[0]);
  }
  const content = typeof parsed.content === "string" ? parsed.content.trim() : "";
  if (!content) throw new Error("שגיאה בניסוח מחדש של המכתב");
  return content;
}

/** משכתב מכתב קיים ללשון עו״ד בשם הלקוח. לא נוגע בידע/דוגמאות של generate. */
export async function rewriteAsAttorney(
  content: string,
  input: LetterInput
): Promise<{ content: string; verified: boolean }> {
  const clientLabel = buildClientLabel(input);
  const knowledge = getKnowledge(input.category);
  const anthropic = getClient();

  const userPrompt = `פרטי העו"ד (השולח היחיד במכתב המשוכתב):
${buildAttorneyBlock()}

הלקוח המיוצג: ${clientLabel}
נמען: ${sanitizeInput(input.respondentName)}

המכתב המקורי (לשכתב ללשון ייצוג בלבד):
<<<LETTER>>>
${content}
<<<END>>>`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
    system: REWRITE_SYSTEM,
    messages: [{ role: "user", content: userPrompt }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  let rewritten = stripAiDashes(parseRewriteJson(raw));

  let verification = verifyLetter(rewritten, knowledge);
  if (!verification.verified) {
    // ניסיון תיקון אחד: שמירת ציטוטים מהמקור עדיפה על strip שמוחק בסיס משפטי
    const retry = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: REWRITE_SYSTEM,
      messages: [
        {
          role: "user",
          content: `${userPrompt}

תיקון חובה: הסעיפים/החוקים הבאים אינם תקינים ביחס לידע: ${verification.invalidCitations.join(" | ")}.
החזר לשכתוב תוך שימוש רק בציטוטים שמופיעים במכתב המקורי במדויק. אסור ציטוטים חדשים.`,
        },
      ],
    });
    const retryRaw =
      retry.content[0].type === "text" ? retry.content[0].text : "";
    rewritten = stripAiDashes(parseRewriteJson(retryRaw));
    verification = verifyLetter(rewritten, knowledge);
  }

  return {
    content: rewritten,
    verified: verification.verified,
  };
}
