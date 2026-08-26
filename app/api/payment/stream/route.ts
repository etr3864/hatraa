import { NextRequest } from "next/server";
import { getAnalyticsSessionId } from "@/backend/services/analytics/request-session";
import {
  ensurePaidAttorneyRewrite,
  getPaymentFulfillmentStatus,
} from "@/backend/services/payment/fulfillment";
import {
  fulfillmentToStreamEvent,
  isTerminalStreamEvent,
  PAYMENT_STREAM_INTERVAL_MS,
  PAYMENT_STREAM_TIMEOUT_MS,
  streamEventKey,
  type PaymentStreamEvent,
} from "@/backend/services/payment/stream-events";
import {
  assertLeadSessionAccess,
  LeadAccessError,
} from "@/backend/services/security/lead-access";
import { checkRateLimit, getClientIp } from "@/backend/services/security/rate-limiter";
import { PAYMENT_STREAM_LIMIT_PER_DAY } from "@/lib/constants";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const leadId = req.nextUrl.searchParams.get("leadId")?.trim();
  if (!leadId) {
    return new Response("leadId required", { status: 400 });
  }

  const ip = getClientIp(req.headers);
  const rate = await checkRateLimit(
    `payment-stream:${ip}:${leadId}`,
    PAYMENT_STREAM_LIMIT_PER_DAY
  );
  if (!rate.allowed) {
    return new Response("rate limit exceeded", { status: 429 });
  }

  const sessionId = getAnalyticsSessionId(req);
  try {
    await assertLeadSessionAccess(leadId, sessionId);
  } catch (error) {
    if (error instanceof LeadAccessError) {
      return new Response("forbidden", { status: 403 });
    }
    throw error;
  }

  const encoder = new TextEncoder();
  let lastKey = "";
  const startedAt = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: PaymentStreamEvent) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      };

      try {
        while (Date.now() - startedAt < PAYMENT_STREAM_TIMEOUT_MS) {
          const status = await getPaymentFulfillmentStatus(leadId);

          if (
            status.phase === "paid_pending_rewrite" ||
            status.phase === "rewrite_queued"
          ) {
            await ensurePaidAttorneyRewrite(leadId);
          }

          const event = fulfillmentToStreamEvent(status);
          const key = streamEventKey(event);
          if (key !== lastKey) {
            lastKey = key;
            send(event);
          }

          if (isTerminalStreamEvent(event.type)) {
            controller.close();
            return;
          }

          await sleep(PAYMENT_STREAM_INTERVAL_MS);
        }

        send({ type: "timeout", phase: "rewrite_processing" });
        controller.close();
      } catch {
        send({
          type: "error",
          phase: "rewrite_processing",
          rewriteError: "שגיאה בבדיקת סטטוס התשלום",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
