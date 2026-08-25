import { NextRequest, NextResponse } from "next/server";
import { resolveAnalyticsSessionId } from "@/backend/services/analytics/request-session";
import { trackEventSafely } from "@/backend/services/analytics/track-event";
import { logExternalError } from "@/backend/services/logging/external-error";
import {
  applyVerifiedWebhook,
  schedulePaidAttorneyRewrite,
} from "@/backend/services/payment/checkout";
import { resolvePaymentProvider } from "@/backend/services/payment";
import { WebhookAuthError } from "@/backend/services/payment/providers/payplus/client";

export async function GET(req: NextRequest) {
  return handleWebhook(req);
}

export async function POST(req: NextRequest) {
  return handleWebhook(req);
}

async function handleWebhook(req: NextRequest) {
  try {
    const provider = resolvePaymentProvider();
    const parsed = await provider.verifyAndParseWebhook(req);
    const applied = await applyVerifiedWebhook(parsed);

    if (parsed.status === "completed") {
      const sessionId = await resolveAnalyticsSessionId(req, parsed.leadId);
      if (sessionId && !applied.alreadyProcessed) {
        await trackEventSafely({
          sessionId,
          leadId: parsed.leadId,
          type: "PAYMENT_COMPLETED",
        });
      }
      await schedulePaidAttorneyRewrite(parsed.leadId);
    }

    if (parsed.status === "failed" && !applied.alreadyProcessed) {
      const sessionId = await resolveAnalyticsSessionId(req, parsed.leadId);
      if (sessionId) {
        await trackEventSafely({
          sessionId,
          leadId: parsed.leadId,
          type: "PAYMENT_FAILED",
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof WebhookAuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    logExternalError("payment:webhook", err);
    const message = err instanceof Error ? err.message : "";
    const isClientError = /ליד|עסקת תשלום|סכום/.test(message);
    return NextResponse.json(
      { error: isClientError ? message : "webhook failed" },
      { status: isClientError ? 400 : 500 }
    );
  }
}
