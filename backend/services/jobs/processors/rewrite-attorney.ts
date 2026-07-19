import type { ProcessingJob } from "@prisma/client";
import { rewriteAsAttorney } from "@/backend/services/ai/rewrite-as-attorney";
import { trackEventSafely } from "@/backend/services/analytics/track-event";
import { prisma } from "@/backend/services/db/prisma";
import { encryptJobPayload } from "../payload";
import type {
  AttorneyRewriteJobInput,
  AttorneyRewriteJobResult,
} from "../types";

const PAID_STATUSES = new Set(["completed", "mock"]);

export async function processAttorneyRewrite(
  job: ProcessingJob,
  input: AttorneyRewriteJobInput,
  onProgress: (stage: string, progress: number) => Promise<void>
): Promise<AttorneyRewriteJobResult> {
  const [payment, existingLetter] = await Promise.all([
    prisma.payment.findUnique({ where: { leadId: input.leadId } }),
    prisma.letter.findUnique({
      where: { leadId: input.leadId },
      select: { modelResponse: true },
    }),
  ]);
  if (!payment || !PAID_STATUSES.has(payment.status)) {
    throw new Error("נדרש תשלום לפני ניסוח בשם עורך דין");
  }

  await onProgress("מנסח בשם עורך הדין", 40);
  const rewritten = await rewriteAsAttorney(input.content, input.letterInput, {
    sessionId: job.sessionId,
    leadId: input.leadId,
    workflowId: input.workflowId,
  });
  const result: AttorneyRewriteJobResult = {
    content: rewritten.content,
    verified: rewritten.verified,
    attorneyVerified: true,
  };

  await onProgress("שומר את הנוסח", 85);
  await prisma.$transaction([
    prisma.letter.update({
      where: { leadId: input.leadId },
      data: {
        content: rewritten.content,
        verified: rewritten.verified,
        modelResponse: `${existingLetter?.modelResponse ?? ""}\n\n===ATTORNEY_REWRITE===\nverified=${rewritten.verified}`,
      },
    }),
    prisma.processingJob.update({
      where: { id: job.id },
      data: {
        encryptedResult: encryptJobPayload(result),
        progressStage: "הנוסח נשמר",
      },
    }),
  ]);

  await trackEventSafely({
    sessionId: job.sessionId,
    leadId: input.leadId,
    type: "ATTORNEY_REWRITE_COMPLETED",
  });
  return result;
}

