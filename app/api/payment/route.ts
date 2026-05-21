import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/services/db/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { leadId: string };
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json({ error: "נדרש leadId" }, { status: 400 });
    }

    const existing = await prisma.payment.findUnique({ where: { leadId } });

    if (existing?.status === "completed") {
      return NextResponse.json({ success: true, alreadyPaid: true });
    }

    const payment = await prisma.payment.upsert({
      where: { leadId },
      create: {
        leadId,
        amount: 50,
        status: "mock",
        paidAt: new Date(),
      },
      update: {
        status: "mock",
        paidAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, paymentId: payment.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה בעיבוד התשלום";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
