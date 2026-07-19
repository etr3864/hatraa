export interface AnalyticsSummary {
  lettersGenerated: number;
  revenueIls: number;
  aiCostIls: number;
  grossContributionIls: number;
  averageAiCostPerLetterIls: number;
  visitToLetterRate: number;
  letterToPaymentRate: number;
  mockPayments: number;
}

export interface AdminAnalyticsResponse {
  range: { from: string; to: string };
  summary: AnalyticsSummary;
  previous: AnalyticsSummary;
  funnel: Record<string, number>;
  timeline: Array<{
    date: string;
    letters: number;
    payments: number;
    aiCostIls: number;
  }>;
  modelUsage: Array<{
    model: string;
    provider: string;
    inputTokens: number;
    outputTokens: number;
    calls: number;
    costIls: number;
    averageTokensPerLetter: number;
    averageCostPerLetterIls: number;
  }>;
}

export function formatIls(value: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: value < 10 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("he-IL").format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

