import { GoogleGenAI } from "@google/genai";
import {
  AiCallStatus,
  AiOperation,
} from "@prisma/client";
import type { LetterInput } from "@/lib/types";
import { recordGoogleUsage } from "@/backend/services/ai-usage/google-usage";
import { ATTORNEY } from "@/lib/attorney";
import { getKnowledge } from "./knowledge";
import { parseLooseJson } from "./parse-json";
import { verifyLetter } from "./verify";
import { stripAiDashes } from "./strip-ai-dashes";
import { sanitizeLetterContent } from "./sanitize-letter-content";
import { mapEvidenceFormatError } from "@/lib/evidence-mime";
import { logExternalError } from "@/backend/services/logging/external-error";
import { sanitizeInput } from "../security/sanitize";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_AI_API_KEY is not set");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

const REWRITE_SYSTEM = `אתה עורך דין ישראלי מנוסה המתמחה בכתיבה משפטית פורמלית. המשימה היחידה: לשכתב מכתב התראה קיים ללשון ייצוג משפטי מקצועי.

## עקרונות שכתוב
- הפלט חייב להיות אותו מכתב בדיוק מבחינת תוכן, עובדות, דרישות וציטוטי חוק
- השינוי היחיד הוא הקול: מגוף ראשון של הלקוח ללשון עו"ד הכותב בשם מרשו
- אסור להוסיף טענות, עובדות, סעיפי חוק או דרישות שלא קיימים במכתב המקורי
- אסור למחוק או לשנות ציטוטי חוק, סעיפים, תאריכים, סכומים או שמות

## סגנון מקצועי
- לשון פורמלית-משפטית ישראלית: "הריני לפנות אליך", "מרשי", "הנדון", "בכבוד רב"
- פתיח: "הנני פונה אליך בשם מרשי, [שם הלקוח]..."
- משפטים ברורים, ישירים, ללא סיבוך מיותר
- שימוש נכון במונחים משפטיים: "לאלתר", "שומר על זכויותיו", "ללא צורך בהתראה נוספת"
- חתימה בשם העו"ד/המשרד שסופקו בלבד
- אסור להשתמש במקף ארוך (em/en dash) - רק מקף רגיל (-), פסיק או נקודתיים
- אסור להוסיף הצהרות על ייעוץ, המלצות או התנצלויות שלא במכתב המקורי

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
  try {
    const parsed = parseLooseJson(raw, "שגיאה בניסוח מחדש של המכתב");
    const content = typeof parsed.content === "string" ? parsed.content.trim() : "";
    if (!content) throw new Error("שגיאה בניסוח מחדש של המכתב");
    return content;
  } catch (err) {
    logExternalError("rewrite:parse", err, {
      rawPreview: raw.slice(0, 500),
      rawLength: raw.length,
    });
    throw err;
  }
}

export async function rewriteAsAttorney(
  content: string,
  input: LetterInput,
  context: {
    sessionId?: string | null;
    leadId: string;
    workflowId?: string;
  }
): Promise<{ content: string; verified: boolean }> {
  const clientLabel = buildClientLabel(input);
  const knowledge = getKnowledge(input.category);
  const ai = getClient();

  const userPrompt = `פרטי העו"ד (השולח היחיד במכתב המשוכתב):
${buildAttorneyBlock()}

הלקוח המיוצג: ${clientLabel}
נמען: ${sanitizeInput(input.respondentName)}

המכתב המקורי (לשכתב ללשון ייצוג בלבד):
<<<LETTER>>>
${content}
<<<END>>>`;

  const raw = await callRewriteModel(
    ai,
    userPrompt,
    AiOperation.ATTORNEY_REWRITE,
    context
  );
  let rewritten = stripAiDashes(parseRewriteJson(raw));

  let verification = verifyLetter(rewritten, knowledge);
  if (!verification.verified) {
    const retryPrompt = `${userPrompt}

תיקון חובה: הסעיפים/החוקים הבאים אינם תקינים ביחס לידע: ${verification.invalidCitations.join(" | ")}.
החזר לשכתוב תוך שימוש רק בציטוטים שמופיעים במכתב המקורי במדויק. אסור ציטוטים חדשים.`;

    const retryRaw = await callRewriteModel(
      ai,
      retryPrompt,
      AiOperation.ATTORNEY_REWRITE_RETRY,
      context
    );
    rewritten = stripAiDashes(parseRewriteJson(retryRaw));
    verification = verifyLetter(rewritten, knowledge);
  }

  return {
    content: sanitizeLetterContent(rewritten, {
      senderName: input.senderName,
      senderPhone: input.senderPhone,
      senderEmail: input.senderEmail,
      attorneyVerified: true,
    }),
    verified: verification.verified,
  };
}

async function callRewriteModel(
  ai: GoogleGenAI,
  prompt: string,
  operation: AiOperation,
  context: {
    sessionId?: string | null;
    leadId: string;
    workflowId?: string;
  }
): Promise<string> {
  const startedAt = Date.now();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { systemInstruction: REWRITE_SYSTEM },
    });
    await recordGoogleUsage(
      response,
      operation,
      AiCallStatus.SUCCEEDED,
      Date.now() - startedAt,
      context
    );
    return response.text ?? "";
  } catch (error) {
    await recordGoogleUsage(
      undefined,
      operation,
      AiCallStatus.FAILED,
      Date.now() - startedAt,
      context,
      error
    );
    logExternalError("rewrite:gemini", error, {
      operation,
      leadId: context.leadId,
    });
    throw new Error(mapEvidenceFormatError(error));
  }
}
