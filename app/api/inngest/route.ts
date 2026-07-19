import { serve } from "inngest/next";
import { inngest } from "@/backend/inngest/client";
import { processJob } from "@/backend/inngest/process-job";
import { cleanupJobs } from "@/backend/inngest/cleanup-jobs";

export const maxDuration = 300;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processJob, cleanupJobs],
});

