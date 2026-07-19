import type { ProcessingJob } from "@prisma/client";
import { generateLetter } from "@/backend/services/ai/generate";
import { attachAiCallsToLead } from "@/backend/services/ai-usage/record-usage";
import { trackEventSafely } from "@/backend/services/analytics/track-event";
import { prisma } from "@/backend/services/db/prisma";
import { encryptLeadPii } from "@/backend/services/security/encryption";
import type {
  LetterGenerationJobInput,
  LetterGenerationJobResult,
} from "../types";
import {
  loadStoredEvidence,
  persistStoredEvidence,
} from "../stored-files";
import type { LetterInput } from "@/lib/types";

export async function processLetterGeneration(
  job: ProcessingJob,
  input: LetterGenerationJobInput,
  onProgress: (stage: string, progress: number) => Promise<void>
): Promise<LetterGenerationJobResult> {
  if (job.leadId) {
    return recoverExistingResult(job.leadId, input);
  }

  await onProgress("טוען את הראיות", 20);
  const evidence = await loadStoredEvidence(input.evidence);
  const letterInput = { ...input.letterInput, evidence };

  await onProgress("מנסח את המכתב", 45);
  const output = await generateLetter(letterInput, {
    sessionId: job.sessionId,
    workflowId: input.workflowId,
  });

  await onProgress("שומר את המכתב", 85);
  const lead = await createGeneratedLead(job, input, output);
  if (!lead.letter) throw new Error("Generated letter was not persisted");
  await finalizeGeneratedLead(
    lead.id,
    job.sessionId,
    input
  );

  return {
    leadId: lead.id,
    letterId: lead.letter.id,
    content: output.content,
    upsellMessage: output.upsellMessage,
    fileName: output.fileName,
    letterInput: buildResultLetterInput(input),
  };
}

async function createGeneratedLead(
  job: ProcessingJob,
  input: LetterGenerationJobInput,
  output: Awaited<ReturnType<typeof generateLetter>>
) {
  const letterInput = input.letterInput;
  const leadName =
    letterInput.senderType === "company" && letterInput.companyName
      ? `${letterInput.companyName} (${letterInput.senderName})`
      : letterInput.senderName;
  const pii = encryptLeadPii({
    name: leadName,
    idNumber:
      letterInput.senderType === "company"
        ? letterInput.companyNumber || null
        : letterInput.senderIdNumber || null,
    address: letterInput.senderAddress,
    phone: letterInput.senderPhone,
    email: letterInput.senderEmail,
  });

  return prisma.$transaction(async (tx) => {
    const lead = await tx.lead.create({
      data: {
        ...pii,
        analyticsSessionId: job.sessionId,
        letter: {
          create: {
            category: letterInput.category,
            rawInput: letterInput.rawInput || letterInput.description,
            extractedData: JSON.parse(
              JSON.stringify(input.extractedData ?? {})
            ),
            respondentName: letterInput.respondentName,
            respondentAddress: letterInput.respondentAddress || null,
            eventDate: letterInput.eventDate || null,
            amount: letterInput.amount || null,
            tone: letterInput.tone,
            goal: letterInput.goal,
            content: output.content,
            upsellMessage: output.upsellMessage,
            fileName: output.fileName,
            knowledgeVersion: output.knowledgeVersion,
            promptSnapshot: output.promptSnapshot,
            modelResponse: output.modelResponse,
            verified: output.verified,
          },
        },
      },
      include: { letter: true },
    });
    await tx.processingJob.update({
      where: { id: job.id },
      data: { leadId: lead.id },
    });
    return lead;
  });
}

async function recoverExistingResult(
  leadId: string,
  input: LetterGenerationJobInput
): Promise<LetterGenerationJobResult> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { letter: true },
  });
  if (!lead?.letter) throw new Error("Generated lead is incomplete");

  await finalizeGeneratedLead(leadId, lead.analyticsSessionId ?? "", input);
  return {
    leadId,
    letterId: lead.letter.id,
    content: lead.letter.content,
    upsellMessage: lead.letter.upsellMessage,
    fileName: lead.letter.fileName,
    letterInput: buildResultLetterInput(input),
  };
}

async function finalizeGeneratedLead(
  leadId: string,
  sessionId: string,
  input: LetterGenerationJobInput
): Promise<void> {
  await Promise.all([
    attachAiCallsToLead(input.workflowId, leadId),
    persistStoredEvidence(leadId, input.evidence),
    sessionId
      ? trackEventSafely({
          sessionId,
          leadId,
          type: "LETTER_GENERATED",
        })
      : Promise.resolve(),
  ]);
}

function buildResultLetterInput(
  input: LetterGenerationJobInput
): LetterInput {
  return {
    ...input.letterInput,
    evidence: input.evidence.map((file) => ({
      name: file.name,
      type: file.type,
      base64: "",
      description: file.description,
      storage: file,
    })),
  };
}

