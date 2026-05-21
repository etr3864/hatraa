import Anthropic from "@anthropic-ai/sdk";
import { getTemplate } from "../templates/index";
import type { LetterInput, LetterOutput } from "@/lib/types";
import { toneLabel, goalLabel, todayFormatted } from "@/lib/utils";
import { LETTER_DEADLINE_DAYS, UPSELL_PRICE } from "@/lib/constants";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    client = new Anthropic({ apiKey });
  }
  return client;
}

function buildPrompt(input: LetterInput): string {
  const template = getTemplate(input.category);
  const isCompany = input.senderType === "company";

  const senderIdLine = isCompany
    ? (input.companyNumber ? `ח.פ.: ${input.companyNumber}` : "")
    : (input.senderIdNumber ? `ת.ז.: ${input.senderIdNumber}` : "");

  const senderDisplayName = isCompany
    ? `${input.companyName} (ע"י ${input.senderName}${input.signatoryRole ? `, ${input.signatoryRole}` : ""})`
    : input.senderName;

  const respondentAddressLine = input.respondentAddress
    ? `\n${input.respondentAddress}`
    : "";
  const amountLine = input.amount
    ? `\nהסכום השנוי במחלוקת: ${input.amount}.`
    : "";

  const evidenceSection = input.evidence && input.evidence.length > 0
    ? `\n\nראיות שצורפו (${input.evidence.length} קבצים):
${input.evidence.map((e, i) => `- ראיה ${i + 1}: ${e.name}${e.description ? ` — ${e.description}` : ""}`).join("\n")}
\nהשתמש בראיות אלו בגוף המכתב. ציין אותן כנספחים (נספח א׳, נספח ב׳, וכו׳) והתייחס אליהן כעובדות המוכיחות את הטענה.`
    : "";

  const companySenderNote = isCompany
    ? `\n\nהערה חשובה: השולח הוא חברה בע"מ. המכתב צריך להיכתב בשם החברה (${input.companyName}), עם ציון ח.פ. ${input.companyNumber || ""}. החותם הוא ${input.senderName}${input.signatoryRole ? ` בתפקיד ${input.signatoryRole}` : ""} כמורשה חתימה מטעם החברה. השתמש בלשון "החברה" ולא "אני" בגוף המכתב.`
    : "";

  return `אתה עורך דין ישראלי שמנסח מכתב התראה.
  
כללים קריטיים שאסור לחרוג מהם:
1. עבוד אך ורק בתוך המבנה של התבנית שסופקה — אל תשנה מבנה, אל תוסיף סעיפים.
2. אל תמציא סעיפי חוק — השתמש רק בסעיפים שמופיעים בתבנית.
3. אל תציין פסיקה (פסקי דין) — רק חקיקה ראשית.
4. הסכום שהמשתמש ציין הוא הסכום הנדרש — אל תחשב אחרת.
5. המועד האחרון לתגובה: ${LETTER_DEADLINE_DAYS} ימים.
6. טון: ${toneLabel(input.tone)} — ${getToneInstruction(input.tone)}.
7. מטרה: ${goalLabel(input.goal)} — ${getGoalInstruction(input.goal)}.
8. אל תציין שם עו"ד, מספר רישיון, או משרד.
9. כתוב בעברית תקנית ומקצועית.
10. חשוב מאוד: אל תשתמש במקף ארוך (—) או מקף קצר (-) בגוף המכתב. השתמש בפסיקים, נקודות, או ניסוח חלופי. הימנע מסימן המקף לחלוטין.
11. אם צורפו ראיות — התייחס אליהן בגוף המכתב כנספחים שמחזקים את הטענה.${companySenderNote}

פרטי המקרה:
- ${isCompany ? "שם החברה" : "שם הפונה"}: ${senderDisplayName}
- ${isCompany ? "כתובת רשומה" : "כתובת הפונה"}: ${input.senderAddress}
- טלפון: ${input.senderPhone}
- מייל: ${input.senderEmail}
${senderIdLine ? `- ${senderIdLine}` : ""}
- שם הנמען: ${input.respondentName}${respondentAddressLine ? `\n- כתובת נמען: ${input.respondentAddress}` : ""}
- תאריך אירוע: ${input.eventDate || "כמפורט להלן"}
- תיאור: ${input.description}
${input.amount ? `- סכום: ${input.amount}` : ""}
- תאריך מכתב: ${todayFormatted()}${evidenceSection}

תבנית המכתב (מלא את כל ה-placeholders):
${template}

placeholders להחלפה:
- {{senderName}} → ${senderDisplayName}
- {{senderAddress}} → ${input.senderAddress}
- {{senderPhone}} → ${input.senderPhone}
- {{senderEmail}} → ${input.senderEmail}
- {{senderIdLine}} → ${senderIdLine}
- {{respondentName}} → ${input.respondentName}
- {{respondentAddressLine}} → ${respondentAddressLine}
- {{eventDate}} → ${input.eventDate || "תקופה כמפורט"}
- {{amountLine}} → ${amountLine}
- {{subject}} → [נסח כותרת קצרה לנדון]
- {{description}} → [נסח את תיאור האירוע בצורה משפטית תמציתית, 3-4 משפטים]
- {{demand}} → [נסח את הדרישה בהתאם למטרה: ${goalLabel(input.goal)}]
- {{damageTypes}} → [רק אם קטגוריה = tort: רשום סוגי הנזק]

החזר את התשובה בפורמט הבא בדיוק (שים לב ל-delimiters):

===LETTER_START===
[המכתב המלא כאן, כולל כל הפסקאות]
===LETTER_END===

===UPSELL_START===
[הודעת אפסייל אישית של 2-3 משפטים שמזכירה את ${input.respondentName}${input.amount ? ` ואת הסכום ${input.amount}` : ""} ומסבירה למה ספציפית חתימת עו"ד תעזור במקרה זה. הודעה אישית ואמיתית, לא גנרית.]
===UPSELL_END===

===FILENAME===
מכתב_התראה_${sanitizeForFileName(input.respondentName)}_${getCurrentMonthHebrew()}
===FILENAME_END===`;
}

