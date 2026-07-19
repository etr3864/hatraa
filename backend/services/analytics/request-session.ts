import type { NextRequest } from "next/server";
import { prisma } from "@/backend/services/db/prisma";
import { ANALYTICS_SESSION_COOKIE } from "./constants";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getAnalyticsSessionId(request: NextRequest): string | null {
  const value = request.cookies.get(ANALYTICS_SESSION_COOKIE)?.value;
  return value && UUID_PATTERN.test(value) ? value : null;
}

export function detectDeviceType(userAgent: string): "mobile" | "desktop" {
  return /android|iphone|ipad|ipod|mobile/i.test(userAgent)
    ? "mobile"
    : "desktop";
}

export async function resolveAnalyticsSessionId(
  request: NextRequest,
  leadId?: string
): Promise<string | null> {
  const cookieSession = getAnalyticsSessionId(request);
  if (cookieSession || !leadId) return cookieSession;

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { analyticsSessionId: true },
  });
  return lead?.analyticsSessionId ?? null;
}

