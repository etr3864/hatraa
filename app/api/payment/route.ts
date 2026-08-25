import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/services/db/prisma";
import { getAnalyticsSessionId } from "@/backend/services/analytics/request-session";
import { startCheckout } from "@/backend/services/payment/checkout";
import { logExternalError } from "@/backend/services/logging/external-error";
import { decryptLeadPii } from "@/backend/services/security/encryption";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { leadId?: string };
    const leadId = body.leadId?.trim();

    if (!leadId || leadId === "no-db") {
      return NextResponse.json({ error: "נדרש leadId" }, { status: 400 });
    }

    const sessionId = getAnalyticsSessionId(req);
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        analyticsSessionId: true,
      },
    });
    if (!lead) {
      return NextResponse.json({ error: "הליד לא נמצא" }, { status: 404 });
    }
    if (!sessionId || lead.analyticsSessionId !== sessionId) {
      return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
    }

    const customer = decryptLeadPii({
      name: lead.name,
      address: "",
      phone: lead.phone,
      email: lead.email,
    });
    const result = await startCheckout({
      leadId,
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    logExternalError("payment:start", err);
    const message = err instanceof Error ? err.message : "";
    const isConfigError = /is not set|Unsupported PAYMENT_PROVIDER/.test(message);
    return NextResponse.json(
      {
        error: isConfigError
          ? "סליקה אינה מוגדרת כרגע."
          : "לא הצלחנו לפתוח דף תשלום. נסה שוב.",
      },
      { status: 500 }
    );
  }
}
