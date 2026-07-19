import {
  ProcessingJobStatus,
  ProcessingJobType,
  type ProcessingJob,
} from "@prisma/client";
import { prisma } from "@/backend/services/db/prisma";
import { decryptJobPayload, encryptJobPayload } from "./payload";
import type {
  ProcessingJobInput,
  ProcessingJobResult,
} from "./types";

const JOB_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export async function createProcessingJob(input: {
  sessionId: string;
  leadId?: string;
  type: ProcessingJobType;
  idempotencyKey: string;
  payload: ProcessingJobInput;
}): Promise<ProcessingJob> {
  const key = `${input.sessionId}:${input.type}:${input.idempotencyKey}`;
  const existing = await prisma.processingJob.findUnique({
    where: { idempotencyKey: key },
  });
  if (existing) return existing;

  return prisma.processingJob.create({
    data: {
      sessionId: input.sessionId,
      leadId: input.leadId,
      type: input.type,
      idempotencyKey: key,
      encryptedInput: encryptJobPayload(input.payload),
      expiresAt: new Date(Date.now() + JOB_RETENTION_MS),
      progressStage: "ממתין בתור",
    },
  });
}

export async function setJobQueueEvent(
  jobId: string,
  queueEventId: string
): Promise<void> {
  await prisma.processingJob.update({
    where: { id: jobId },
    data: { queueEventId },
  });
}

const STALE_PROCESSING_MS = 3 * 60 * 1000;

export async function claimJobForProcessing(
  jobId: string
): Promise<ProcessingJob | null> {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - STALE_PROCESSING_MS);

  return prisma.$transaction(async (tx) => {
    const job = await tx.processingJob.findUnique({ where: { id: jobId } });
    if (!job || job.status === ProcessingJobStatus.SUCCEEDED) return null;

    if (
      job.status === ProcessingJobStatus.PROCESSING &&
      job.startedAt &&
      job.startedAt > staleBefore
    ) {
      return null;
    }

    return tx.processingJob.update({
      where: { id: jobId },
      data: {
        status: ProcessingJobStatus.PROCESSING,
        startedAt: now,
        attempts: { increment: 1 },
        progressStage: "מתחיל עיבוד",
        progress: 10,
        errorMessage: null,
      },
    });
  });
}

export async function markJobProcessing(
  jobId: string,
  stage: string,
  progress: number
): Promise<void> {
  await prisma.processingJob.update({
    where: { id: jobId },
    data: {
      status: ProcessingJobStatus.PROCESSING,
      startedAt: new Date(),
      attempts: { increment: 1 },
      progressStage: stage,
      progress,
      errorMessage: null,
    },
  });
}

export async function updateJobProgress(
  jobId: string,
  stage: string,
  progress: number
): Promise<void> {
  await prisma.processingJob.update({
    where: { id: jobId },
    data: { progressStage: stage, progress },
  });
}

export async function completeJob(
  jobId: string,
  result: ProcessingJobResult,
  leadId?: string
): Promise<void> {
  await prisma.processingJob.update({
    where: { id: jobId },
    data: {
      leadId,
      status: ProcessingJobStatus.SUCCEEDED,
      encryptedResult: encryptJobPayload(result),
      progressStage: "הושלם",
      progress: 100,
      completedAt: new Date(),
      errorMessage: null,
    },
  });
}

export async function failJob(
  jobId: string,
  errorMessage: string
): Promise<void> {
  await prisma.processingJob.updateMany({
    where: {
      id: jobId,
      status: { not: ProcessingJobStatus.SUCCEEDED },
    },
    data: {
      status: ProcessingJobStatus.FAILED,
      progressStage: "נכשל",
      errorMessage: errorMessage.slice(0, 500),
      completedAt: new Date(),
    },
  });
}

export async function getJobInput<T extends ProcessingJobInput>(
  jobId: string
): Promise<{ job: ProcessingJob; input: T }> {
  const job = await prisma.processingJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Job not found");
  return { job, input: decryptJobPayload<T>(job.encryptedInput) };
}

export async function getJobForSession(
  jobId: string,
  sessionId: string
) {
  const job = await prisma.processingJob.findFirst({
    where: { id: jobId, sessionId },
  });
  return job ? toPublicJob(job) : null;
}

export async function getLatestActiveJob(
  sessionId: string,
  type?: ProcessingJobType
) {
  const job = await prisma.processingJob.findFirst({
    where: {
      sessionId,
      type,
      status: {
        in: [ProcessingJobStatus.QUEUED, ProcessingJobStatus.PROCESSING],
      },
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  return job ? toPublicJob(job) : null;
}

export async function getLatestJob(
  sessionId: string,
  type?: ProcessingJobType
) {
  const job = await prisma.processingJob.findFirst({
    where: {
      sessionId,
      type,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  return job ? toPublicJob(job) : null;
}

function toPublicJob(job: ProcessingJob) {
  return {
    id: job.id,
    type: job.type,
    status: job.status,
    progress: job.progress,
    progressStage: job.progressStage,
    error: job.errorMessage,
    result:
      job.status === ProcessingJobStatus.SUCCEEDED && job.encryptedResult
        ? decryptJobPayload<ProcessingJobResult>(job.encryptedResult)
        : null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

