import { inngest, PROCESS_JOB_EVENT } from "./client";
import { executeProcessingJob } from "@/backend/services/jobs/execute-job";
import { failJob } from "@/backend/services/jobs/repository";

export const processJob = inngest.createFunction(
  {
    id: "process-background-job",
    name: "Process background job",
    triggers: [{ event: PROCESS_JOB_EVENT }],
    retries: 3,
    concurrency: { limit: 10 },
    singleton: {
      key: "event.data.jobId",
      mode: "skip",
    },
    onFailure: async ({ event, error }) => {
      const original = event.data.event as {
        data?: { jobId?: string };
      };
      const jobId = original.data?.jobId;
      if (jobId) {
        await failJob(jobId, toUserError(error));
      }
    },
  },
  async ({ event, step }) => {
    await step.run("execute-job", async () => {
      await executeProcessingJob(event.data.jobId as string);
      return { jobId: event.data.jobId };
    });
  }
);

function toUserError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return /[\u0590-\u05FF]/.test(message)
    ? message
    : "העיבוד נכשל לאחר מספר ניסיונות. אפשר לנסות שוב.";
}

