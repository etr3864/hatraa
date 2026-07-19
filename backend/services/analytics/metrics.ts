import { Prisma } from "@prisma/client";
import { prisma } from "@/backend/services/db/prisma";

export interface AnalyticsFilters {
  from: Date;
  to: Date;
  category?: string;
  deviceType?: string;
  inputMode?: string;
  hasEvidence?: boolean;
  senderType?: string;
}

interface EventCountRow {
  type: string;
  count: bigint;
}

interface ModelUsageRow {
  model: string;
  provider: string;
  inputTokens: bigint;
  outputTokens: bigint;
  calls: bigint;
  costIls: Prisma.Decimal | null;
}

interface TimelineRow {
  day: Date;
  generated: bigint;
  paid: bigint;
}

interface CostTimelineRow {
  day: Date;
  costIls: Prisma.Decimal | null;
}

interface RevenueRow {
  revenue: bigint;
  completedPayments: bigint;
  mockPayments: bigint;
}

export async function getAdminAnalytics(filters: AnalyticsFilters) {
  const duration = filters.to.getTime() - filters.from.getTime();
  const previousFilters = {
    ...filters,
    from: new Date(filters.from.getTime() - duration),
    to: new Date(filters.to.getTime() - duration),
  };

  const [current, previous, timeline, modelUsage] = await Promise.all([
    getSummary(filters),
    getSummary(previousFilters),
    getTimeline(filters),
    getModelUsage(filters),
  ]);

  return {
    range: {
      from: filters.from.toISOString(),
      to: filters.to.toISOString(),
    },
    summary: current,
    previous,
    funnel: current.funnel,
    timeline,
    modelUsage: modelUsage.map((item) => ({
      ...item,
      averageTokensPerLetter:
        current.lettersGenerated > 0
          ? (item.inputTokens + item.outputTokens) / current.lettersGenerated
          : 0,
      averageCostPerLetterIls:
        current.lettersGenerated > 0
          ? item.costIls / current.lettersGenerated
          : 0,
    })),
  };
}

