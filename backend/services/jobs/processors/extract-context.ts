import type { ProcessingJob } from "@prisma/client";
import { extractContext } from "@/backend/services/ai/extract";
import type { ExtractionJobInput } from "../types";
import {
  loadStoredAudio,
  loadStoredEvidence,
} from "../stored-files";

export async function processExtraction(
  job: ProcessingJob,
  input: ExtractionJobInput,
  onProgress: (stage: string, progress: number) => Promise<void>
) {
  await onProgress("טוען קבצים", 20);
  const [audio, evidence] = await Promise.all([
    input.audio ? loadStoredAudio(input.audio) : undefined,
    loadStoredEvidence(input.evidence),
  ]);

  await onProgress(audio ? "מתמלל ומנתח" : "מנתח את הפרטים", 50);
  const source = audio ?? input.text ?? "";
  return extractContext(source, evidence, {
    sessionId: job.sessionId,
    workflowId: input.workflowId,
  });
}

