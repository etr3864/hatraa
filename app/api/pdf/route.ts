import { NextRequest, NextResponse } from "next/server";
import { renderPDF } from "@/backend/services/pdf/render";
import { getAnalyticsSessionId } from "@/backend/services/analytics/request-session";
import { trackEventSafely } from "@/backend/services/analytics/track-event";
import { prisma } from "@/backend/services/db/prisma";
import { checkRateLimit, getClientIp } from "@/backend/services/security/rate-limiter";
import {
  assertLeadSessionAccess,
  LeadAccessError,
} from "@/backend/services/security/lead-access";
import { loadAttorneySignatureDataUrl } from "@/backend/services/pdf/attorney-signature";
import { letterHasAttorneyRewrite } from "@/backend/services/payment/fulfillment";
import { isPaidPaymentStatus } from "@/backend/services/payment";
import {
  getEvidenceBuffer,
  isR2Configured,
} from "@/backend/services/storage/r2";
import type { LetterInput } from "@/lib/types";

export const maxDuration = 60;

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

    const { leadId, withSignature: requestedSignature, letterInput, fileName } =
      body;

    if (!leadId || leadId === "no-db") {
      return NextResponse.json({ error: "נדרש leadId" }, { status: 400 });
    }

    const sessionId = getAnalyticsSessionId(req);
    await assertLeadSessionAccess(leadId, sessionId);

    const [payment, letter] = await Promise.all([
      prisma.payment.findUnique({ where: { leadId } }),
      prisma.letter.findUnique({ where: { leadId } }),
    ]);

    if (!letter) {
      return NextResponse.json({ error: "מכתב לא נמצא" }, { status: 404 });
    }

    const paid = isPaidPaymentStatus(payment?.status);
    const rewritten =
      letter.attorneyVerified || letterHasAttorneyRewrite(letter);
    const allowSignature = Boolean(requestedSignature && paid && rewritten);

    if (requestedSignature && !allowSignature) {
      return NextResponse.json(
        { error: "חתימת עו״ד זמינה רק אחרי תשלום וניסוח מאושר" },
        { status: 403 }
      );
    }

    const pdfContent = allowSignature
      ? letter.content
      : letter.draftContent?.trim() || letter.content;

    const resolvedFileName = fileName || letter.fileName || "מכתב_התראה";

    if (isR2Configured()) {
      const cachedKey = allowSignature
        ? letter.signedPdfR2Key
        : letter.draftPdfR2Key;
      if (cachedKey) {
        try {
          const { buffer } = await getEvidenceBuffer(cachedKey);
          if (sessionId) {
            await trackEventSafely({
              sessionId,
              leadId,
              type: "PDF_DOWNLOADED",
              metadata: { withSignature: allowSignature, source: "r2" },
            });
          }
          return pdfResponse(buffer, resolvedFileName);
        } catch (err) {
          console.error(
            "[pdf] r2 cache miss:",
            err instanceof Error ? err.message : err
          );
        }
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

    const pdfBuffer = await renderPDF({
      letterInput,
      content: pdfContent,
      withSignature: allowSignature,
      attorneyVerified: allowSignature,
      signatureDataUrl,
      evidence,
    });

    try {
      await prisma.letter.updateMany({
        where: { leadId },
        data: { fileName: resolvedFileName },
      });
    } catch (dbErr) {
      console.error("[pdf] DB update failed:", dbErr);
    }

    if (sessionId) {
      await trackEventSafely({
        sessionId,
        leadId,
        type: "PDF_DOWNLOADED",
        metadata: { withSignature: allowSignature, source: "render" },
      });
    }

    return pdfResponse(pdfBuffer, resolvedFileName);
  } catch (err) {
    if (err instanceof LeadAccessError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error("[pdf] Error:", err instanceof Error ? err.stack || err.message : err);
    return NextResponse.json({ error: "שגיאה בייצור PDF" }, { status: 500 });
  }
}

function pdfResponse(pdfBuffer: Buffer, fileName: string) {
  const encodedFileName = encodeURIComponent(`${fileName}.pdf`);
  return new NextResponse(pdfBuffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodedFileName}`,
      "Content-Length": String(pdfBuffer.length),
    },
  });
}
