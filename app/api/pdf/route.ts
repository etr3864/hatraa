import { NextRequest, NextResponse } from "next/server";
import { renderPDF } from "@/backend/services/pdf/render";
import { prisma } from "@/backend/services/db/prisma";
import type { LetterInput } from "@/lib/types";
import fs from "fs";
import path from "path";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      leadId: string;
      withSignature: boolean;
      letterInput: LetterInput;
      content: string;
      fileName: string;
    };

    const { leadId, withSignature, letterInput, content, fileName } = body;

    let signatureDataUrl: string | undefined;
    if (withSignature) {
      signatureDataUrl = await loadSignatureDataUrl();
    }

    const pdfBuffer = await renderPDF({
      letterInput,
      content,
      withSignature,
      signatureDataUrl,
    });

    if (leadId) {
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
    const message = err instanceof Error ? err.message : "שגיאה בייצור PDF";
    return NextResponse.json({ error: message }, { status: 500 });
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
