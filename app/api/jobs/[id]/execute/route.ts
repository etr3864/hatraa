import { NextRequest, NextResponse } from "next/server";
import { validateAdminToken } from "@/backend/services/security/admin-auth";
import { executeProcessingJob } from "@/backend/services/jobs/execute-job";
import { logExternalError } from "@/backend/services/logging/external-error";

export const maxDuration = 300;

/** Server-only worker entry (webhook wake / ADMIN_SECRET). */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!validateAdminToken(request)) {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    await executeProcessingJob(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    logExternalError("jobs:execute", error, { jobId: id });
    return NextResponse.json({ error: "job execution failed" }, { status: 500 });
  }
}
