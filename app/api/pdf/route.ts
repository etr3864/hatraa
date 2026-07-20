import { NextRequest, NextResponse } from "next/server";
import { renderPDF } from "@/backend/services/pdf/render";
import { resolveAnalyticsSessionId } from "@/backend/services/analytics/request-session";
import { trackEventSafely } from "@/backend/services/analytics/track-event";
import { prisma } from "@/backend/services/db/prisma";
import { checkRateLimit, getClientIp } from "@/backend/services/security/rate-limiter";
import { loadAttorneySignatureDataUrl } from "@/backend/services/pdf/attorney-signature";
import type { LetterInput } from "@/lib/types";

export const maxDuration = 60;

const PAID_STATUSES = new Set(["completed", "mock"]);

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rate = await checkRateLimit(ip);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "הגעת למגבלה היומית, נסה שוב מחר." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as {
      leadId: string;
      withSignature: boolean;
      letterInput: LetterInput;
      content: string;
      fileName: string;
    };

    const { leadId, withSignature: requestedSignature, letterInput, content, fileName } = body;

    let allowSignature = false;
    if (requestedSignature && leadId && leadId !== "no-db") {
      try {
        const payment = await prisma.payment.findUnique({ where: { leadId } });
        allowSignature = !!payment && PAID_STATUSES.has(payment.status);
      } catch (dbErr) {
        console.error("[pdf] payment check failed:", dbErr);
        allowSignature = false;
      }
    }

    let signatureDataUrl: string | undefined;
    if (allowSignature) {
      signatureDataUrl = await loadAttorneySignatureDataUrl();
    }

    let evidence: {
      label: string;
      fileName: string;
      mimeType: string;
      r2Key: string;
      description: string | null;
    }[] = [];

    if (leadId && leadId !== "no-db") {
      try {
        const rows = await prisma.evidence.findMany({
          where: { leadId },
          orderBy: { sortOrder: "asc" },
        });
        evidence = rows.map((r) => ({
          label: r.label,
          fileName: r.fileName,
          mimeType: r.mimeType,
          r2Key: r.r2Key,
          description: r.description,
        }));
      } catch (dbErr) {
        console.error("[pdf] evidence load failed:", dbErr);
      }
    }

    const pdfBuffer = await renderPDF({
      letterInput,
      content,
      withSignature: allowSignature,
      attorneyVerified: allowSignature,
      signatureDataUrl,
      evidence,
    });

    if (leadId && leadId !== "no-db") {
      try {
        await prisma.letter.updateMany({
          where: { leadId },
          data: { fileName },
        });
      } catch (dbErr) {
        console.error("[pdf] DB update failed:", dbErr);
      }
    }

    const sessionId = await resolveAnalyticsSessionId(req, leadId);
    if (sessionId && leadId && leadId !== "no-db") {
      await trackEventSafely({
        sessionId,
        leadId,
        type: "PDF_DOWNLOADED",
        metadata: { withSignature: allowSignature },
      });
    }

    const encodedFileName = encodeURIComponent(`${fileName}.pdf`);

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedFileName}`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (err) {
    console.error("[pdf] Error:", err instanceof Error ? err.stack || err.message : err);
    return NextResponse.json({ error: "שגיאה בייצור PDF" }, { status: 500 });
  }
}
