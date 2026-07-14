import type { LetterInput, KnowledgeFile } from "@/lib/types";
import { toneLabel, goalLabel, todayFormatted } from "@/lib/utils";
import { LETTER_DEADLINE_DAYS, SIGNATURE_PRICE } from "@/lib/constants";
import { formatKnowledgeForPrompt } from "./knowledge";
import { getExamples, formatExamplesForPrompt } from "./examples";
import { sanitizeInput, wrapUserInput } from "../security/sanitize";

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

export function buildUserPrompt(
  input: LetterInput,
  knowledge: KnowledgeFile,
  retryNote?: string
): string {
  const isCompany = input.senderType === "company";
  const knowledgeText = formatKnowledgeForPrompt(knowledge);
  const examplesText = formatExamplesForPrompt(getExamples(input.category));

  const senderIdLine = isCompany
    ? (input.companyNumber ? `ח.פ.: ${sanitizeInput(input.companyNumber)}` : "")
    : (input.senderIdNumber ? `ת.ז.: ${sanitizeInput(input.senderIdNumber)}` : "");

  const senderDisplayName = isCompany
    ? `${sanitizeInput(input.companyName ?? "")} (ע"י ${sanitizeInput(input.senderName)}${input.signatoryRole ? `, ${sanitizeInput(input.signatoryRole)}` : ""})`
    : sanitizeInput(input.senderName);

  const evidenceSection =
    input.evidence && input.evidence.length > 0
      ? `\n\nראיות שצורפו (${input.evidence.length} קבצים):\n${input.evidence
          .map(
            (e, i) =>
              `- ראיה ${i + 1}: ${sanitizeInput(e.name)}${e.description ? ` — ${sanitizeInput(e.description)}` : ""}`
          )
          .join("\n")}\n\nהשתמש בראיות אלו בגוף המכתב כנספחים (נספח א׳, נספח ב׳).`
      : "";

  const companySenderNote = isCompany
    ? `\n\nהערה: השולח הוא חברה בע"מ. המכתב בשם החברה, לשון "החברה", חותם מורשה.`
    : "";

  const caseDetails = wrapUserInput(input.description || input.rawInput);

  return `ידע משפטי (גרסה ${knowledge.version}) — מותר לצטט רק מכאן:
${knowledgeText}

דוגמאות לסגנון ומבנה:
${examplesText}

פרטי המקרה:
${caseDetails}

פרטי שולח:
- שם: ${senderDisplayName}
- כתובת: ${sanitizeInput(input.senderAddress)}
- טלפון: ${sanitizeInput(input.senderPhone)}
- מייל: ${sanitizeInput(input.senderEmail)}
${senderIdLine ? `- ${senderIdLine}` : ""}

פרטי נמען:
- שם: ${sanitizeInput(input.respondentName)}
${input.respondentAddress ? `- כתובת: ${sanitizeInput(input.respondentAddress)}` : ""}
- תאריך אירוע: ${sanitizeInput(input.eventDate || "כמפורט בתיאור")}
${input.amount ? `- סכום: ${sanitizeInput(input.amount)}` : ""}
- תאריך מכתב: ${todayFormatted()}
- מועד אחרון לתגובה: ${LETTER_DEADLINE_DAYS} ימים
- מחיר חתימת עו"ד (לאזכור באפסייל בלבד אם רלוונטי): ${SIGNATURE_PRICE} ש"ח

טון: ${toneLabel(input.tone)} — ${getToneInstruction(input.tone)}
מטרה: ${goalLabel(input.goal)} — ${getGoalInstruction(input.goal)}
${evidenceSection}${companySenderNote}
${retryNote ? `\nהנחיה מחמירה לתיקון:\n${retryNote}` : ""}

החזר JSON בלבד.`;
}
