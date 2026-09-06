import { NextRequest, NextResponse } from "next/server";
import { resetAnalyticsData } from "@/backend/services/analytics/reset-analytics";
import { validateAdminToken } from "@/backend/services/security/admin-auth";

export async function POST(request: NextRequest) {
  if (!validateAdminToken(request)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => null)) as {
      confirm?: string;
    } | null;

    if (body?.confirm !== "RESET_ANALYTICS") {
      return NextResponse.json(
        { error: "נדרש אישור מפורש לאיפוס" },
        { status: 400 }
      );
    }

    const result = await resetAnalyticsData();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error(
      "[admin:analytics:reset]",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "שגיאה באיפוס האנליטיקות" },
      { status: 500 }
    );
  }
}
