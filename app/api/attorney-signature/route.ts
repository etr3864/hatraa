import { NextRequest, NextResponse } from "next/server";
import { loadAttorneySignatureDataUrl } from "@/backend/services/pdf/attorney-signature";
import { prisma } from "@/backend/services/db/prisma";
import { getAnalyticsSessionId } from "@/backend/services/analytics/request-session";
import {
  checkRateLimit,
  getClientIp,
} from "@/backend/services/security/rate-limiter";

const PAID_STATUSES = new Set(["completed", "mock"]);

export async function GET(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rate = await checkRateLimit(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "הגעת למגבלה היומית, נסה שוב מחר." },
      { status: 429 }
    );
  }

  const leadId = request.nextUrl.searchParams.get("leadId")?.trim();
  if (!leadId || leadId === "no-db") {
    return NextResponse.json({ error: "נדרש leadId" }, { status: 400 });
  }

  const sessionId = getAnalyticsSessionId(request);
  if (!sessionId) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, analyticsSessionId: sessionId },
    select: { id: true },
  });
  if (!lead) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const payment = await prisma.payment.findUnique({ where: { leadId } });
  if (!payment || !PAID_STATUSES.has(payment.status)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const signatureDataUrl = await loadAttorneySignatureDataUrl();
  if (!signatureDataUrl) {
    return NextResponse.json({ error: "חתימה לא זמינה" }, { status: 404 });
  }

  return NextResponse.json(
    { signatureDataUrl },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}
