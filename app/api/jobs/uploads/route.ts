import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { ANALYTICS_SESSION_COOKIE } from "@/backend/services/analytics/constants";
import { getAnalyticsSessionId } from "@/backend/services/analytics/request-session";
import { ensureAnalyticsSession } from "@/backend/services/analytics/track-event";
import {
  buildTemporaryJobKey,
  isR2Configured,
  uploadEvidenceObject,
} from "@/backend/services/storage/r2";
import {
  isSupportedEvidenceMime,
  normalizeEvidenceMime,
  shortenFileName,
} from "@/lib/evidence-mime";

export const maxDuration = 60;

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const AUDIO_MIMES = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
]);

export async function POST(request: NextRequest) {
  if (!isR2Configured()) {
    return NextResponse.json(
      { error: "אחסון הקבצים אינו מוגדר כרגע" },
      { status: 503 }
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "לא התקבל קובץ להעלאה" }, { status: 400 });
    }
    if (!validSize(file.size)) {
      return NextResponse.json(
        { error: "גודל הקובץ אינו תקין (מקסימום 10MB)" },
        { status: 400 }
      );
    }

    const name = shortenFileName(file.name || "upload.bin", 120);
    const type = normalizeUploadMime(file.type, name);
    if (!type) {
      return NextResponse.json({ error: "סוג קובץ לא נתמך" }, { status: 400 });
    }

    const sessionId = getAnalyticsSessionId(request) ?? randomUUID();
    await ensureAnalyticsSession(sessionId);

    const key = buildTemporaryJobKey(sessionId, name);
    const body = Buffer.from(await file.arrayBuffer());
    await uploadEvidenceObject({ key, body, contentType: type });

    const response = NextResponse.json({
      file: {
        key,
        name,
        type,
        sizeBytes: file.size,
      },
    });
    setSessionCookie(response, sessionId);
    return response;
  } catch (error) {
    console.error(
      "[jobs/uploads]",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "העלאת הקובץ נכשלה. נסה שוב." },
      { status: 500 }
    );
  }
}

function validSize(value: number): boolean {
  return Number.isInteger(value) && value > 0 && value <= MAX_FILE_SIZE;
}

function normalizeUploadMime(type: string, name: string): string | null {
  const raw = type.split(";")[0].trim().toLowerCase();
  if (AUDIO_MIMES.has(raw)) return raw;
  const normalized = normalizeEvidenceMime(raw, name);
  return isSupportedEvidenceMime(normalized) ? normalized : null;
}

function setSessionCookie(response: NextResponse, sessionId: string) {
  response.cookies.set({
    name: ANALYTICS_SESSION_COOKIE,
    value: sessionId,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}
