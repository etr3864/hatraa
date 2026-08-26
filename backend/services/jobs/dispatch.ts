import { after } from "next/server";
import type { ProcessingJob } from "@prisma/client";
import {
  inngest,
  PROCESS_JOB_EVENT,
} from "@/backend/inngest/client";
import { logExternalError } from "@/backend/services/logging/external-error";
import { getServerPublicBaseUrl } from "@/backend/services/payment/server-base-url";
import { executeProcessingJob } from "./execute-job";
import { failJob, setJobQueueEvent } from "./repository";

export type JobDispatchStrategy = "interactive" | "background";

interface ScheduleOptions {
  /** interactive: after()+Inngest (wizard). background: queue only (webhook). */
  strategy?: JobDispatchStrategy;
}

export function scheduleProcessingJob(
  job: ProcessingJob,
  options: ScheduleOptions = {}
): void {
  const strategy = options.strategy ?? "interactive";

  if (strategy === "interactive") {
    after(async () => {
      await runJobSafely(job);
    });
  }

  void dispatchBackgroundJob(job, strategy).catch((error) => {
    logExternalError("jobs:dispatch", error, { jobId: job.id, strategy });
  });
}

async function dispatchBackgroundJob(
  job: ProcessingJob,
  strategy: JobDispatchStrategy
): Promise<void> {
  const hasInngest = Boolean(process.env.INNGEST_EVENT_KEY?.trim());
  if (hasInngest) {
    await enqueueInngest(job);
    return;
  }

  if (strategy === "background") {
    await wakeJobExecution(job.id);
    return;
  }

  // interactive without Inngest: after() already handles execution
}

async function wakeJobExecution(jobId: string): Promise<void> {
  const secret = process.env.ADMIN_SECRET?.trim();
  let baseUrl: string;
  try {
    baseUrl = getServerPublicBaseUrl();
  } catch (error) {
    logExternalError("jobs:wake", error, { jobId });
    return;
  }
  if (!secret) {
    logExternalError("jobs:wake", new Error("ADMIN_SECRET is not set"), {
      jobId,
    });
    return;
  }

  const response = await fetch(`${baseUrl}/api/jobs/${jobId}/execute`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!response.ok) {
    logExternalError(
      "jobs:wake",
      new Error(`Job wake failed with status ${response.status}`),
      { jobId }
    );
  }
}

async function runJobSafely(job: ProcessingJob): Promise<void> {
  try {
    await executeProcessingJob(job.id);
  } catch (error) {
    logExternalError("jobs", error, {
      jobId: job.id,
      type: job.type,
      userMessage: toHebrewError(error),
    });
    await failJob(
      job.id,
      toHebrewError(error) ?? "העיבוד נכשל. אפשר לנסות שוב."
    );
  }
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
