import { ProcessingJobType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsSessionId } from "@/backend/services/analytics/request-session";
import {
  getLatestActiveJob,
  getLatestJob,
} from "@/backend/services/jobs/repository";

export async function GET(request: NextRequest) {
  const sessionId = getAnalyticsSessionId(request);
  if (!sessionId) return NextResponse.json({ job: null });

  const typeParam = request.nextUrl.searchParams.get("type");
  const type =
    typeParam &&
    Object.values(ProcessingJobType).includes(typeParam as ProcessingJobType)
      ? (typeParam as ProcessingJobType)
      : undefined;
  const job =
    request.nextUrl.searchParams.get("latest") === "1"
      ? await getLatestJob(sessionId, type)
      : await getLatestActiveJob(sessionId, type);
  return NextResponse.json({ job });
}

