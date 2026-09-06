import {
  AiCallStatus,
  AiOperation,
  AiProvider,
} from "@prisma/client";
import { recordAiUsage } from "./record-usage";
import { GEMINI_FLASH_MODEL } from "@/backend/services/ai/google-model";

interface GoogleUsageResponse {
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    cachedContentTokenCount?: number;
    thoughtsTokenCount?: number;
  };
}

interface GoogleUsageContext {
  sessionId?: string | null;
  leadId?: string;
  workflowId?: string;
}

export async function recordGoogleUsage(
  response: GoogleUsageResponse | undefined,
  operation: AiOperation,
  status: AiCallStatus,
  latencyMs: number,
  context?: GoogleUsageContext,
  error?: unknown
): Promise<void> {
  const usage = response?.usageMetadata;
  const thinkingTokens = usage?.thoughtsTokenCount ?? 0;

  await recordAiUsage({
    ...context,
    operation,
    provider: AiProvider.GOOGLE,
    model: GEMINI_FLASH_MODEL,
    status,
    inputTokens: usage?.promptTokenCount,
    outputTokens: (usage?.candidatesTokenCount ?? 0) + thinkingTokens,
    cachedInputTokens: usage?.cachedContentTokenCount,
    thinkingTokens,
    latencyMs,
    errorCode: error instanceof Error ? error.message : undefined,
  });
}

