import { prisma } from "@/backend/services/db/prisma";
import {
  deleteEvidenceObjects,
  isR2Configured,
  listTemporaryJobObjects,
} from "@/backend/services/storage/r2";
import { decryptJobPayload } from "./payload";
import type { StoredFileReference } from "@/lib/types";

const CLEANUP_BATCH_SIZE = 500;
const ORPHAN_MAX_AGE_MS = 48 * 60 * 60 * 1000;

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
  await deleteOrphanTemporaryUploads();
  return deleted.count;
}

export async function deleteOrphanTemporaryUploads(): Promise<number> {
  if (!isR2Configured()) return 0;
  const cutoff = Date.now() - ORPHAN_MAX_AGE_MS;
  const listed = await listTemporaryJobObjects();
  const oldKeys = listed
    .filter((item) => (item.lastModified?.getTime() ?? 0) < cutoff)
    .map((item) => item.key);
  if (oldKeys.length === 0) return 0;

  const [permanent, liveJobs] = await Promise.all([
    prisma.evidence.findMany({
      where: { r2Key: { in: oldKeys } },
      select: { r2Key: true },
    }),
    prisma.processingJob.findMany({
      where: { expiresAt: { gt: new Date() } },
      select: { encryptedInput: true },
    }),
  ]);

  const keep = new Set(permanent.map((item) => item.r2Key));
  for (const job of liveJobs) {
    for (const key of extractStorageKeys(job.encryptedInput)) {
      keep.add(key);
    }
  }

  const doomed = oldKeys.filter((key) => !keep.has(key));
  await deleteEvidenceObjects(doomed);
  return doomed.length;
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

