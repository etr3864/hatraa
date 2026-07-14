import { NextRequest, NextResponse } from "next/server";
import { extractContext } from "@/backend/services/ai/extract";
import { checkRateLimit, getClientIp } from "@/backend/services/security/rate-limiter";
import { sanitizeInput } from "@/backend/services/security/sanitize";
import type { EvidenceFile } from "@/lib/types";

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

    const body = await req.json();
    const { text, audio, mimeType, evidence } = body as {
      text?: string;
      audio?: string;
      mimeType?: string;
      evidence?: EvidenceFile[];
    };

    if (!text && !audio) {
      return NextResponse.json({ error: "נדרש טקסט או הקלטה" }, { status: 400 });
    }

    const sanitizedEvidence = evidence?.map((e) => ({
      ...e,
      name: sanitizeInput(e.name),
      description: e.description ? sanitizeInput(e.description) : undefined,
    }));

    const input =
      audio && mimeType
        ? { base64: audio, mimeType }
        : sanitizeInput(text as string);

    const extracted = await extractContext(input, sanitizedEvidence);

    return NextResponse.json(extracted);
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה בחילוץ הפרטים";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
