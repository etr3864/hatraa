import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { ANALYTICS_SESSION_COOKIE } from "@/backend/services/analytics/constants";
import { getAnalyticsSessionId } from "@/backend/services/analytics/request-session";
import { ensureAnalyticsSession } from "@/backend/services/analytics/track-event";
import {
  buildTemporaryJobKey,
  createTemporaryUploadUrl,
  isR2Configured,
} from "@/backend/services/storage/r2";
import {
  isSupportedEvidenceMime,
  normalizeEvidenceMime,
  shortenFileName,
} from "@/lib/evidence-mime";

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

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    type?: string;
    sizeBytes?: number;
  } | null;
  if (!body?.name || !body.type || !validSize(body.sizeBytes)) {
    return NextResponse.json({ error: "פרטי קובץ לא תקינים" }, { status: 400 });
  }

  const normalizedType = normalizeUploadMime(body.type, body.name);
  if (!normalizedType) {
    return NextResponse.json({ error: "סוג קובץ לא נתמך" }, { status: 400 });
  }

  const sessionId = getAnalyticsSessionId(request) ?? randomUUID();
  await ensureAnalyticsSession(sessionId);

  const name = shortenFileName(body.name, 120);
  const key = buildTemporaryJobKey(sessionId, name);
  const uploadUrl = await createTemporaryUploadUrl({
    key,
    contentType: normalizedType,
  });

  const response = NextResponse.json({
    uploadUrl,
    file: {
      key,
      name,
      type: normalizedType,
      sizeBytes: body.sizeBytes,
    },
  });
  response.cookies.set({
    name: ANALYTICS_SESSION_COOKIE,
    value: sessionId,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
  return response;
}

function validSize(value: number | undefined): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= MAX_FILE_SIZE
  );
}

function normalizeUploadMime(type: string, name: string): string | null {
  const raw = type.split(";")[0].trim().toLowerCase();
  if (AUDIO_MIMES.has(raw)) return raw;
  const normalized = normalizeEvidenceMime(raw, name);
  if (isSupportedEvidenceMime(normalized)) return normalized;
  return null;
}

