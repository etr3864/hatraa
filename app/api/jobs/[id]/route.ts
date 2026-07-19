import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsSessionId } from "@/backend/services/analytics/request-session";
import { getJobForSession } from "@/backend/services/jobs/repository";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const sessionId = getAnalyticsSessionId(request);
  if (!sessionId) {
    return NextResponse.json({ error: "ההפעלה אינה זמינה" }, { status: 401 });
  }

  const { id } = await context.params;
  const job = await getJobForSession(id, sessionId);
  if (!job) {
    return NextResponse.json({ error: "המשימה לא נמצאה" }, { status: 404 });
  }
  return NextResponse.json(job);
}

