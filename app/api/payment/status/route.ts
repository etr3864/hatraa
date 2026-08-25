import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/services/db/prisma";
import { getAnalyticsSessionId } from "@/backend/services/analytics/request-session";
import { getPaymentStatusForLead } from "@/backend/services/payment/checkout";

export async function GET(req: NextRequest) {
  const leadId = req.nextUrl.searchParams.get("leadId")?.trim();
  if (!leadId) {
    return NextResponse.json({ error: "נדרש leadId" }, { status: 400 });
  }

  const sessionId = getAnalyticsSessionId(req);
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { analyticsSessionId: true },
  });
  if (!lead) {
    return NextResponse.json({ error: "הליד לא נמצא" }, { status: 404 });
  }
  if (!sessionId || lead.analyticsSessionId !== sessionId) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const status = await getPaymentStatusForLead(leadId);
  return NextResponse.json({
    status: status.status,
    rewriteReady: status.rewriteReady,
    content: status.content,
  });
}
