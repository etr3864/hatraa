import { GoogleGenAI } from "@google/genai";
import type { ExtractedData, Category, EvidenceFile } from "@/lib/types";

const VALID_CATEGORIES: Category[] = ["consumer", "employment", "rental", "tort"];

const EXTRACT_PROMPT = `אתה מנתח טקסט משפטי בעברית.
משימתך: חלץ מהטקסט הבא את הפרטים לטופס JSON בדיוק.

כללים:
- ההקלטה/טקסט עשויים להיות רגשיים ומבולבלים — התעלם מקללות, חזרות ורגשות. חלץ עובדות בלבד.
- אם לא ניתן לחלץ שדה מסוים — הכנס null.
- קטגוריה חייבת להיות אחת מ: consumer (צרכנות), employment (דיני עבודה), rental (שכירות), tort (נזיקין).
- description: 1-2 משפטים קצרים שמסכמים מה קרה בגוף שלישי.
- אל תמציא מידע שלא קיים בטקסט.

החזר JSON בפורמט הבא בלבד (ללא markdown, ללא הסברים):
{
  "respondentName": "string | null",
  "respondentAddress": "string | null",
  "eventDate": "string | null",
  "amount": "string | null",
  "description": "string",
  "category": "consumer | employment | rental | tort"
}`;

const EXTRACT_WITH_EVIDENCE_PROMPT = `אתה מנתח טקסט משפטי בעברית, כולל ראיות ומסמכים שצורפו.
משימתך: חלץ מהטקסט ומהראיות את הפרטים לטופס JSON בדיוק.

כללים:
- ההקלטה/טקסט עשויים להיות רגשיים ומבולבלים — התעלם מקללות, חזרות ורגשות. חלץ עובדות בלבד.
- אם לא ניתן לחלץ שדה מסוים — הכנס null.
- קטגוריה חייבת להיות אחת מ: consumer (צרכנות), employment (דיני עבודה), rental (שכירות), tort (נזיקין).
- description: 1-2 משפטים קצרים שמסכמים מה קרה בגוף שלישי.
- אל תמציא מידע שלא קיים בטקסט או בראיות.
- נתח את הראיות (תמונות, מסמכים) יחד עם הטקסט. שלב מידע שאתה רואה בתמונות (שמות, תאריכים, סכומים, כתובות).

החזר JSON בפורמט הבא בלבד (ללא markdown, ללא הסברים):
{
  "respondentName": "string | null",
  "respondentAddress": "string | null",
  "eventDate": "string | null",
  "amount": "string | null",
  "description": "string",
  "category": "consumer | employment | rental | tort"
}`;

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_AI_API_KEY is not set");
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export async function extractContext(
  input: string | { base64: string; mimeType: string },
  evidence?: EvidenceFile[]
): Promise<ExtractedData> {
  const ai = getClient();

  let textToAnalyze: string;
  let rawTranscription: string | undefined;

  if (typeof input === "string") {
    textToAnalyze = input;
  } else {
    textToAnalyze = await transcribeAudio(ai, input.base64, input.mimeType);
    rawTranscription = textToAnalyze;
  }

  if (textToAnalyze.trim().length < 10) {
    throw new Error("הטקסט קצר מדי להבנה. אנא פרט יותר.");
  }

  const hasEvidence = evidence && evidence.length > 0;
  const prompt = hasEvidence ? EXTRACT_WITH_EVIDENCE_PROMPT : EXTRACT_PROMPT;

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

  if (hasEvidence) {
    for (const file of evidence) {
      if (file.type.startsWith("image/")) {
        parts.push({
          inlineData: { mimeType: file.type, data: file.base64 },
        });
        if (file.description) {
          parts.push({ text: `תיאור הראיה מהמשתמש: ${file.description}` });
        }
      } else if (file.type === "application/pdf") {
        parts.push({
          inlineData: { mimeType: file.type, data: file.base64 },
        });
        if (file.description) {
          parts.push({ text: `תיאור מסמך PDF מהמשתמש: ${file.description}` });
        }
      }
    }
  }

  parts.push({ text: `${prompt}\n\nטקסט לניתוח:\n${textToAnalyze}` });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts }],
  });

  const raw = response.text ?? "";
  const cleaned = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("לא הצלחנו להבין את הפרטים. נסה לפרט יותר.");
  }

  const category = VALID_CATEGORIES.includes(parsed.category as Category)
    ? (parsed.category as Category)
    : "consumer";

  const description = typeof parsed.description === "string" && parsed.description.length > 0
    ? parsed.description
    : textToAnalyze.slice(0, 200);

  return {
    respondentName: typeof parsed.respondentName === "string" ? parsed.respondentName : "",
    respondentAddress: typeof parsed.respondentAddress === "string" ? parsed.respondentAddress : undefined,
    eventDate: typeof parsed.eventDate === "string" ? parsed.eventDate : undefined,
    amount: typeof parsed.amount === "string" ? parsed.amount : undefined,
    description,
    category,
    rawTranscription,
  };
}

async function transcribeAudio(
  ai: GoogleGenAI,
  base64: string,
  mimeType: string
): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64,
            },
          },
          {
            text: "תמלל את ההקלטה הבאה לעברית. החזר את התמלול בלבד, ללא הסברים נוספים.",
          },
        ],
      },
    ],
  });

  return response.text ?? "";
}
