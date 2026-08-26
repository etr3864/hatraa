import {
  ProcessingJobStatus,
  ProcessingJobType,
  type Letter,
  type Lead,
} from "@prisma/client";
import { prisma } from "@/backend/services/db/prisma";
import { scheduleProcessingJob } from "@/backend/services/jobs/dispatch";
import { createProcessingJob } from "@/backend/services/jobs/repository";
import { decryptJobPayload } from "@/backend/services/jobs/payload";
import { sanitizeLetterInput } from "@/backend/services/jobs/validation/generation";
import type { AttorneyRewriteJobInput, LetterGenerationJobInput } from "@/backend/services/jobs/types";
import type { Category, Goal, LetterInput, Tone } from "@/lib/types";
import { isPaidPaymentStatus } from "./types";

export type PaymentFulfillmentPhase =
  | "awaiting_payment"
  | "payment_failed"
  | "paid_pending_rewrite"
  | "rewrite_queued"
  | "rewrite_processing"
  | "rewrite_ready"
  | "rewrite_failed";

export interface PaymentFulfillmentStatus {
  status: string;
  phase: PaymentFulfillmentPhase;
  rewriteReady: boolean;
  content?: string;
  rewriteJobStatus?: ProcessingJobStatus | null;
  rewriteError?: string | null;
  rewriteStage?: string | null;
}

const ATTORNEY_REWRITE_MARKER = "===ATTORNEY_REWRITE===";

export function letterHasAttorneyRewrite(letter: {
  modelResponse: string | null;
} | null): boolean {
  return !!letter?.modelResponse?.includes(ATTORNEY_REWRITE_MARKER);
}

export async function getPaymentFulfillmentStatus(
  leadId: string
): Promise<PaymentFulfillmentStatus> {
  const [payment, letter, rewriteJob] = await Promise.all([
    prisma.payment.findUnique({ where: { leadId } }),
    prisma.letter.findUnique({
      where: { leadId },
      select: { content: true, modelResponse: true },
    }),
    prisma.processingJob.findFirst({
      where: { leadId, type: ProcessingJobType.ATTORNEY_REWRITE },
      orderBy: { createdAt: "desc" },
      select: {
        status: true,
        encryptedResult: true,
        errorMessage: true,
        progressStage: true,
      },
    }),
  ]);

  const paymentStatus = payment?.status ?? "missing";
  const paid = isPaidPaymentStatus(paymentStatus);

  if (paymentStatus === "failed") {
    return {
      status: paymentStatus,
      phase: "payment_failed",
      rewriteReady: false,
      rewriteJobStatus: rewriteJob?.status ?? null,
      rewriteError: payment?.failureReason ?? null,
    };
  }

  if (!paid) {
    return {
      status: paymentStatus,
      phase: "awaiting_payment",
      rewriteReady: false,
      rewriteJobStatus: rewriteJob?.status ?? null,
    };
  }

  const content = await resolveRewriteContent(letter, rewriteJob, paid);
  if (content) {
    return {
      status: paymentStatus,
      phase: "rewrite_ready",
      rewriteReady: true,
      content,
      rewriteJobStatus: rewriteJob?.status ?? ProcessingJobStatus.SUCCEEDED,
    };
  }

  if (rewriteJob?.status === ProcessingJobStatus.FAILED) {
    return {
      status: paymentStatus,
      phase: "rewrite_failed",
      rewriteReady: false,
      rewriteJobStatus: rewriteJob.status,
      rewriteError:
        rewriteJob.errorMessage ?? "שכתוב המכתב נכשל. אפשר לנסות שוב.",
      rewriteStage: rewriteJob.progressStage,
    };
  }

  if (
    rewriteJob?.status === ProcessingJobStatus.PROCESSING ||
    rewriteJob?.status === ProcessingJobStatus.QUEUED
  ) {
    return {
      status: paymentStatus,
      phase:
        rewriteJob.status === ProcessingJobStatus.PROCESSING
          ? "rewrite_processing"
          : "rewrite_queued",
      rewriteReady: false,
      rewriteJobStatus: rewriteJob.status,
      rewriteStage: rewriteJob.progressStage,
    };
  }

  return {
    status: paymentStatus,
    phase: "paid_pending_rewrite",
    rewriteReady: false,
    rewriteJobStatus: rewriteJob?.status ?? null,
  };
}

