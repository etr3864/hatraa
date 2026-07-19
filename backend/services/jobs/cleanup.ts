import { prisma } from "@/backend/services/db/prisma";
import { deleteEvidenceObjects } from "@/backend/services/storage/r2";
import { decryptJobPayload } from "./payload";
import type { StoredFileReference } from "@/lib/types";

const CLEANUP_BATCH_SIZE = 500;

export async function cleanupExpiredJobs(): Promise<number> {
  const jobs = await prisma.processingJob.findMany({
    where: { expiresAt: { lt: new Date() } },
    orderBy: { expiresAt: "asc" },
    take: CLEANUP_BATCH_SIZE,
  });
  if (jobs.length === 0) return 0;

  const candidateKeys = jobs.flatMap((job) =>
    extractStorageKeys(job.encryptedInput)
  );
  const permanent = await prisma.evidence.findMany({
    where: { r2Key: { in: candidateKeys } },
    select: { r2Key: true },
  });
  const permanentKeys = new Set(permanent.map((item) => item.r2Key));
  const temporaryKeys = candidateKeys.filter(
    (key) => !permanentKeys.has(key)
  );

  await deleteEvidenceObjects([...new Set(temporaryKeys)]);
  const deleted = await prisma.processingJob.deleteMany({
    where: { id: { in: jobs.map((job) => job.id) } },
  });
  return deleted.count;
}

function extractStorageKeys(encryptedInput: string): string[] {
  try {
    const input = decryptJobPayload<{
      audio?: StoredFileReference;
      evidence?: StoredFileReference[];
    }>(encryptedInput);
    return [
      ...(input.audio?.key ? [input.audio.key] : []),
      ...(input.evidence ?? []).map((file) => file.key),
    ].filter((key) => key.startsWith("jobs/"));
  } catch {
    return [];
  }
}

