import type { LetterInput, KnowledgeFile } from "@/lib/types";
import { toneLabel, goalLabel, todayFormatted } from "@/lib/utils";
import { LETTER_DEADLINE_DAYS, SIGNATURE_PRICE } from "@/lib/constants";
import { formatKnowledgeForPrompt } from "./knowledge";
import { getExamples, formatExamplesForPrompt } from "./examples";
import { sanitizeInput, wrapUserInput } from "../security/sanitize";
import { stripAiDashes } from "./strip-ai-dashes";
import { evidenceLabel } from "@/lib/evidence-labels";

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

function buildEvidenceSection(input: LetterInput): string {
  const files = input.evidence;
  if (!files?.length) {
    return "\n\nאין ראיות מצורפות. אל תאזכר נספחים או מצורפים שאינם קיימים.";
  }

  const lines = files.map((e, i) => {
    const label = evidenceLabel(i);
    const desc = e.description ? `: ${sanitizeInput(e.description)}` : "";
    return `- ${label}: ${sanitizeInput(e.name)}${desc}`;
  });

  return `\n\nראיות מצורפות לקובץ ההורדה (השתמש רק בתוויות האלה):\n${lines.join("\n")}\nאסור להמציא נספחים נוספים.`;
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

  const evidenceSection = buildEvidenceSection(input);

  const companySenderNote = isCompany
    ? `\n\nהערה: השולח הוא חברה בע"מ. המכתב בשם החברה, לשון "החברה", חותם מורשה.`
    : "";

  const caseDetails = wrapUserInput(input.description || input.rawInput);

  return `ידע משפטי (גרסה ${knowledge.version}). מותר לצטט רק מכאן:
${stripAiDashes(knowledgeText)}

דוגמאות לסגנון ומבנה:
${stripAiDashes(examplesText)}

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

טון: ${toneLabel(input.tone)}: ${getToneInstruction(input.tone)}
מטרה: ${goalLabel(input.goal)}: ${getGoalInstruction(input.goal)}
${evidenceSection}${companySenderNote}
${retryNote ? `\nהנחיה מחמירה לתיקון:\n${retryNote}` : ""}

חתימה (חובה): "בכבוד רב," ואז שורה עם ${senderDisplayName} | ${sanitizeInput(input.senderPhone)} | ${sanitizeInput(input.senderEmail)}.
אסור לחתום כעו"ד, אסור [שם להשלמה] או כל placeholder אחר.

החזר JSON בלבד.`;
}