async function getSummary(filters: AnalyticsFilters) {
  const sessionWhere = buildSessionWhere(filters);
  const [events, costs, revenue, letters] = await Promise.all([
    prisma.$queryRaw<EventCountRow[]>(Prisma.sql`
      SELECT e."type"::text AS "type", COUNT(DISTINCT e."sessionId")::bigint AS "count"
      FROM "AnalyticsEvent" e
      JOIN "AnalyticsSession" s ON s."id" = e."sessionId"
      WHERE e."occurredAt" >= ${filters.from}
        AND e."occurredAt" < ${filters.to}
        ${sessionWhere}
      GROUP BY e."type"
    `),
    prisma.$queryRaw<{ costIls: Prisma.Decimal | null }[]>(Prisma.sql`
      SELECT COALESCE(SUM(a."costIls"), 0) AS "costIls"
      FROM "AiCallLog" a
      LEFT JOIN "AnalyticsSession" s ON s."id" = a."sessionId"
      WHERE a."createdAt" >= ${filters.from}
        AND a."createdAt" < ${filters.to}
        AND a."status" = 'SUCCEEDED'
        ${sessionWhere}
    `),
    prisma.$queryRaw<RevenueRow[]>(Prisma.sql`
      SELECT
        COALESCE(SUM(CASE WHEN p."status" = 'completed' THEN p."amount" ELSE 0 END), 0)::bigint AS "revenue",
        COUNT(*) FILTER (WHERE p."status" = 'completed')::bigint AS "completedPayments",
        COUNT(*) FILTER (WHERE p."status" = 'mock')::bigint AS "mockPayments"
      FROM "Payment" p
      JOIN "Lead" l ON l."id" = p."leadId"
      LEFT JOIN "AnalyticsSession" s ON s."id" = l."analyticsSessionId"
      WHERE COALESCE(p."paidAt", p."createdAt") >= ${filters.from}
        AND COALESCE(p."paidAt", p."createdAt") < ${filters.to}
        ${sessionWhere}
    `),
    prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
      SELECT COUNT(*)::bigint AS "count"
      FROM "Letter" letter
      JOIN "Lead" l ON l."id" = letter."leadId"
      LEFT JOIN "AnalyticsSession" s ON s."id" = l."analyticsSessionId"
      WHERE letter."createdAt" >= ${filters.from}
        AND letter."createdAt" < ${filters.to}
        ${sessionWhere}
    `),
  ]);

  const counts = Object.fromEntries(
    events.map((row) => [row.type, Number(row.count)])
  );
  const generatedSessions = counts.LETTER_GENERATED ?? 0;
  const generatedLetters = Number(letters[0]?.count ?? 0);
  const visits = counts.SITE_VISIT ?? 0;
  const completedPayments = Number(revenue[0]?.completedPayments ?? 0);
  const costIls = Number(costs[0]?.costIls ?? 0);

  return {
    lettersGenerated: generatedLetters,
    revenueIls: Number(revenue[0]?.revenue ?? 0),
    aiCostIls: costIls,
    grossContributionIls:
      Number(revenue[0]?.revenue ?? 0) - costIls,
    averageAiCostPerLetterIls:
      generatedLetters > 0 ? costIls / generatedLetters : 0,
    visitToLetterRate:
      visits > 0 ? generatedSessions / visits : 0,
    letterToPaymentRate:
      generatedLetters > 0 ? completedPayments / generatedLetters : 0,
    mockPayments: Number(revenue[0]?.mockPayments ?? 0),
    funnel: {
      SITE_VISIT: visits,
      WIZARD_STARTED: counts.WIZARD_STARTED ?? 0,
      EXTRACTION_COMPLETED: counts.EXTRACTION_COMPLETED ?? 0,
      DETAILS_COMPLETED: counts.DETAILS_COMPLETED ?? 0,
      LETTER_GENERATED: generatedSessions,
      PAYMENT_STARTED: counts.PAYMENT_STARTED ?? 0,
      PAYMENT_COMPLETED: completedPayments,
      ATTORNEY_REWRITE_COMPLETED:
        counts.ATTORNEY_REWRITE_COMPLETED ?? 0,
      PDF_DOWNLOADED: counts.PDF_DOWNLOADED ?? 0,
    },
  };
}

async function getModelUsage(filters: AnalyticsFilters) {
  const sessionWhere = buildSessionWhere(filters);
  const rows = await prisma.$queryRaw<ModelUsageRow[]>(Prisma.sql`
    SELECT
      a."model",
      a."provider"::text AS "provider",
      COALESCE(SUM(a."inputTokens"), 0)::bigint AS "inputTokens",
      COALESCE(SUM(a."outputTokens"), 0)::bigint AS "outputTokens",
      COUNT(*)::bigint AS "calls",
      COALESCE(SUM(a."costIls"), 0) AS "costIls"
    FROM "AiCallLog" a
    LEFT JOIN "AnalyticsSession" s ON s."id" = a."sessionId"
    WHERE a."createdAt" >= ${filters.from}
      AND a."createdAt" < ${filters.to}
      AND a."status" = 'SUCCEEDED'
      ${sessionWhere}
    GROUP BY a."model", a."provider"
    ORDER BY "costIls" DESC
  `);

  return rows.map((row) => ({
    model: row.model,
    provider: row.provider,
    inputTokens: Number(row.inputTokens),
    outputTokens: Number(row.outputTokens),
    calls: Number(row.calls),
    costIls: Number(row.costIls ?? 0),
  }));
}

async function getTimeline(filters: AnalyticsFilters) {
  const sessionWhere = buildSessionWhere(filters);
  const [events, costs] = await Promise.all([
    prisma.$queryRaw<TimelineRow[]>(Prisma.sql`
      SELECT
        date_trunc('day', e."occurredAt" AT TIME ZONE 'Asia/Jerusalem')::date AS "day",
        COUNT(*) FILTER (WHERE e."type" = 'LETTER_GENERATED')::bigint AS "generated",
        COUNT(*) FILTER (
          WHERE e."type" = 'PAYMENT_COMPLETED'
          AND EXISTS (
            SELECT 1 FROM "Payment" p
            WHERE p."leadId" = e."leadId" AND p."status" = 'completed'
          )
        )::bigint AS "paid"
      FROM "AnalyticsEvent" e
      JOIN "AnalyticsSession" s ON s."id" = e."sessionId"
      WHERE e."occurredAt" >= ${filters.from}
        AND e."occurredAt" < ${filters.to}
        ${sessionWhere}
      GROUP BY "day"
      ORDER BY "day"
    `),
    prisma.$queryRaw<CostTimelineRow[]>(Prisma.sql`
      SELECT
        date_trunc('day', a."createdAt" AT TIME ZONE 'Asia/Jerusalem')::date AS "day",
        COALESCE(SUM(a."costIls"), 0) AS "costIls"
      FROM "AiCallLog" a
      LEFT JOIN "AnalyticsSession" s ON s."id" = a."sessionId"
      WHERE a."createdAt" >= ${filters.from}
        AND a."createdAt" < ${filters.to}
        AND a."status" = 'SUCCEEDED'
        ${sessionWhere}
      GROUP BY "day"
      ORDER BY "day"
    `),
  ]);

  const byDay = new Map<
    string,
    { date: string; letters: number; payments: number; aiCostIls: number }
  >();

  for (const row of events) {
    const date = toDateKey(row.day);
    byDay.set(date, {
      date,
      letters: Number(row.generated),
      payments: Number(row.paid),
      aiCostIls: 0,
    });
  }

  for (const row of costs) {
    const date = toDateKey(row.day);
    const current = byDay.get(date) ?? {
      date,
      letters: 0,
      payments: 0,
      aiCostIls: 0,
    };
    current.aiCostIls = Number(row.costIls ?? 0);
    byDay.set(date, current);
  }

  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function buildSessionWhere(filters: AnalyticsFilters): Prisma.Sql {
  return Prisma.sql`
    ${filters.category ? Prisma.sql`AND s."category" = ${filters.category}` : Prisma.empty}
    ${filters.deviceType ? Prisma.sql`AND s."deviceType" = ${filters.deviceType}` : Prisma.empty}
    ${filters.inputMode ? Prisma.sql`AND s."inputMode" = ${filters.inputMode}` : Prisma.empty}
    ${typeof filters.hasEvidence === "boolean" ? Prisma.sql`AND s."hasEvidence" = ${filters.hasEvidence}` : Prisma.empty}
    ${filters.senderType ? Prisma.sql`AND s."senderType" = ${filters.senderType}` : Prisma.empty}
  `;
}

function toDateKey(value: Date): string {
  return new Date(value).toISOString().slice(0, 10);
}

