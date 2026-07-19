import { randomUUID } from "crypto";
import { sanitizeInput } from "@/backend/services/security/sanitize";
import { VALID_CATEGORIES } from "@/lib/constants";
import type { Category, LetterInput } from "@/lib/types";
import type { AttorneyRewriteJobInput } from "../types";
import { sanitizeLetterInput } from "./generation";

export function validateRewriteInput(
  body: Record<string, unknown>
): AttorneyRewriteJobInput {
  const letterInput = (body.letterInput ?? {}) as Partial<LetterInput>;
  if (
    typeof body.leadId !== "string" ||
    !body.leadId ||
    typeof body.content !== "string" ||
    !body.content.trim() ||
    !letterInput.senderName ||
    !letterInput.senderEmail ||
    !letterInput.respondentName ||
    !letterInput.description ||
    !letterInput.tone ||
    !letterInput.goal ||
    !letterInput.category ||
    !VALID_CATEGORIES.includes(letterInput.category as Category)
  ) {
    throw new Error("חסרים פרטי מכתב לשכתוב");
  }

  return {
    leadId: body.leadId,
    content: sanitizeInput(body.content).slice(0, 50_000),
    letterInput: sanitizeLetterInput(letterInput),
    workflowId: randomUUID(),
  };
}

