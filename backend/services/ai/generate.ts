import type { LetterInput, LetterOutput } from "@/lib/types";
import { AiOperation } from "@prisma/client";
import { getKnowledge } from "./knowledge";
import { buildUserPrompt } from "./build-prompt";
import { callModel } from "./call-model";
import { sanitizeForFileName, getCurrentMonthHebrew } from "./parse-response";
import { verifyLetter, stripLegalCitations } from "./verify";
import { validateLetter, buildRetryInstruction } from "./validate-letter";
import { stripAiDashes } from "./strip-ai-dashes";

interface GenerateLetterContext {
  sessionId?: string | null;
  workflowId: string;
}

export async function generateLetter(
  input: LetterInput,
  context: GenerateLetterContext
): Promise<LetterOutput> {
  const knowledge = getKnowledge(input.category);
  const promptSnapshot = buildUserPrompt(input, knowledge);

  let { raw, parsed } = await callModel(input, promptSnapshot, {
    ...context,
    operation: AiOperation.LETTER_GENERATION,
  });
  let modelResponse = raw;

  // Phase 1: Verify legal citations are from knowledge base
  let verification = verifyLetter(parsed.content, knowledge);

  if (!verification.verified) {
    const retryNote = `הסעיפים הבאים לא קיימים ברשימת הידע ואסור להשתמש בהם: ${verification.invalidCitations.join(" | ")}. השתמש רק בסעיפים מהרשימה. אם אין סעיף מתאים: כתוב בסיס עובדתי בלבד בלי ציטוטי חוק. אסור להשתמש במקף ארוך (em dash / en dash).`;
    const retryPrompt = buildUserPrompt(input, knowledge, retryNote);
    const retry = await callModel(input, retryPrompt, {
      ...context,
      operation: AiOperation.CITATION_RETRY,
    });
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

  // Phase 2: Validate guardrails (placeholders, citations, threats)
  const validation = validateLetter(parsed.content);

  if (!validation.valid) {
    const fixInstruction = buildRetryInstruction(validation.issues);
    const guardPrompt = buildUserPrompt(input, knowledge, fixInstruction);
    const guardRetry = await callModel(input, guardPrompt, {
      ...context,
      operation: AiOperation.GUARDRAIL_RETRY,
    });
    modelResponse = `${modelResponse}\n\n===GUARDRAIL_RETRY===\n${guardRetry.raw}`;
    parsed = guardRetry.parsed;
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
