import type { LetterInput, LetterOutput } from "@/lib/types";
import { getKnowledge } from "./knowledge";
import { buildUserPrompt } from "./build-prompt";
import { callModel } from "./call-model";
import { sanitizeForFileName, getCurrentMonthHebrew } from "./parse-response";
import { verifyLetter, stripLegalCitations } from "./verify";
import { stripAiDashes } from "./strip-ai-dashes";

export async function generateLetter(input: LetterInput): Promise<LetterOutput> {
  const knowledge = getKnowledge(input.category);
  const promptSnapshot = buildUserPrompt(input, knowledge);

  let { raw, parsed } = await callModel(input, promptSnapshot);
  let modelResponse = raw;
  let verification = verifyLetter(parsed.content, knowledge);

  if (!verification.verified) {
    const retryNote = `הסעיפים הבאים לא קיימים ברשימת הידע ואסור להשתמש בהם: ${verification.invalidCitations.join(" | ")}. השתמש רק בסעיפים מהרשימה. אם אין סעיף מתאים: כתוב בסיס עובדתי בלבד בלי ציטוטי חוק. אסור להשתמש במקף ארוך (em dash / en dash).`;
    const retryPrompt = buildUserPrompt(input, knowledge, retryNote);
    const retry = await callModel(input, retryPrompt);
    raw = retry.raw;
    parsed = retry.parsed;
    modelResponse = `${modelResponse}\n\n===RETRY===\n${raw}`;
    verification = verifyLetter(parsed.content, knowledge);

    if (!verification.verified) {
      parsed = {
        ...parsed,
        content: stripLegalCitations(parsed.content),
      };
      verification = { verified: true, invalidCitations: [] };
    }
  }

  const fileName = stripAiDashes(
    parsed.fileName ||
      `מכתב_התראה_${sanitizeForFileName(input.respondentName)}_${getCurrentMonthHebrew()}`
  );

  return {
    content: stripAiDashes(parsed.content),
    upsellMessage: stripAiDashes(parsed.upsellMessage),
    fileName,
    knowledgeVersion: knowledge.version,
    promptSnapshot,
    modelResponse,
    verified: verification.verified,
  };
}
