import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/services/db/prisma";
import { getAnalyticsSessionId } from "@/backend/services/analytics/request-session";
import { ensurePaidAttorneyRewrite, getPaymentFulfillmentStatus } from "@/backend/services/payment/fulfillment";
import { isPaidPaymentStatus } from "@/backend/services/payment/types";
import {
  assertLeadSessionAccess,
  LeadAccessError,
} from "@/backend/services/security/lead-access";
import { checkRateLimit, getClientIp } from "@/backend/services/security/rate-limiter";
import { PAYMENT_RETRY_LIMIT_PER_DAY } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { leadId?: string };
    const leadId = body.leadId?.trim();
    if (!leadId) {
      return NextResponse.json({ error: "נדרש leadId" }, { status: 400 });
    }

    const ip = getClientIp(req.headers);
    const rate = await checkRateLimit(
      `payment-retry:${ip}:${leadId}`,
      PAYMENT_RETRY_LIMIT_PER_DAY
    );
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "יותר מדי ניסיונות. נסה שוב מאוחר יותר." },
        { status: 429 }
      );
    }

    const sessionId = getAnalyticsSessionId(req);
    await assertLeadSessionAccess(leadId, sessionId);

    const payment = await prisma.payment.findUnique({ where: { leadId } });
    if (!isPaidPaymentStatus(payment?.status)) {
      return NextResponse.json(
        { error: "התשלום טרם אושר. נסה שוב בעוד רגע." },
        { status: 409 }
      );
    }

    await ensurePaidAttorneyRewrite(leadId);
    const status = await getPaymentFulfillmentStatus(leadId);
    return NextResponse.json(status);
  } catch (error) {
    if (error instanceof LeadAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
