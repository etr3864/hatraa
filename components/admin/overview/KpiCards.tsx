import {
  formatIls,
  formatNumber,
  formatPercent,
  type AnalyticsSummary,
} from "@/lib/admin-analytics";

interface KpiCardsProps {
  summary: AnalyticsSummary;
  previous: AnalyticsSummary;
}

export function KpiCards({ summary, previous }: KpiCardsProps) {
  const cards = [
    {
      label: "מכתבים שנוצרו",
      value: formatNumber(summary.lettersGenerated),
      change: change(summary.lettersGenerated, previous.lettersGenerated),
    },
    {
      label: "הכנסות אמיתיות",
      value: formatIls(summary.revenueIls),
      change: change(summary.revenueIls, previous.revenueIls),
    },
    {
      label: "עלות בינה מלאכותית",
      value: formatIls(summary.aiCostIls),
      change: change(summary.aiCostIls, previous.aiCostIls),
      inverse: true,
    },
    {
      label: "הכנסה פחות עלות בינה מלאכותית",
      value: formatIls(summary.grossContributionIls),
      change: change(
        summary.grossContributionIls,
        previous.grossContributionIls
      ),
    },
    {
      label: "עלות ממוצעת למכתב",
      value: formatIls(summary.averageAiCostPerLetterIls),
      change: change(
        summary.averageAiCostPerLetterIls,
        previous.averageAiCostPerLetterIls
      ),
      inverse: true,
    },
    {
      label: "כניסה ליצירת מכתב",
      value: formatPercent(summary.visitToLetterRate),
      change: change(summary.visitToLetterRate, previous.visitToLetterRate),
    },
    {
      label: "מכתב לתשלום",
      value: formatPercent(summary.letterToPaymentRate),
      change: change(
        summary.letterToPaymentRate,
        previous.letterToPaymentRate
      ),
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const positive = card.inverse ? card.change <= 0 : card.change >= 0;
        return (
          <article
            key={card.label}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
          >
            <p className="text-sm text-[var(--color-subtle)]">{card.label}</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <p className="text-2xl font-bold text-[var(--color-ink)]">
                {card.value}
              </p>
              {Number.isFinite(card.change) && (
                <span
                  className={`text-xs font-medium ${
                    positive
                      ? "text-[var(--color-success)]"
                      : "text-[var(--color-error)]"
                  }`}
                >
                  {card.change >= 0 ? "+" : ""}
                  {formatPercent(card.change)}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-[var(--color-subtle)]">
              לעומת התקופה הקודמת
            </p>
          </article>
        );
      })}
    </section>
  );
}

function change(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : Number.NaN;
  return (current - previous) / previous;
}

