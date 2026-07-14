import { NextRequest, NextResponse } from "next/server";
import { renderPDF } from "@/backend/services/pdf/render";
import { prisma } from "@/backend/services/db/prisma";
import { checkRateLimit, getClientIp } from "@/backend/services/security/rate-limiter";
import type { LetterInput } from "@/lib/types";
import fs from "fs";
import path from "path";

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
      signatureDataUrl = await loadSignatureDataUrl();
    }

    const pdfBuffer = await renderPDF({
      letterInput,
      content,
      withSignature: allowSignature,
      signatureDataUrl,
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

async function loadSignatureDataUrl(): Promise<string | undefined> {
  try {
    const sigPath = path.join(process.cwd(), "public", "signature.png");
    if (fs.existsSync(sigPath)) {
      const buffer = fs.readFileSync(sigPath);
      return `data:image/png;base64,${buffer.toString("base64")}`;
    }
    return undefined;
  } catch {
    return undefined;
  }
}
