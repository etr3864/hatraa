-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'payplus';
ALTER TABLE "Payment" ADD COLUMN "externalRequestUid" TEXT;
ALTER TABLE "Payment" ADD COLUMN "externalTransactionUid" TEXT;
ALTER TABLE "Payment" ADD COLUMN "failureReason" TEXT;

-- CreateIndex
CREATE INDEX "Payment_externalRequestUid_idx" ON "Payment"("externalRequestUid");

-- AlterEnum
ALTER TYPE "AnalyticsEventType" ADD VALUE 'PAYMENT_FAILED';
