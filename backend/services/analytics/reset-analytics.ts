import { prisma } from "@/backend/services/db/prisma";

export async function resetAnalyticsData(): Promise<{
  events: number;
  aiCalls: number;
  sessions: number;
}> {
  const [events, aiCalls, sessions] = await prisma.$transaction([
    prisma.analyticsEvent.deleteMany({}),
    prisma.aiCallLog.deleteMany({}),
    prisma.analyticsSession.deleteMany({}),
  ]);

  return {
    events: events.count,
    aiCalls: aiCalls.count,
    sessions: sessions.count,
  };
}
