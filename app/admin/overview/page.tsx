"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { IconRefresh } from "@tabler/icons-react";
import { KpiCards } from "@/components/admin/overview/KpiCards";
import { ConversionFunnel } from "@/components/admin/overview/ConversionFunnel";
import { TrendChart } from "@/components/admin/overview/TrendChart";
import { ModelUsage } from "@/components/admin/overview/ModelUsage";
import { CATEGORIES } from "@/lib/constants";
import type { AdminAnalyticsResponse } from "@/lib/admin-analytics";

type Period = "today" | "7d" | "30d" | "custom";

export default function AdminOverviewPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [category, setCategory] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [inputMode, setInputMode] = useState("");
  const [hasEvidence, setHasEvidence] = useState("");
  const [senderType, setSenderType] = useState("");
  const [data, setData] = useState<AdminAnalyticsResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const query = useMemo(() => {
    const range = getRange(period, customFrom, customTo);
    const params = new URLSearchParams({
      from: range.from.toISOString(),
      to: range.to.toISOString(),
    });
    if (category) params.set("category", category);
    if (deviceType) params.set("deviceType", deviceType);
    if (inputMode) params.set("inputMode", inputMode);
    if (hasEvidence) params.set("hasEvidence", hasEvidence);
    if (senderType) params.set("senderType", senderType);
    return params.toString();
  }, [
    period,
    customFrom,
    customTo,
    category,
    deviceType,
    inputMode,
    hasEvidence,
    senderType,
  ]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/analytics?${query}`);
      const payload = (await response.json()) as
        | AdminAnalyticsResponse
        | { error?: string };
      if (!response.ok || "error" in payload) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "שגיאה בטעינת הנתונים"
        );
      }
      setData(payload as AdminAnalyticsResponse);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "שגיאה בטעינת הנתונים"
      );
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)]">
            סקירה עסקית
          </h1>
          <p className="mt-1 text-sm text-[var(--color-subtle)]">
            המרות, הכנסות ועלויות בינה מלאכותית
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-body)] disabled:opacity-50"
        >
          <IconRefresh size={16} className={isLoading ? "animate-spin" : ""} />
          רענון
        </button>
      </header>

      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex flex-wrap gap-2">
          {[
            ["today", "היום"],
            ["7d", "7 ימים"],
            ["30d", "30 ימים"],
            ["custom", "טווח מותאם"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value as Period)}
              className={`rounded-lg px-3 py-2 text-sm ${
                period === value
                  ? "bg-[var(--color-accent)] text-white"
                  : "bg-[var(--color-bg)] text-[var(--color-body)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {period === "custom" && (
          <div className="mt-3 flex flex-wrap gap-3">
            <DateField label="מתאריך" value={customFrom} onChange={setCustomFrom} />
            <DateField label="עד תאריך" value={customTo} onChange={setCustomTo} />
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <FilterSelect
            label="קטגוריה"
            value={category}
            onChange={setCategory}
            options={Object.entries(CATEGORIES).map(([value, item]) => ({
              value,
              label: item.label,
            }))}
          />
          <FilterSelect
            label="מכשיר"
            value={deviceType}
            onChange={setDeviceType}
            options={[
              { value: "mobile", label: "מובייל" },
              { value: "desktop", label: "מחשב" },
            ]}
          />
          <FilterSelect
            label="אופן הזנה"
            value={inputMode}
            onChange={setInputMode}
            options={[
              { value: "text", label: "טקסט" },
              { value: "audio", label: "הקלטה" },
            ]}
          />
          <FilterSelect
            label="ראיות"
            value={hasEvidence}
            onChange={setHasEvidence}
            options={[
              { value: "true", label: "עם ראיות" },
              { value: "false", label: "ללא ראיות" },
            ]}
          />
          <FilterSelect
            label="סוג לקוח"
            value={senderType}
            onChange={setSenderType}
            options={[
              { value: "individual", label: "פרטי" },
              { value: "company", label: "חברה" },
            ]}
          />
        </div>
      </section>

      {error && (
        <p className="rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 p-3 text-sm text-[var(--color-error)]">
          {error}
        </p>
      )}

      {isLoading && !data ? (
        <DashboardSkeleton />
      ) : data ? (
        <>
          <KpiCards summary={data.summary} previous={data.previous} />
          {data.summary.mockPayments > 0 && (
            <p className="rounded-lg border border-amber-300/40 bg-amber-50 p-3 text-sm text-amber-800">
              {data.summary.mockPayments} תשלומי בדיקה אינם נכללים בהכנסות או
              בהמרה לתשלום.
            </p>
          )}
          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.4fr]">
            <ConversionFunnel funnel={data.funnel} />
            <TrendChart data={data.timeline} />
          </div>
          <ModelUsage items={data.modelUsage} />
        </>
      ) : null}
    </main>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="text-xs text-[var(--color-subtle)]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-ink)]"
      >
        <option value="">הכול</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-xs text-[var(--color-subtle)]">
      {label}
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 block rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-ink)]"
      />
    </label>
  );
}

function getRange(period: Period, customFrom: string, customTo: string) {
  const to = new Date();
  if (period === "today") {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    return { from, to };
  }
  if (period === "custom" && customFrom && customTo) {
    const from = new Date(`${customFrom}T00:00:00`);
    const end = new Date(`${customTo}T00:00:00`);
    end.setDate(end.getDate() + 1);
    return { from, to: end };
  }
  const days = period === "7d" ? 7 : 30;
  return {
    from: new Date(to.getTime() - days * 24 * 60 * 60 * 1000),
    to,
  };
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-28 animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
        />
      ))}
    </div>
  );
}

