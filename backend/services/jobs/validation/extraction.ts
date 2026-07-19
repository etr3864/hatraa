import { randomUUID } from "crypto";
import { sanitizeInput } from "@/backend/services/security/sanitize";
import type { ExtractionJobInput } from "../types";
import {
  sanitizeStoredFile,
  sanitizeStoredFiles,
} from "./common";

export function validateExtractionInput(
  sessionId: string,
  body: Record<string, unknown>
): ExtractionJobInput {
  const text =
    typeof body.text === "string"
      ? sanitizeInput(body.text).slice(0, 20_000)
      : undefined;
  const audio = body.audio
    ? sanitizeStoredFile(sessionId, body.audio)
    : undefined;
  if ((!text || text.length < 20) && !audio) {
    throw new Error("יש להזין תיאור או הקלטה");
  }

  return {
    text,
    audio,
    evidence: sanitizeStoredFiles(sessionId, body.evidence ?? []),
    workflowId: randomUUID(),
  };
}

