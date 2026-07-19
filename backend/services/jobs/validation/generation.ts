import { randomUUID } from "crypto";
import { sanitizeInput } from "@/backend/services/security/sanitize";
import { VALID_CATEGORIES } from "@/lib/constants";
import type {
  Category,
  Goal,
  LetterInput,
  SenderType,
  Tone,
} from "@/lib/types";
import type { LetterGenerationJobInput } from "../types";
import { sanitizeStoredFiles } from "./common";

const TONES = new Set<Tone>([
  "firm",
  "businesslike",
  "conciliatory",
  "threatening",
]);
const GOALS = new Set<Goal>(["compensation", "fix", "apology", "intimidate"]);
const SENDER_TYPES = new Set<SenderType>(["individual", "company"]);

export function validateGenerationInput(
  sessionId: string,
  body: Record<string, unknown>
): LetterGenerationJobInput {
  const raw = (body.letterInput ?? {}) as Partial<LetterInput>;
  if (
    !raw.category ||
    !VALID_CATEGORIES.includes(raw.category as Category) ||
    !raw.respondentName ||
    !raw.description ||
    !raw.senderName ||
    !raw.senderEmail ||
    !raw.tone ||
    !TONES.has(raw.tone) ||
    !raw.goal ||
    !GOALS.has(raw.goal) ||
    (raw.senderType !== undefined && !SENDER_TYPES.has(raw.senderType))
  ) {
    throw new Error("חסרים פרטים נדרשים ליצירת המכתב");
  }

  const evidence = sanitizeStoredFiles(sessionId, body.evidence ?? []);
  return {
    letterInput: sanitizeLetterInput(raw),
    extractedData: sanitizeExtractedData(body.extractedData),
    evidence,
    workflowId: randomUUID(),
  };
}

export function sanitizeLetterInput(raw: Partial<LetterInput>): LetterInput {
  return {
    category: raw.category as Category,
    respondentName: clean(raw.respondentName),
    respondentAddress: optional(raw.respondentAddress),
    eventDate: optional(raw.eventDate),
    amount: optional(raw.amount),
    description: clean(raw.description),
    tone: raw.tone as Tone,
    goal: raw.goal as Goal,
    rawInput: clean(raw.rawInput || raw.description),
    senderType: (raw.senderType || "individual") as SenderType,
    senderName: clean(raw.senderName),
    senderAddress: clean(raw.senderAddress),
    senderPhone: clean(raw.senderPhone),
    senderEmail: clean(raw.senderEmail),
    senderIdNumber: optional(raw.senderIdNumber),
    companyName: optional(raw.companyName),
    companyNumber: optional(raw.companyNumber),
    signatoryRole: optional(raw.signatoryRole),
  };
}

function clean(value: string | undefined): string {
  return sanitizeInput(value || "");
}

function optional(value: string | undefined): string | undefined {
  const cleaned = clean(value);
  return cleaned || undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function sanitizeExtractedData(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {};
  const serialized = JSON.stringify(value);
  if (serialized.length > 50_000) {
    throw new Error("המידע שחולץ גדול מדי");
  }
  return JSON.parse(serialized) as Record<string, unknown>;
}