export async function ensurePaidAttorneyRewrite(leadId: string): Promise<void> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { letter: true, payment: true },
  });
  if (!lead?.letter || !lead.analyticsSessionId) return;
  if (!isPaidPaymentStatus(lead.payment?.status)) return;
  if (letterHasAttorneyRewrite(lead.letter)) return;

  const activeJob = await prisma.processingJob.findFirst({
    where: {
      leadId,
      type: ProcessingJobType.ATTORNEY_REWRITE,
      status: {
        in: [
          ProcessingJobStatus.QUEUED,
          ProcessingJobStatus.PROCESSING,
          ProcessingJobStatus.SUCCEEDED,
        ],
      },
    },
    orderBy: { createdAt: "desc" },
  });
  if (activeJob) {
    if (activeJob.status === ProcessingJobStatus.QUEUED) {
      scheduleProcessingJob(activeJob, { strategy: "background" });
    }
    return;
  }

  const failedJob = await prisma.processingJob.findFirst({
    where: {
      leadId,
      type: ProcessingJobType.ATTORNEY_REWRITE,
      status: ProcessingJobStatus.FAILED,
    },
    orderBy: { createdAt: "desc" },
  });
  if (failedJob) {
    scheduleProcessingJob(failedJob, { strategy: "background" });
    return;
  }

  const job = await createProcessingJob({
    sessionId: lead.analyticsSessionId,
    leadId,
    type: ProcessingJobType.ATTORNEY_REWRITE,
    idempotencyKey: `payment-rewrite:${leadId}`,
    payload: {
      leadId,
      content: lead.letter.content,
      letterInput: await resolveRewriteLetterInput(lead, lead.letter),
      workflowId: `payment-rewrite:${leadId}`,
    } satisfies AttorneyRewriteJobInput,
  });
  scheduleProcessingJob(job, { strategy: "background" });
}

async function resolveRewriteContent(
  letter: { content: string; modelResponse: string | null } | null,
  rewriteJob: {
    status: ProcessingJobStatus;
    encryptedResult: string | null;
  } | null,
  paid: boolean
): Promise<string | undefined> {
  if (!paid) return undefined;
  if (letterHasAttorneyRewrite(letter)) return letter?.content;

  if (
    rewriteJob?.status === ProcessingJobStatus.SUCCEEDED &&
    rewriteJob.encryptedResult
  ) {
    try {
      const result = decryptJobPayload<{ content?: string }>(
        rewriteJob.encryptedResult
      );
      return result.content;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

async function resolveRewriteLetterInput(
  lead: Lead,
  letter: Letter
): Promise<LetterInput> {
  const genJob = await prisma.processingJob.findFirst({
    where: {
      leadId: lead.id,
      type: ProcessingJobType.LETTER_GENERATION,
      status: ProcessingJobStatus.SUCCEEDED,
    },
    orderBy: { createdAt: "desc" },
    select: { encryptedInput: true },
  });
  if (genJob?.encryptedInput) {
    try {
      const payload = decryptJobPayload<LetterGenerationJobInput>(
        genJob.encryptedInput
      );
      if (payload.letterInput?.senderName) {
        return sanitizeLetterInput(payload.letterInput);
      }
    } catch {
      // fall through
    }
  }
  return letterToRewriteInput(lead, letter);
}

function letterToRewriteInput(lead: Lead, letter: Letter): LetterInput {
  const extracted = (letter.extractedData ?? {}) as Record<string, unknown>;
  const description =
    typeof extracted.description === "string"
      ? extracted.description
      : letter.rawInput;

  return sanitizeLetterInput({
    category: letter.category as Category,
    respondentName: letter.respondentName,
    respondentAddress: letter.respondentAddress ?? undefined,
    eventDate: letter.eventDate ?? undefined,
    amount: letter.amount ?? undefined,
    description,
    tone: letter.tone as Tone,
    goal: letter.goal as Goal,
    rawInput: letter.rawInput,
    senderType: "individual",
    senderName: lead.name,
    senderAddress: lead.address,
    senderPhone: lead.phone,
    senderEmail: lead.email,
    senderIdNumber: lead.idNumber ?? undefined,
  });
}
