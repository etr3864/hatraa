import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/backend/services/db/prisma";
import { rewriteAsAttorney } from "@/backend/services/ai/rewrite-as-attorney";
import { checkRateLimit, getClientIp } from "@/backend/services/security/rate-limiter";
import type { LetterInput } from "@/lib/types";

export const maxDuration = 60;

const PAID_STATUSES = new Set(["completed", "mock"]);

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rate = checkRateLimit(ip);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "הגעת למגבלה היומית, נסה שוב מחר." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as {
      leadId: string;
      content: string;
      letterInput: LetterInput;
    };

    const { leadId, content, letterInput } = body;

    if (!leadId || leadId === "no-db") {
      return NextResponse.json({ error: "נדרש leadId" }, { status: 400 });
    }
    if (!content?.trim() || !letterInput?.senderName || !letterInput?.category) {
      return NextResponse.json({ error: "חסרים פרטי מכתב" }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({ where: { leadId } });
    if (!payment || !PAID_STATUSES.has(payment.status)) {
      return NextResponse.json(
        { error: "נדרש תשלום לפני ניסוח בשם עו\"ד" },
        { status: 403 }
      );
    }

    const result = await rewriteAsAttorney(content, letterInput);

    try {
      const existing = await prisma.letter.findUnique({
        where: { leadId },
        select: { modelResponse: true },
      });
      if (existing) {
        const prev = existing.modelResponse ?? "";
        await prisma.letter.update({
          where: { leadId },
          data: {
            content: result.content,
            verified: result.verified,
            modelResponse: `${prev}\n\n===ATTORNEY_REWRITE===\nverified=${result.verified}`,
          },
        });
      }
    } catch (dbErr) {
      console.error("[attorney-rewrite] DB:", dbErr instanceof Error ? dbErr.message : dbErr);
    }

    return NextResponse.json({
      content: result.content,
      verified: result.verified,
      attorneyVerified: true,
    });
  } catch (err) {
    console.error(
      "[attorney-rewrite]",
      err instanceof Error ? err.stack || err.message : err
    );
    return NextResponse.json(
      { error: "שגיאה בניסוח המכתב בשם עו\"ד" },
      { status: 500 }
    );
  }
}
