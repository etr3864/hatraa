import { NextRequest, NextResponse } from "next/server";
import { extractContext } from "@/backend/services/ai/extract";
import type { EvidenceFile } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, audio, mimeType, evidence } = body as {
      text?: string;
      audio?: string;
      mimeType?: string;
      evidence?: EvidenceFile[];
    };

    if (!text && !audio) {
      return NextResponse.json(
        { error: "נדרש טקסט או הקלטה" },
        { status: 400 }
      );
    }

    const input =
      audio && mimeType ? { base64: audio, mimeType } : (text as string);

    const extracted = await extractContext(input, evidence);

    return NextResponse.json(extracted);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "שגיאה בחילוץ הפרטים";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
