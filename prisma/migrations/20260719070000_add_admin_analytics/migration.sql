CREATE TYPE "AnalyticsEventType" AS ENUM (
  'SITE_VISIT',
  'WIZARD_STARTED',
  'EXTRACTION_COMPLETED',
  'DETAILS_COMPLETED',
  'LETTER_GENERATED',
  'PAYMENT_STARTED',
  'PAYMENT_COMPLETED',
  'ATTORNEY_REWRITE_COMPLETED',
  'PDF_DOWNLOADED'
);

CREATE TYPE "AiProvider" AS ENUM ('GOOGLE', 'ANTHROPIC');

CREATE TYPE "AiOperation" AS ENUM (
  'TRANSCRIPTION',
  'EXTRACTION',
  'LETTER_GENERATION',
  'CITATION_RETRY',
  'GUARDRAIL_RETRY',
  'ATTORNEY_REWRITE',
  'ATTORNEY_REWRITE_RETRY'
);

CREATE TYPE "AiCallStatus" AS ENUM ('SUCCEEDED', 'FAILED');

ALTER TABLE "Lead" ADD COLUMN "analyticsSessionId" TEXT;

CREATE TABLE "AnalyticsSession" (
  "id" TEXT NOT NULL,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deviceType" TEXT,
  "inputMode" TEXT,
  "hasEvidence" BOOLEAN,
  "senderType" TEXT,
  "category" TEXT,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "utmContent" TEXT,
  "utmTerm" TEXT,
  CONSTRAINT "AnalyticsSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnalyticsEvent" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "leadId" TEXT,
  "type" "AnalyticsEventType" NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "metadata" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiCallLog" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "workflowId" TEXT,
  "sessionId" TEXT,
  "leadId" TEXT,
  "provider" "AiProvider" NOT NULL,
  "model" TEXT NOT NULL,
  "operation" "AiOperation" NOT NULL,
  "status" "AiCallStatus" NOT NULL,
  "inputTokens" INTEGER NOT NULL DEFAULT 0,
  "outputTokens" INTEGER NOT NULL DEFAULT 0,
  "cachedInputTokens" INTEGER NOT NULL DEFAULT 0,
  "thinkingTokens" INTEGER NOT NULL DEFAULT 0,
  "inputUsdPerMillion" DECIMAL(12,6) NOT NULL,
  "outputUsdPerMillion" DECIMAL(12,6) NOT NULL,
  "usdIlsRate" DECIMAL(12,6) NOT NULL,
  "costUsd" DECIMAL(18,8) NOT NULL,
  "costIls" DECIMAL(18,8) NOT NULL,
  "latencyMs" INTEGER,
  "errorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiCallLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiModelPrice" (
  "id" TEXT NOT NULL,
  "provider" "AiProvider" NOT NULL,
  "model" TEXT NOT NULL,
  "inputUsdPerMillion" DECIMAL(12,6) NOT NULL,
  "outputUsdPerMillion" DECIMAL(12,6) NOT NULL,
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiModelPrice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FxRate" (
  "id" TEXT NOT NULL,
  "rateDate" DATE NOT NULL,
  "usdIlsRate" DECIMAL(12,6) NOT NULL,
  "source" TEXT NOT NULL,
  "isManualOverride" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FxRate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AnalyticsEvent_idempotencyKey_key" ON "AnalyticsEvent"("idempotencyKey");
CREATE UNIQUE INDEX "AiCallLog_requestId_key" ON "AiCallLog"("requestId");
CREATE UNIQUE INDEX "AiModelPrice_provider_model_effectiveFrom_key" ON "AiModelPrice"("provider", "model", "effectiveFrom");
CREATE UNIQUE INDEX "FxRate_rateDate_source_key" ON "FxRate"("rateDate", "source");

CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");
CREATE INDEX "Lead_analyticsSessionId_idx" ON "Lead"("analyticsSessionId");
CREATE INDEX "Letter_category_createdAt_idx" ON "Letter"("category", "createdAt");
CREATE INDEX "Payment_status_paidAt_idx" ON "Payment"("status", "paidAt");
CREATE INDEX "AnalyticsSession_firstSeenAt_idx" ON "AnalyticsSession"("firstSeenAt");
CREATE INDEX "AnalyticsSession_category_firstSeenAt_idx" ON "AnalyticsSession"("category", "firstSeenAt");
CREATE INDEX "AnalyticsSession_deviceType_firstSeenAt_idx" ON "AnalyticsSession"("deviceType", "firstSeenAt");
CREATE INDEX "AnalyticsEvent_type_occurredAt_idx" ON "AnalyticsEvent"("type", "occurredAt");
CREATE INDEX "AnalyticsEvent_sessionId_type_idx" ON "AnalyticsEvent"("sessionId", "type");
CREATE INDEX "AnalyticsEvent_leadId_type_idx" ON "AnalyticsEvent"("leadId", "type");
CREATE INDEX "AnalyticsEvent_occurredAt_idx" ON "AnalyticsEvent"("occurredAt");
CREATE INDEX "AiCallLog_model_createdAt_idx" ON "AiCallLog"("model", "createdAt");
CREATE INDEX "AiCallLog_operation_createdAt_idx" ON "AiCallLog"("operation", "createdAt");
CREATE INDEX "AiCallLog_leadId_idx" ON "AiCallLog"("leadId");
CREATE INDEX "AiCallLog_workflowId_idx" ON "AiCallLog"("workflowId");
CREATE INDEX "AiCallLog_createdAt_idx" ON "AiCallLog"("createdAt");
CREATE INDEX "AiModelPrice_provider_model_effectiveFrom_idx" ON "AiModelPrice"("provider", "model", "effectiveFrom");
CREATE INDEX "FxRate_rateDate_isManualOverride_idx" ON "FxRate"("rateDate", "isManualOverride");

ALTER TABLE "Lead"
  ADD CONSTRAINT "Lead_analyticsSessionId_fkey"
  FOREIGN KEY ("analyticsSessionId") REFERENCES "AnalyticsSession"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AnalyticsEvent"
  ADD CONSTRAINT "AnalyticsEvent_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "AnalyticsSession"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AnalyticsEvent"
  ADD CONSTRAINT "AnalyticsEvent_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AiCallLog"
  ADD CONSTRAINT "AiCallLog_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "AnalyticsSession"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AiCallLog"
  ADD CONSTRAINT "AiCallLog_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "Lead"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "AiModelPrice" (
  "id", "provider", "model", "inputUsdPerMillion", "outputUsdPerMillion", "effectiveFrom"
) VALUES
  ('8c3cb7c1-a5af-4d58-a963-b25f7c16f4ea', 'GOOGLE', 'gemini-3.5-flash', 1.500000, 9.000000, '2026-05-19T00:00:00.000Z'),
  ('ac5115bd-d40d-43b9-9b34-b5f9cb3c8918', 'ANTHROPIC', 'claude-sonnet-5', 2.000000, 10.000000, '2026-06-30T00:00:00.000Z'),
  ('34b3cac4-f20b-40d7-8439-47c921dd278a', 'ANTHROPIC', 'claude-sonnet-5', 3.000000, 15.000000, '2026-09-01T00:00:00.000Z');
