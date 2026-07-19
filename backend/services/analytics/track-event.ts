import type { AnalyticsEventType, Prisma } from "@prisma/client";
import { prisma } from "@/backend/services/db/prisma";
import type { AnalyticsEventName } from "./constants";

interface TrackEventInput {
  sessionId: string;
  type: AnalyticsEventName;
  leadId?: string;
  idempotencyKey?: string;
  metadata?: Prisma.InputJsonValue;
}

interface SessionDimensions {
  deviceType?: string;
  inputMode?: string;
  hasEvidence?: boolean;
  senderType?: string;
  category?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

export async function ensureAnalyticsSession(
  sessionId: string,
  dimensions: SessionDimensions = {}
): Promise<void> {
  await prisma.analyticsSession.upsert({
    where: { id: sessionId },
    create: { id: sessionId, ...dimensions },
    update: { lastSeenAt: new Date(), ...dimensions },
  });
}

export async function trackEvent(input: TrackEventInput): Promise<void> {
  const idempotencyKey =
    input.idempotencyKey ??
    `${input.leadId ?? input.sessionId}:${input.type}`;

  await prisma.analyticsEvent.upsert({
    where: { idempotencyKey },
    create: {
      sessionId: input.sessionId,
      leadId: input.leadId,
      type: input.type as AnalyticsEventType,
      idempotencyKey,
      metadata: input.metadata,
    },
    update: {},
  });
}

export async function trackEventSafely(input: TrackEventInput): Promise<void> {
  try {
    await trackEvent(input);
  } catch (error) {
    console.warn(
      "[analytics] event was not persisted:",
      error instanceof Error ? error.message : error
    );
  }
}

export async function attachSessionToLead(
  sessionId: string,
  leadId: string,
  dimensions: SessionDimensions
): Promise<void> {
  await prisma.$transaction([
    prisma.analyticsSession.update({
      where: { id: sessionId },
      data: { lastSeenAt: new Date(), ...dimensions },
    }),
    prisma.lead.update({
      where: { id: leadId },
      data: { analyticsSessionId: sessionId },
    }),
  ]);
}

