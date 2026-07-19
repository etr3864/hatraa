import { ProcessingJobType, type ProcessingJob } from "@prisma/client";
import { decryptJobPayload } from "./payload";
import {
  claimJobForProcessing,
  completeJob,
  getJobInput,
  updateJobProgress,
} from "./repository";
import type {
  AttorneyRewriteJobInput,
  ExtractionJobInput,
  LetterGenerationJobInput,
  ProcessingJobResult,
} from "./types";
import { processExtraction } from "./processors/extract-context";
import { processLetterGeneration } from "./processors/generate-letter";
import { processAttorneyRewrite } from "./processors/rewrite-attorney";

export async function executeProcessingJob(jobId: string): Promise<void> {
  const claimed = await claimJobForProcessing(jobId);
  if (!claimed) return;

  const { job, input } = await getJobInput(jobId);

  if (job.encryptedResult) {
    const result = decryptJobPayload<ProcessingJobResult>(job.encryptedResult);
    await completeJob(job.id, result, job.leadId ?? undefined);
    return;
  }

  const onProgress = (stage: string, progress: number) =>
    updateJobProgress(job.id, stage, progress);

  const result = await runProcessor(job.type, claimed, input, onProgress);
  const leadId =
    "leadId" in result && typeof result.leadId === "string"
      ? result.leadId
      : claimed.leadId ?? undefined;
  await completeJob(job.id, result, leadId);
}

async function runProcessor(
  type: ProcessingJobType,
  job: ProcessingJob,
  input: Awaited<ReturnType<typeof getJobInput>>["input"],
  onProgress: (stage: string, progress: number) => Promise<void>
): Promise<ProcessingJobResult> {
  switch (type) {
    case ProcessingJobType.EXTRACTION:
      return processExtraction(job, input as ExtractionJobInput, onProgress);
    case ProcessingJobType.LETTER_GENERATION:
      return processLetterGeneration(
        job,
        input as LetterGenerationJobInput,
        onProgress
      );
    case ProcessingJobType.ATTORNEY_REWRITE:
      return processAttorneyRewrite(
        job,
        input as AttorneyRewriteJobInput,
        onProgress
      );
  }
}
