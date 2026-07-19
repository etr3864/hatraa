import { after } from "next/server";
import type { ProcessingJob } from "@prisma/client";
import {
  inngest,
  PROCESS_JOB_EVENT,
} from "@/backend/inngest/client";
import { executeProcessingJob } from "./execute-job";
import { failJob, setJobQueueEvent } from "./repository";

export function scheduleProcessingJob(job: ProcessingJob): void {
  after(async () => {
    try {
      await executeProcessingJob(job.id);
    } catch (error) {
      console.error(
        "[jobs] local execution failed:",
        error instanceof Error ? error.message : error
      );
      await failJob(
        job.id,
        toHebrewError(error) ?? "העיבוד נכשל. אפשר לנסות שוב."
      );
    }
  });

  void enqueueInngest(job).catch((error) => {
    console.warn(
      "[jobs] Inngest enqueue skipped/failed:",
      error instanceof Error ? error.message : error
    );
  });
}

async function enqueueInngest(job: ProcessingJob): Promise<void> {
  if (!process.env.INNGEST_EVENT_KEY?.trim()) return;
  if (job.queueEventId || job.status === "SUCCEEDED") return;

  const result = await inngest.send({
    id: job.id,
    name: PROCESS_JOB_EVENT,
    data: { jobId: job.id },
  });
  await setJobQueueEvent(job.id, result.ids[0] ?? job.id);
}

function toHebrewError(error: unknown): string | null {
  const message = error instanceof Error ? error.message : String(error);
  return /[\u0590-\u05FF]/.test(message) ? message : null;
}
