import { NextRequest, NextResponse } from "next/server";
import {
  getAdminAnalytics,
  type AnalyticsFilters,
} from "@/backend/services/analytics/metrics";
import { validateAdminToken } from "@/backend/services/security/admin-auth";
import { VALID_CATEGORIES } from "@/lib/constants";
import type { Category } from "@/lib/types";

const MAX_RANGE_MS = 366 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  if (!validateAdminToken(request)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 401 });
  }

  try {
    const filters = parseFilters(request.nextUrl.searchParams);
    const analytics = await getAdminAnalytics(filters);
    return NextResponse.json(analytics);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "שגיאה בטעינת הנתונים";
    const status = message.startsWith("טווח") ? 400 : 500;
    return NextResponse.json(
      { error: status === 400 ? message : "שגיאה בטעינת הנתונים" },
      { status }
    );
  }
}

function parseFilters(params: URLSearchParams): AnalyticsFilters {
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const from = parseDate(params.get("from")) ?? defaultFrom;
  const to = parseDate(params.get("to")) ?? now;

  if (to <= from || to.getTime() - from.getTime() > MAX_RANGE_MS) {
    throw new Error("טווח התאריכים אינו תקין או גדול משנה");
  }

  const categoryParam = params.get("category");
  const category =
    categoryParam && VALID_CATEGORIES.includes(categoryParam as Category)
      ? categoryParam
      : undefined;

  return {
    from,
    to,
    category,
    deviceType: allowed(params.get("deviceType"), ["mobile", "desktop"]),
    inputMode: allowed(params.get("inputMode"), ["text", "audio"]),
    senderType: allowed(params.get("senderType"), ["individual", "company"]),
    hasEvidence: parseBoolean(params.get("hasEvidence")),
  };
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function allowed(
  value: string | null,
  values: readonly string[]
): string | undefined {
  return value && values.includes(value) ? value : undefined;
}

function parseBoolean(value: string | null): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

