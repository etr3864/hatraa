import { prisma } from "@/backend/services/db/prisma";
import {
  PENDING_CHECKOUT_REUSE_MS,
  SIGNATURE_PRICE,
} from "@/lib/constants";
import { resolvePaymentProvider } from "./resolve-provider";
import {
  ensurePaidAttorneyRewrite,
  getPaymentFulfillmentStatus,
} from "./fulfillment";
import { isPaidPaymentStatus } from "./types";
import type { ParsedWebhook } from "./types";

export async function startCheckout(input: {
  leadId: string;
  customer?: { name?: string; email?: string; phone?: string };
}): Promise<{ checkoutUrl?: string; alreadyPaid: boolean }> {
  const existing = await prisma.payment.findUnique({
    where: { leadId: input.leadId },
  });
  if (existing && isPaidPaymentStatus(existing.status)) {
    return { alreadyPaid: true };
  }

  const reused = reusePendingCheckout(existing);
  if (reused) {
    return { checkoutUrl: reused, alreadyPaid: false };
  }

  await prisma.payment.upsert({
    where: { leadId: input.leadId },
    create: {
      leadId: input.leadId,
      amount: SIGNATURE_PRICE,
      status: "pending",
      provider: "payplus",
      failureReason: null,
    },
    update: {
      amount: SIGNATURE_PRICE,
      status: "pending",
      provider: "payplus",
      externalTransactionUid: null,
      failureReason: null,
      paidAt: null,
      checkoutUrl: null,
      checkoutIssuedAt: null,
    },
  });

  const provider = resolvePaymentProvider();
  const checkout = await provider.createCheckout({
    leadId: input.leadId,
    amountIls: SIGNATURE_PRICE,
    customer: input.customer,
  });

  const issuedAt = new Date();
  await prisma.payment.update({
    where: { leadId: input.leadId },
    data: {
      externalRequestUid: checkout.externalRequestId,
      checkoutUrl: checkout.checkoutUrl,
      checkoutIssuedAt: issuedAt,
    },
  });

  return { checkoutUrl: checkout.checkoutUrl, alreadyPaid: false };
}

function reusePendingCheckout(
  payment: {
    status: string;
    checkoutUrl: string | null;
    checkoutIssuedAt: Date | null;
    externalRequestUid: string | null;
  } | null
): string | null {
  if (!payment || payment.status !== "pending") return null;
  if (!payment.checkoutUrl || !payment.checkoutIssuedAt || !payment.externalRequestUid) {
    return null;
  }
  const ageMs = Date.now() - payment.checkoutIssuedAt.getTime();
  if (ageMs < 0 || ageMs > PENDING_CHECKOUT_REUSE_MS) return null;
  return payment.checkoutUrl;
}

export async function applyVerifiedWebhook(
  parsed: ParsedWebhook
): Promise<{ alreadyProcessed: boolean }> {
  if (
    parsed.status === "completed" &&
    Math.round(parsed.amountIls) !== SIGNATURE_PRICE
  ) {
    throw new Error("סכום העסקה אינו תואם");
  }

  const payment = await prisma.payment.findUnique({
    where: { leadId: parsed.leadId },
  });
  if (!payment) {
    throw new Error("לא נמצאה עסקת תשלום לליד");
  }

  assertMatchingPaymentRequest(parsed, payment);

  if (isPaidPaymentStatus(payment.status) && parsed.status === "completed") {
    return { alreadyProcessed: true };
  }

  if (parsed.status === "failed") {
    if (!isPaidPaymentStatus(payment.status)) {
      await prisma.payment.update({
        where: { leadId: parsed.leadId },
        data: {
          status: "failed",
          failureReason: parsed.failureReason?.slice(0, 500) ?? null,
          externalRequestUid:
            parsed.externalRequestId ?? payment.externalRequestUid,
          externalTransactionUid:
            parsed.externalTransactionId ?? payment.externalTransactionUid,
          checkoutUrl: null,
          checkoutIssuedAt: null,
        },
      });
    }
    return { alreadyProcessed: false };
  }

  await prisma.payment.update({
    where: { leadId: parsed.leadId },
    data: {
      status: "completed",
      amount: SIGNATURE_PRICE,
      paidAt: new Date(),
      failureReason: null,
      externalRequestUid: parsed.externalRequestId ?? payment.externalRequestUid,
      externalTransactionUid:
        parsed.externalTransactionId ?? payment.externalTransactionUid,
      checkoutUrl: null,
      checkoutIssuedAt: null,
    },
  });

  return { alreadyProcessed: false };
}

function assertMatchingPaymentRequest(
  parsed: ParsedWebhook,
  payment: { externalRequestUid: string | null }
): void {
  if (!parsed.externalRequestId || !payment.externalRequestUid) return;
  if (parsed.externalRequestId !== payment.externalRequestUid) {
    throw new Error("מזהה עסקת תשלום אינו תואם");
  }
}

export async function schedulePaidAttorneyRewrite(leadId: string): Promise<void> {
  await ensurePaidAttorneyRewrite(leadId);
}

export async function getPaymentStatusForLead(leadId: string) {
  const fulfillment = await getPaymentFulfillmentStatus(leadId);
  return {
    status: fulfillment.status,
    rewriteReady: fulfillment.rewriteReady,
    content: fulfillment.content,
    phase: fulfillment.phase,
    rewriteJobStatus: fulfillment.rewriteJobStatus,
    rewriteError: fulfillment.rewriteError,
    rewriteStage: fulfillment.rewriteStage,
  };
}
