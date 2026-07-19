interface TrendPoint {
  date: string;
  letters: number;
  payments: number;
  aiCostIls: number;
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const maximum = Math.max(
    ...data.flatMap((point) => [point.letters, point.payments]),
    1
  );
  const width = 700;
  const height = 220;
  const padding = 20;

  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-[var(--color-ink)]">מגמה לאורך זמן</h2>
          <p className="mt-1 text-sm text-[var(--color-subtle)]">
            יצירת מכתבים ותשלומים אמיתיים
          </p>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-[var(--color-body)]">
            <i className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
            מכתבים
          </span>
          <span className="flex items-center gap-1.5 text-[var(--color-body)]">
            <i className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
            תשלומים
          </span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="mt-5 flex h-52 items-center justify-center text-sm text-[var(--color-subtle)]">
          אין נתונים בטווח שנבחר
        </div>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="mt-5 h-56 w-full overflow-visible"
            role="img"
            aria-label="גרף מגמת מכתבים ותשלומים"
          >
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1={padding}
                x2={width - padding}
                y1={padding + ratio * (height - padding * 2)}
                y2={padding + ratio * (height - padding * 2)}
                stroke="var(--color-border)"
                strokeWidth="1"
                opacity="0.55"
              />
            ))}
            <polyline
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={toPoints(data, "letters", maximum, width, height, padding)}
            />
            <polyline
              fill="none"
              stroke="var(--color-success)"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={toPoints(data, "payments", maximum, width, height, padding)}
            />
          </svg>
          <div className="flex justify-between text-xs text-[var(--color-subtle)]">
            <span>{formatDate(data[0].date)}</span>
            <span>{formatDate(data[data.length - 1].date)}</span>
          </div>
        </>
      )}
    </section>
  );
}

function toPoints(
  data: TrendPoint[],
  key: "letters" | "payments",
  maximum: number,
  width: number,
  height: number,
  padding: number
): string {
  return data
    .map((point, index) => {
      const x =
        data.length === 1
          ? width / 2
          : padding + (index / (data.length - 1)) * (width - padding * 2);
      const y =
        height -
        padding -
        (point[key] / maximum) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

