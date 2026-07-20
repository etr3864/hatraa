import { randomUUID } from "crypto";
import { ProcessingJobType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { ANALYTICS_SESSION_COOKIE } from "@/backend/services/analytics/constants";
import { getAnalyticsSessionId } from "@/backend/services/analytics/request-session";
import { ensureAnalyticsSession } from "@/backend/services/analytics/track-event";
import { prisma } from "@/backend/services/db/prisma";
import { scheduleProcessingJob } from "@/backend/services/jobs/dispatch";
import { createProcessingJob } from "@/backend/services/jobs/repository";
import type { ProcessingJobInput } from "@/backend/services/jobs/types";
import { validateIdempotencyKey } from "@/backend/services/jobs/validation/common";
import { validateExtractionInput } from "@/backend/services/jobs/validation/extraction";
import { validateGenerationInput } from "@/backend/services/jobs/validation/generation";
import { validateRewriteInput } from "@/backend/services/jobs/validation/rewrite";
import { checkRateLimit, getClientIp } from "@/backend/services/security/rate-limiter";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const rate = await checkRateLimit(getClientIp(request.headers));
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "הגעת למגבלה היומית, נסה שוב מחר." },
        { status: 429 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const idempotencyKey = validateIdempotencyKey(body.idempotencyKey);
    const sessionId = getAnalyticsSessionId(request) ?? randomUUID();
    await ensureAnalyticsSession(sessionId);

    const type = parseJobType(body.type);
    const payload = validatePayload(type, sessionId, body);
    const leadId =
      type === ProcessingJobType.ATTORNEY_REWRITE
        ? (payload as ReturnType<typeof validateRewriteInput>).leadId
        : undefined;
    if (leadId) await assertLeadOwnership(leadId, sessionId);

    const job = await createProcessingJob({
      sessionId,
      leadId,
      type,
      idempotencyKey,
      payload,
    });
    scheduleProcessingJob(job);

    const response = NextResponse.json(
      { jobId: job.id, status: job.status },
      { status: 202 }
    );
    setSessionCookie(response, sessionId);
    return response;
  } catch (error) {
    console.error(
      "[jobs]",
      error instanceof Error ? error.stack || error.message : error
    );
    const message =
      error instanceof Error ? error.message : "לא הצלחנו ליצור את המשימה";
    const isUserError = /[\u0590-\u05FF]/.test(message);
    return NextResponse.json(
      { error: isUserError ? message : "לא הצלחנו ליצור את המשימה" },
      { status: isUserError ? 400 : 500 }
    );
  }
}

function parseJobType(value: unknown): ProcessingJobType {
  if (
    typeof value !== "string" ||
    !Object.values(ProcessingJobType).includes(value as ProcessingJobType)
  ) {
    throw new Error("סוג המשימה אינו תקין");
  }
  return value as ProcessingJobType;
}

function validatePayload(
  type: ProcessingJobType,
  sessionId: string,
  body: Record<string, unknown>
): ProcessingJobInput {
  switch (type) {
    case ProcessingJobType.EXTRACTION:
      return validateExtractionInput(sessionId, body);
    case ProcessingJobType.LETTER_GENERATION:
      return validateGenerationInput(sessionId, body);
    case ProcessingJobType.ATTORNEY_REWRITE:
      return validateRewriteInput(body);
  }
}

async function assertLeadOwnership(leadId: string, sessionId: string) {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, analyticsSessionId: sessionId },
    select: { id: true },
  });
  if (!lead) throw new Error("המכתב לא נמצא עבור ההפעלה הנוכחית");
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

