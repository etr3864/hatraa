import { inngest } from "./client";
import { cleanupExpiredJobs } from "@/backend/services/jobs/cleanup";

export const cleanupJobs = inngest.createFunction(
  {
    id: "cleanup-expired-jobs",
    name: "Cleanup expired jobs",
    triggers: [{ cron: "0 3 * * *" }],
    retries: 3,
  },
  async ({ step }) => {
    return step.run("cleanup-batch", cleanupExpiredJobs);
  }
);

