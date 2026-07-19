import { formatNumber, formatPercent } from "@/lib/admin-analytics";

const STEPS = [
  ["SITE_VISIT", "כניסות"],
  ["WIZARD_STARTED", "התחילו יצירה"],
  ["EXTRACTION_COMPLETED", "החילוץ הושלם"],
  ["DETAILS_COMPLETED", "הפרטים הושלמו"],
  ["LETTER_GENERATED", "מכתב נוצר"],
  ["PAYMENT_STARTED", "התחילו תשלום"],
  ["PAYMENT_COMPLETED", "תשלום הושלם"],
  ["ATTORNEY_REWRITE_COMPLETED", "שכתוב עו״ד"],
  ["PDF_DOWNLOADED", "הורדת PDF"],
] as const;

export function ConversionFunnel({
  funnel,
}: {
  funnel: Record<string, number>;
}) {
  const maximum = Math.max(...STEPS.map(([key]) => funnel[key] ?? 0), 1);

  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h2 className="font-bold text-[var(--color-ink)]">משפך המרות</h2>
      <p className="mt-1 text-sm text-[var(--color-subtle)]">
        משתמשים ייחודיים בכל שלב
      </p>
      <div className="mt-5 space-y-3">
        {STEPS.map(([key, label], index) => {
          const value = funnel[key] ?? 0;
          const previous =
            index === 0 ? value : funnel[STEPS[index - 1][0]] ?? 0;
          const stepRate = previous > 0 ? value / previous : 0;
          return (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="text-[var(--color-body)]">{label}</span>
                <span className="font-medium text-[var(--color-ink)]">
                  {formatNumber(value)}
                  {index > 0 && (
                    <span className="mr-2 text-xs text-[var(--color-subtle)]">
                      {formatPercent(stepRate)}
                    </span>
                  )}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--color-border)]/40">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)]"
                  style={{ width: `${Math.max((value / maximum) * 100, value ? 2 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

