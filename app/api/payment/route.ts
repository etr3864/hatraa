import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/services/db/prisma";
import { resolveAnalyticsSessionId } from "@/backend/services/analytics/request-session";
import { trackEventSafely } from "@/backend/services/analytics/track-event";
import { SIGNATURE_PRICE } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { leadId: string };
    const { leadId } = body;

    if (!leadId || leadId === "no-db") {
      return NextResponse.json({ error: "נדרש leadId" }, { status: 400 });
    }

    const existing = await prisma.payment.findUnique({ where: { leadId } });
    const sessionId = await resolveAnalyticsSessionId(req, leadId);

    if (existing?.status === "completed" || existing?.status === "mock") {
      if (sessionId) {
        await trackEventSafely({
          sessionId,
          leadId,
          type: "PAYMENT_COMPLETED",
        });
      }
      return NextResponse.json({ success: true, alreadyPaid: true });
    }

    const payment = await prisma.payment.upsert({
      where: { leadId },
      create: {
        leadId,
        amount: SIGNATURE_PRICE,
        status: "mock",
        paidAt: new Date(),
      },
      update: {
        amount: SIGNATURE_PRICE,
        status: "mock",
        paidAt: new Date(),
      },
    });

    if (sessionId) {
      await trackEventSafely({
        sessionId,
        leadId,
        type: "PAYMENT_COMPLETED",
      });
    }

    return NextResponse.json({ success: true, paymentId: payment.id });
  } catch (err) {
    console.error("[payment]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "אירעה שגיאה, נסה שוב." }, { status: 500 });
  }
}
