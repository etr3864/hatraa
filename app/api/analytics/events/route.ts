import { randomUUID } from "crypto";
import { after, NextRequest, NextResponse } from "next/server";
import {
  ANALYTICS_SESSION_COOKIE,
  CLIENT_ANALYTICS_EVENTS,
  type ClientAnalyticsEvent,
} from "@/backend/services/analytics/constants";
import {
  detectDeviceType,
  getAnalyticsSessionId,
} from "@/backend/services/analytics/request-session";
import {
  ensureAnalyticsSession,
  trackEvent,
} from "@/backend/services/analytics/track-event";
import {
  checkRateLimit,
  getClientIp,
} from "@/backend/services/security/rate-limiter";

const EVENT_SET = new Set<string>(CLIENT_ANALYTICS_EVENTS);
const MAX_VALUE_LENGTH = 120;

interface EventBody {
  type?: string;
  entityId?: string;
  inputMode?: string;
  hasEvidence?: boolean;
  senderType?: string;
  category?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EventBody;
    if (!body.type || !EVENT_SET.has(body.type)) {
      return NextResponse.json({ error: "אירוע לא תקין" }, { status: 400 });
    }

    const sessionId = getAnalyticsSessionId(request) ?? randomUUID();
    const type = body.type as ClientAnalyticsEvent;
    const entityId = cleanDimension(body.entityId);
    const ip = getClientIp(request.headers);
    const dimensions = {
      deviceType: detectDeviceType(request.headers.get("user-agent") ?? ""),
      inputMode: cleanDimension(body.inputMode),
      hasEvidence: body.hasEvidence,
      senderType: cleanDimension(body.senderType),
      category: cleanDimension(body.category),
      utmSource: cleanDimension(body.utm?.source),
      utmMedium: cleanDimension(body.utm?.medium),
      utmCampaign: cleanDimension(body.utm?.campaign),
      utmContent: cleanDimension(body.utm?.content),
      utmTerm: cleanDimension(body.utm?.term),
    };

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: ANALYTICS_SESSION_COOKIE,
      value: sessionId,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    after(() =>
      persistEvent({ sessionId, type, entityId, ip, dimensions }).catch((error) => {
        console.warn(
          "[analytics] client event failed:",
          error instanceof Error ? error.message : error
        );
      })
    );

    return response;
  } catch (error) {
    console.warn(
      "[analytics] client event failed:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json({ success: false }, { status: 202 });
  }
}

async function persistEvent(input: {
  sessionId: string;
  type: ClientAnalyticsEvent;
  entityId?: string;
  ip: string;
  dimensions: {
    deviceType: string;
    inputMode?: string;
    hasEvidence?: boolean;
    senderType?: string;
    category?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
  };
}) {
  const rate = await checkRateLimit(`analytics:${input.ip}`, 200);
  if (!rate.allowed) return;

  await ensureAnalyticsSession(input.sessionId, input.dimensions);
  await trackEvent({
    sessionId: input.sessionId,
    type: input.type,
    idempotencyKey: input.entityId
      ? `${input.sessionId}:${input.type}:${input.entityId}`
      : undefined,
  });
}

function cleanDimension(value: string | undefined): string | undefined {
  const cleaned = value?.trim().slice(0, MAX_VALUE_LENGTH);
  return cleaned || undefined;
}
