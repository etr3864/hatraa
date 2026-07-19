import type { ProcessingJob } from "@prisma/client";
import {
  inngest,
  PROCESS_JOB_EVENT,
} from "@/backend/inngest/client";
import { failJob, setJobQueueEvent } from "./repository";

export async function dispatchProcessingJob(
  job: ProcessingJob
): Promise<void> {
  if (job.queueEventId || job.status === "SUCCEEDED") return;

  try {
    const result = await inngest.send({
      id: job.id,
      name: PROCESS_JOB_EVENT,
      data: { jobId: job.id },
    });
    await setJobQueueEvent(job.id, result.ids[0] ?? job.id);
  } catch (error) {
    await failJob(job.id, "לא הצלחנו להכניס את המשימה לתור. נסה שוב.");
    throw error;
  }
}

