import type { ProcessingJob } from "@prisma/client";
import { rewriteAsAttorney } from "@/backend/services/ai/rewrite-as-attorney";
import { trackEventSafely } from "@/backend/services/analytics/track-event";
import { prisma } from "@/backend/services/db/prisma";
import { isPaidPaymentStatus } from "@/backend/services/payment";
import { encryptJobPayload } from "../payload";
import type {
  AttorneyRewriteJobInput,
  AttorneyRewriteJobResult,
} from "../types";

export async function processAttorneyRewrite(
  job: ProcessingJob,
  input: AttorneyRewriteJobInput,
  onProgress: (stage: string, progress: number) => Promise<void>
): Promise<AttorneyRewriteJobResult> {
  const [payment, existingLetter] = await Promise.all([
    prisma.payment.findUnique({ where: { leadId: input.leadId } }),
    prisma.letter.findUnique({
      where: { leadId: input.leadId },
      select: {
        content: true,
        draftContent: true,
        modelResponse: true,
      },
    }),
  ]);
  if (!isPaidPaymentStatus(payment?.status)) {
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

  const draftContent =
    existingLetter?.draftContent?.trim() ||
    existingLetter?.content ||
    input.content;

  await onProgress("שומר את הנוסח", 85);
  await prisma.$transaction([
    prisma.letter.update({
      where: { leadId: input.leadId },
      data: {
        draftContent,
        content: rewritten.content,
        verified: rewritten.verified,
        attorneyVerified: true,
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

  await onProgress("שומר PDF חתום", 92);
  const { persistLetterPdfSafely } = await import(
    "@/backend/services/pdf/persist-letter-pdf"
  );
  await persistLetterPdfSafely({
    leadId: input.leadId,
    kind: "signed",
    content: rewritten.content,
    letterInput: input.letterInput,
    fileName: input.letterInput.respondentName
      ? `מכתב_התראה_${input.letterInput.respondentName}`
      : "מכתב_התראה",
  });

  await trackEventSafely({
    sessionId: job.sessionId,
    leadId: input.leadId,
    type: "ATTORNEY_REWRITE_COMPLETED",
  });
  return result;
}
