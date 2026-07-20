import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { extractContext } from "@/backend/services/ai/extract";
import { getAnalyticsSessionId } from "@/backend/services/analytics/request-session";
import {
  ensureAnalyticsSession,
  trackEventSafely,
} from "@/backend/services/analytics/track-event";
import { checkRateLimit, getClientIp } from "@/backend/services/security/rate-limiter";
import { sanitizeInput } from "@/backend/services/security/sanitize";
import {
  isSupportedEvidenceMime,
  resolveEvidencePayload,
  mapEvidenceFormatError,
} from "@/lib/evidence-mime";
import type { EvidenceFile } from "@/lib/types";

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

    const sanitizedEvidence: EvidenceFile[] | undefined = evidence
      ? evidence.flatMap((e): EvidenceFile[] => {
          try {
            const prepared = resolveEvidencePayload(e.type, e.name, e.base64);
            if (!isSupportedEvidenceMime(prepared.type) || !prepared.base64) return [];
            return [
              {
                name: sanitizeInput(prepared.name),
                type: prepared.type,
                base64: prepared.base64,
                description: e.description ? sanitizeInput(e.description) : undefined,
              },
            ];
          } catch {
            return [];
          }
        })
      : undefined;

    const input =
      audio && mimeType
        ? { base64: audio, mimeType: mimeType.split(";")[0].trim() || mimeType }
        : sanitizeInput(text as string);

    const sessionId = getAnalyticsSessionId(req);
    const inputMode = audio ? "audio" : "text";
    if (sessionId) {
      await ensureAnalyticsSession(sessionId, {
        inputMode,
        hasEvidence: !!sanitizedEvidence?.length,
      });
    }

    const extracted = await extractContext(input, sanitizedEvidence, {
      sessionId,
      workflowId: randomUUID(),
    });

    if (sessionId) {
      await ensureAnalyticsSession(sessionId, {
        category: extracted.category,
      });
      await trackEventSafely({
        sessionId,
        type: "EXTRACTION_COMPLETED",
      });
    }

    return NextResponse.json(extracted);
  } catch (err) {
    return NextResponse.json({ error: mapEvidenceFormatError(err) }, { status: 500 });
  }
}
