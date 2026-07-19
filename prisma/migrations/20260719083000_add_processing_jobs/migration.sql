CREATE TYPE "ProcessingJobType" AS ENUM (
  'EXTRACTION',
  'LETTER_GENERATION',
  'ATTORNEY_REWRITE'
);

CREATE TYPE "ProcessingJobStatus" AS ENUM (
  'QUEUED',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED'
);

CREATE TABLE "ProcessingJob" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "leadId" TEXT,
  "type" "ProcessingJobType" NOT NULL,
  "status" "ProcessingJobStatus" NOT NULL DEFAULT 'QUEUED',
  "idempotencyKey" TEXT NOT NULL,
  "encryptedInput" TEXT NOT NULL,
  "encryptedResult" TEXT,
  "progressStage" TEXT,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "errorMessage" TEXT,
  "queueEventId" TEXT,
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProcessingJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProcessingJob_idempotencyKey_key"
  ON "ProcessingJob"("idempotencyKey");
CREATE UNIQUE INDEX "Evidence_r2Key_key" ON "Evidence"("r2Key");
CREATE INDEX "ProcessingJob_sessionId_status_idx"
  ON "ProcessingJob"("sessionId", "status");
CREATE INDEX "ProcessingJob_status_createdAt_idx"
  ON "ProcessingJob"("status", "createdAt");
CREATE INDEX "ProcessingJob_leadId_type_idx"
  ON "ProcessingJob"("leadId", "type");
CREATE INDEX "ProcessingJob_expiresAt_idx"
  ON "ProcessingJob"("expiresAt");

ALTER TABLE "ProcessingJob"
  ADD CONSTRAINT "ProcessingJob_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "AnalyticsSession"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProcessingJob"
  ADD CONSTRAINT "ProcessingJob_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