function getToneInstruction(tone: string): string {
  const map: Record<string, string> = {
    firm: "שפה תקיפה, ישירה, דורשת פעולה מידית, ללא פשרות",
    businesslike: "שפה מקצועית וניטרלית, מציגה עובדות ללא רגש",
    conciliatory: "שפה מכובדת שפתוחה לדיאלוג ופתרון, אך ברורה לגבי הדרישה",
    threatening: "שפה שמדגישה את ההשלכות המשפטיות הצפויות במידה ולא יפעלו",
  };
  return map[tone] ?? "";
}

function getGoalInstruction(goal: string): string {
  const map: Record<string, string> = {
    compensation: "דרוש החזר כספי מלא / פיצוי כספי",
    fix: "דרוש תיקון הליקוי / אספקת השירות / ביצוע ההתחייבות",
    apology: "דרוש הכרה בעוול, התנצלות בכתב, ותיקון הרשומות",
    intimidate: "הדגש את החשיפה המשפטית ואת הסיכון לתביעה, צור לחץ לפעולה",
  };
  return map[goal] ?? "";
}

function sanitizeForFileName(name: string): string {
  return name.replace(/\s+/g, "_").replace(/[^\w\u0590-\u05ff_]/g, "").slice(0, 20);
}

function getCurrentMonthHebrew(): string {
  const months = [
    "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
    "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
  ];
  const now = new Date();
  return `${months[now.getMonth()]}_${now.getFullYear()}`;
}

export async function generateLetter(input: LetterInput): Promise<LetterOutput> {
  const anthropic = getClient();
  const prompt = buildPrompt(input);

  const contentBlocks: Anthropic.Messages.ContentBlockParam[] = [];

  if (input.evidence && input.evidence.length > 0) {
    for (const file of input.evidence) {
      if (file.type.startsWith("image/")) {
        const mediaType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
        contentBlocks.push({
          type: "image",
          source: { type: "base64", media_type: mediaType, data: file.base64 },
        });
        if (file.description) {
          contentBlocks.push({ type: "text", text: `תיאור ראיה מהמשתמש: ${file.description}` });
        }
      } else if (file.type === "application/pdf") {
        contentBlocks.push({
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: file.base64 },
        });
        if (file.description) {
          contentBlocks.push({ type: "text", text: `תיאור מסמך PDF מהמשתמש: ${file.description}` });
        }
      }
    }
  }

  contentBlocks.push({ type: "text", text: prompt });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
    messages: [{ role: "user", content: contentBlocks }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";

  const letterMatch = raw.match(/===LETTER_START===([\s\S]*?)===LETTER_END===/);
  const upsellMatch = raw.match(/===UPSELL_START===([\s\S]*?)===UPSELL_END===/);
  const fileMatch = raw.match(/===FILENAME===([\s\S]*?)===FILENAME_END===/);

  if (!letterMatch) {
    throw new Error("שגיאה בייצור המכתב. אנא נסה שוב.");
  }

  const content = letterMatch[1].trim();
  const upsellMessage = upsellMatch ? upsellMatch[1].trim() : "";
  const fileName = fileMatch
    ? fileMatch[1].trim()
    : `מכתב_התראה_${sanitizeForFileName(input.respondentName)}`;

  return { content, upsellMessage, fileName };
}
