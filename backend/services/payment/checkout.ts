import { ProcessingJobType, type Letter, type Lead } from "@prisma/client";
import { prisma } from "@/backend/services/db/prisma";
import { scheduleProcessingJob } from "@/backend/services/jobs/dispatch";
import { createProcessingJob } from "@/backend/services/jobs/repository";
import { decryptJobPayload } from "@/backend/services/jobs/payload";
import { sanitizeLetterInput } from "@/backend/services/jobs/validation/generation";
import type { AttorneyRewriteJobInput, LetterGenerationJobInput } from "@/backend/services/jobs/types";
import type { Category, Goal, LetterInput, Tone } from "@/lib/types";
import { SIGNATURE_PRICE } from "@/lib/constants";
import { resolvePaymentProvider } from "./resolve-provider";
import { isPaidPaymentStatus } from "./types";
import type { ParsedWebhook } from "./types";

const ATTORNEY_REWRITE_MARKER = "===ATTORNEY_REWRITE===";

export function letterHasAttorneyRewrite(letter: {
  modelResponse: string | null;
} | null): boolean {
  return !!letter?.modelResponse?.includes(ATTORNEY_REWRITE_MARKER);
}

export async function startCheckout(input: {
  leadId: string;
  customer?: { name?: string; email?: string; phone?: string };
}): Promise<{ checkoutUrl?: string; alreadyPaid: boolean }> {
  const existing = await prisma.payment.findUnique({
    where: { leadId: input.leadId },
  });
  if (existing && isPaidPaymentStatus(existing.status)) {
    return { alreadyPaid: true };
  }

  await prisma.payment.upsert({
    where: { leadId: input.leadId },
    create: {
      leadId: input.leadId,
      amount: SIGNATURE_PRICE,
      status: "pending",
      provider: "payplus",
      failureReason: null,
    },
    update: {
      amount: SIGNATURE_PRICE,
      status: "pending",
      provider: "payplus",
      externalTransactionUid: null,
      failureReason: null,
      paidAt: null,
    },
  });

  const provider = resolvePaymentProvider();
  const checkout = await provider.createCheckout({
    leadId: input.leadId,
    amountIls: SIGNATURE_PRICE,
    customer: input.customer,
  });

  await prisma.payment.update({
    where: { leadId: input.leadId },
    data: { externalRequestUid: checkout.externalRequestId },
  });

  return { checkoutUrl: checkout.checkoutUrl, alreadyPaid: false };
}

export async function applyVerifiedWebhook(
  parsed: ParsedWebhook
): Promise<{ alreadyProcessed: boolean }> {
  if (
    parsed.status === "completed" &&
    Math.round(parsed.amountIls) !== SIGNATURE_PRICE
  ) {
    throw new Error("סכום העסקה אינו תואם");
  }

  const payment = await prisma.payment.findUnique({
    where: { leadId: parsed.leadId },
  });
  if (!payment) {
    throw new Error("לא נמצאה עסקת תשלום לליד");
  }

  if (isPaidPaymentStatus(payment.status) && parsed.status === "completed") {
    return { alreadyProcessed: true };
  }

  if (parsed.status === "failed") {
    if (!isPaidPaymentStatus(payment.status)) {
      await prisma.payment.update({
        where: { leadId: parsed.leadId },
        data: {
          status: "failed",
          failureReason: parsed.failureReason?.slice(0, 500) ?? null,
          externalRequestUid:
            parsed.externalRequestId ?? payment.externalRequestUid,
          externalTransactionUid:
            parsed.externalTransactionId ?? payment.externalTransactionUid,
        },
      });
    }
    return { alreadyProcessed: false };
  }

  await prisma.payment.update({
    where: { leadId: parsed.leadId },
    data: {
      status: "completed",
      amount: SIGNATURE_PRICE,
      paidAt: new Date(),
      failureReason: null,
      externalRequestUid: parsed.externalRequestId ?? payment.externalRequestUid,
      externalTransactionUid:
        parsed.externalTransactionId ?? payment.externalTransactionUid,
    },
  });

  return { alreadyProcessed: false };
}

export async function schedulePaidAttorneyRewrite(leadId: string): Promise<void> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { letter: true, payment: true },
  });
  if (!lead?.letter || !lead.analyticsSessionId) return;
  if (!isPaidPaymentStatus(lead.payment?.status)) return;
  if (letterHasAttorneyRewrite(lead.letter)) return;

  const existingJob = await prisma.processingJob.findFirst({
    where: {
      leadId,
      type: ProcessingJobType.ATTORNEY_REWRITE,
      status: { in: ["QUEUED", "PROCESSING", "SUCCEEDED"] },
    },
    select: { id: true },
  });
  if (existingJob) return;

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
  scheduleProcessingJob(job);
}

export async function getPaymentStatusForLead(leadId: string): Promise<{
  status: string;
  rewriteReady: boolean;
  content?: string;
}> {
  const [payment, letter, rewriteJob] = await Promise.all([
    prisma.payment.findUnique({ where: { leadId } }),
    prisma.letter.findUnique({
      where: { leadId },
      select: { content: true, modelResponse: true },
    }),
    prisma.processingJob.findFirst({
      where: { leadId, type: ProcessingJobType.ATTORNEY_REWRITE },
      orderBy: { createdAt: "desc" },
      select: { status: true, encryptedResult: true },
    }),
  ]);

  const paid = isPaidPaymentStatus(payment?.status);
  const rewriteFromLetter = paid && letterHasAttorneyRewrite(letter);
  let content = rewriteFromLetter ? letter?.content : undefined;

  if (
    paid &&
    !content &&
    rewriteJob?.status === "SUCCEEDED" &&
    rewriteJob.encryptedResult
  ) {
    try {
      const result = decryptJobPayload<{ content?: string }>(
        rewriteJob.encryptedResult
      );
      content = result.content;
    } catch {
      content = undefined;
    }
  }

  return {
    status: payment?.status ?? "missing",
    rewriteReady: Boolean(paid && content),
    content,
  };
}

async function resolveRewriteLetterInput(
  lead: Lead,
  letter: Letter
): Promise<LetterInput> {
  const genJob = await prisma.processingJob.findFirst({
    where: {
      leadId: lead.id,
      type: ProcessingJobType.LETTER_GENERATION,
      status: "SUCCEEDED",
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
      // fall through to reconstructed input
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
