"use client";

import { useCallback, useEffect, useState } from "react";
import { formatIls } from "@/lib/admin-analytics";

interface PricingSettings {
  currentFxRate: number;
  prices: Array<{
    id: string;
    provider: "GOOGLE" | "ANTHROPIC";
    model: string;
    inputUsdPerMillion: number;
    outputUsdPerMillion: number;
    effectiveFrom: string;
  }>;
  fxRates: Array<{
    id: string;
    rateDate: string;
    usdIlsRate: number;
    source: string;
    isManualOverride: boolean;
  }>;
}

export default function AdminPricingPage() {
  const [settings, setSettings] = useState<PricingSettings | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/pricing");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "שגיאה בטעינה");
      setSettings(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "שגיאה בטעינה");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const save = async (payload: object) => {
    setError("");
    setMessage("");
    const response = await fetch("/api/admin/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "השמירה נכשלה");
    setSettings(body);
    setMessage("ההגדרה נשמרה. נתונים היסטוריים לא השתנו.");
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6">
      <header>
        <h1 className="text-2xl font-bold text-[var(--color-ink)]">
          הגדרות עלויות
        </h1>
        <p className="mt-1 text-sm text-[var(--color-subtle)]">
          שינוי תעריף יוצר גרסה חדשה ואינו משנה עלויות שכבר נרשמו.
        </p>
      </header>

      {error && (
        <p className="rounded-lg bg-[var(--color-error)]/10 p-3 text-sm text-[var(--color-error)]">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg bg-[var(--color-success)]/10 p-3 text-sm text-[var(--color-success)]">
          {message}
        </p>
      )}

      {isLoading && !settings ? (
        <div className="h-48 animate-pulse rounded-xl bg-[var(--color-surface)]" />
      ) : settings ? (
        <>
          <section className="grid gap-5 lg:grid-cols-2">
            <FxCard
              currentRate={settings.currentFxRate}
              onSave={async (rate, date) => {
                try {
                  await save({
                    type: "fx-override",
                    usdIlsRate: rate,
                    rateDate: date,
                  });
                } catch (saveError) {
                  setError(
                    saveError instanceof Error
                      ? saveError.message
                      : "השמירה נכשלה"
                  );
                }
              }}
            />
            <ModelPriceForm
              onSave={async (payload) => {
                try {
                  await save({ type: "model-price", ...payload });
                } catch (saveError) {
                  setError(
                    saveError instanceof Error
                      ? saveError.message
                      : "השמירה נכשלה"
                  );
                }
              }}
            />
          </section>

          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <h2 className="font-bold text-[var(--color-ink)]">
              היסטוריית מחירי מודלים
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[650px] text-right text-sm">
                <thead className="text-xs text-[var(--color-subtle)]">
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="pb-3">מודל</th>
                    <th className="pb-3">ספק</th>
                    <th className="pb-3">קלט למיליון</th>
                    <th className="pb-3">פלט למיליון</th>
                    <th className="pb-3">בתוקף מתאריך</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.prices.map((price) => (
                    <tr
                      key={price.id}
                      className="border-b border-[var(--color-border)]/50 last:border-0"
                    >
                      <td className="py-3 font-medium text-[var(--color-ink)]">
                        {price.model}
                      </td>
                      <td className="py-3 text-[var(--color-body)]">
                        {price.provider}
                      </td>
                      <td className="py-3 text-[var(--color-body)]">
                        ${price.inputUsdPerMillion}
                      </td>
                      <td className="py-3 text-[var(--color-body)]">
                        ${price.outputUsdPerMillion}
                      </td>
                      <td className="py-3 text-[var(--color-body)]">
                        {new Intl.DateTimeFormat("he-IL").format(
                          new Date(price.effectiveFrom)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

function FxCard({
  currentRate,
  onSave,
}: {
  currentRate: number;
  onSave: (rate: number, date: string) => Promise<void>;
}) {
  const [rate, setRate] = useState(String(currentRate));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        await onSave(Number(rate), date);
        setSaving(false);
      }}
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
    >
      <h2 className="font-bold text-[var(--color-ink)]">שער דולר</h2>
      <p className="mt-1 text-sm text-[var(--color-subtle)]">
        השער האוטומטי הנוכחי: {formatIls(currentRate)} לדולר
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <FormField
          label="שער USD/ILS"
          type="number"
          step="0.000001"
          value={rate}
          onChange={setRate}
        />
        <FormField label="תאריך" type="date" value={date} onChange={setDate} />
      </div>
      <SubmitButton saving={saving}>שמור דריסה ידנית</SubmitButton>
    </form>
  );
}

function ModelPriceForm({
  onSave,
}: {
  onSave: (payload: {
    provider: string;
    model: string;
    inputUsdPerMillion: number;
    outputUsdPerMillion: number;
    effectiveFrom: string;
  }) => Promise<void>;
}) {
  const [provider, setProvider] = useState("GOOGLE");
  const [model, setModel] = useState("gemini-3.5-flash");
  const [inputPrice, setInputPrice] = useState("");
  const [outputPrice, setOutputPrice] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [saving, setSaving] = useState(false);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        await onSave({
          provider,
          model,
          inputUsdPerMillion: Number(inputPrice),
          outputUsdPerMillion: Number(outputPrice),
          effectiveFrom: `${effectiveFrom}T00:00:00.000Z`,
        });
        setSaving(false);
      }}
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
    >
      <h2 className="font-bold text-[var(--color-ink)]">גרסת מחיר חדשה</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-[var(--color-subtle)]">
          ספק
          <select
            value={provider}
            onChange={(event) => {
              const next = event.target.value;
              setProvider(next);
              setModel(
                next === "GOOGLE" ? "gemini-3.5-flash" : "claude-sonnet-5"
              );
            }}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-ink)]"
          >
            <option value="GOOGLE">Google</option>
            <option value="ANTHROPIC">Anthropic</option>
          </select>
        </label>
        <FormField label="מודל" value={model} onChange={setModel} />
        <FormField
          label="מחיר קלט למיליון ($)"
          type="number"
          step="0.000001"
          value={inputPrice}
          onChange={setInputPrice}
        />
        <FormField
          label="מחיר פלט למיליון ($)"
          type="number"
          step="0.000001"
          value={outputPrice}
          onChange={setOutputPrice}
        />
        <FormField
          label="בתוקף מתאריך"
          type="date"
          value={effectiveFrom}
          onChange={setEffectiveFrom}
        />
      </div>
      <SubmitButton saving={saving}>הוסף גרסת מחיר</SubmitButton>
    </form>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  step?: string;
}) {
  return (
    <label className="text-xs text-[var(--color-subtle)]">
      {label}
      <input
        required
        type={type}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-ink)]"
      />
    </label>
  );
}

function SubmitButton({
  saving,
  children,
}: {
  saving: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="mt-4 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
    >
      {saving ? "שומר..." : children}
    </button>
  );
}

