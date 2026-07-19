import { formatIls, formatNumber } from "@/lib/admin-analytics";

interface ModelUsageItem {
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  calls: number;
  costIls: number;
  averageTokensPerLetter: number;
  averageCostPerLetterIls: number;
}

export function ModelUsage({ items }: { items: ModelUsageItem[] }) {
  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h2 className="font-bold text-[var(--color-ink)]">שימוש לפי מודל</h2>
      <p className="mt-1 text-sm text-[var(--color-subtle)]">
        טוקנים ועלות בפועל בטווח שנבחר
      </p>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[820px] text-right text-sm">
          <thead className="text-xs text-[var(--color-subtle)]">
            <tr className="border-b border-[var(--color-border)]">
              <th className="pb-3 font-medium">מודל</th>
              <th className="pb-3 font-medium">קריאות</th>
              <th className="pb-3 font-medium">טוקני קלט</th>
              <th className="pb-3 font-medium">טוקני פלט</th>
              <th className="pb-3 font-medium">עלות</th>
              <th className="pb-3 font-medium">טוקנים למכתב</th>
              <th className="pb-3 font-medium">עלות למכתב</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={`${item.provider}-${item.model}`}
                className="border-b border-[var(--color-border)]/50 text-[var(--color-body)] last:border-0"
              >
                <td className="py-3">
                  <p className="font-medium text-[var(--color-ink)]">
                    {item.model}
                  </p>
                  <p className="text-xs text-[var(--color-subtle)]">
                    {item.provider}
                  </p>
                </td>
                <td className="py-3">{formatNumber(item.calls)}</td>
                <td className="py-3">{formatNumber(item.inputTokens)}</td>
                <td className="py-3">{formatNumber(item.outputTokens)}</td>
                <td className="py-3">{formatIls(item.costIls)}</td>
                <td className="py-3">
                  {formatNumber(Math.round(item.averageTokensPerLetter))}
                </td>
                <td className="py-3">
                  {formatIls(item.averageCostPerLetterIls)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <p className="py-10 text-center text-sm text-[var(--color-subtle)]">
            אין שימוש במודלים בטווח שנבחר
          </p>
        )}
      </div>
    </section>
  );
}

