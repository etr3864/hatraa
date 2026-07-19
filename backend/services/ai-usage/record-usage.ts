import { randomUUID } from "crypto";
import type {
  AiCallStatus,
  AiOperation,
  AiProvider,
} from "@prisma/client";
import { prisma } from "@/backend/services/db/prisma";
import { getUsdIlsRate } from "@/backend/services/pricing/exchange-rate";
import { getActiveModelPrice } from "@/backend/services/pricing/model-pricing";
import { calculateAiCost } from "./calculate-cost";

export interface AiUsageContext {
  sessionId?: string | null;
  leadId?: string;
  workflowId?: string;
  operation: AiOperation;
}

interface RecordAiUsageInput extends AiUsageContext {
  requestId?: string;
  provider: AiProvider;
  model: string;
  status: AiCallStatus;
  inputTokens?: number;
  outputTokens?: number;
  cachedInputTokens?: number;
  thinkingTokens?: number;
  latencyMs?: number;
  errorCode?: string;
}

export async function recordAiUsage(
  input: RecordAiUsageInput
): Promise<void> {
  try {
    const [price, usdIlsRate] = await Promise.all([
      getActiveModelPrice(input.provider, input.model),
      getUsdIlsRate(),
    ]);

    const inputTokens = nonNegativeInteger(input.inputTokens);
    const outputTokens = nonNegativeInteger(input.outputTokens);
    const cachedInputTokens = nonNegativeInteger(input.cachedInputTokens);
    const thinkingTokens = nonNegativeInteger(input.thinkingTokens);
    const { costUsd, costIls } = calculateAiCost({
      inputTokens,
      outputTokens,
      inputUsdPerMillion: price.inputUsdPerMillion,
      outputUsdPerMillion: price.outputUsdPerMillion,
      usdIlsRate,
    });

    await prisma.aiCallLog.create({
      data: {
        requestId: input.requestId ?? randomUUID(),
        workflowId: input.workflowId,
        sessionId: input.sessionId || undefined,
        leadId: input.leadId,
        provider: input.provider,
        model: input.model,
        operation: input.operation,
        status: input.status,
        inputTokens,
        outputTokens,
        cachedInputTokens,
        thinkingTokens,
        inputUsdPerMillion: price.inputUsdPerMillion,
        outputUsdPerMillion: price.outputUsdPerMillion,
        usdIlsRate,
        costUsd,
        costIls,
        latencyMs: input.latencyMs,
        errorCode: input.errorCode?.slice(0, 120),
      },
    });
  } catch (error) {
    console.warn(
      "[ai-usage] call was not persisted:",
      error instanceof Error ? error.message : error
    );
  }
}

export async function attachAiCallsToLead(
  workflowId: string,
  leadId: string
): Promise<void> {
  try {
    await prisma.aiCallLog.updateMany({
      where: { workflowId, leadId: null },
      data: { leadId },
    });
  } catch (error) {
    console.warn(
      "[ai-usage] calls were not attached to lead:",
      error instanceof Error ? error.message : error
    );
  }
}

function nonNegativeInteger(value: number | undefined): number {
  return Number.isFinite(value)
    ? Math.max(0, Math.round(value as number))
    : 0;
}

