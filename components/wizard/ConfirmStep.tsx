"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { ExtractedData, Category } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants";

interface ConfirmStepProps {
  extracted: ExtractedData;
  initialData?: ConfirmData | null;
  onContinue: (data: ConfirmData) => void;
}

export interface ConfirmData {
  respondentName: string;
  respondentAddress: string;
  eventDate: string;
  amount: string;
  description: string;
  category: Category;
}

export function ConfirmStep({ extracted, initialData, onContinue }: ConfirmStepProps) {
  const [form, setForm] = useState<ConfirmData>(
    initialData ?? {
      respondentName: extracted.respondentName ?? "",
      respondentAddress: extracted.respondentAddress ?? "",
      eventDate: extracted.eventDate ?? "",
      amount: extracted.amount ?? "",
      description: extracted.description ?? "",
      category: extracted.category ?? "consumer",
    }
  );

  const set = (field: keyof ConfirmData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const canContinue = form.respondentName.trim().length > 0 && form.description.trim().length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-[var(--color-ink)] mb-2">
          הבנו את המקרה שלך
        </h2>
        <p className="text-sm text-[var(--color-body)]">
          מה שמצאנו כבר ממולא. תקן אם צריך.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Input
          label="שם הצד השני (חברה / אדם)"
          value={form.respondentName}
          onChange={set("respondentName")}
          placeholder="לדוגמה: פלאפון תקשורת בע&quot;מ"
          required
        />

        <Input
          label="כתובת הנמען"
          value={form.respondentAddress}
          onChange={set("respondentAddress")}
          placeholder="כתובת אופציונלית"
          hint="אם ידועה, תופיע במכתב"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="תאריך האירוע"
            value={form.eventDate}
            onChange={set("eventDate")}
            placeholder="לדוגמה: ינואר 2026"
          />
          <Input
            label="סכום (אם רלוונטי)"
            value={form.amount}
            onChange={set("amount")}
            placeholder="לדוגמה: 450 ש&quot;ח"
          />
        </div>

        <Textarea
          label="תיאור האירוע"
          value={form.description}
          onChange={set("description")}
          rows={4}
          required
          placeholder="תאר בקצרה מה קרה"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-[var(--color-body)]">
            קטגוריה
          </label>
          <select
            value={form.category}
            onChange={set("category")}
            className="w-full rounded-lg border border-[var(--color-border)] px-4 py-3 text-base text-[var(--color-ink)] bg-[var(--color-surface)] focus:outline-none focus:border-[var(--color-accent)]/60 focus:ring-1 focus:ring-[var(--color-accent)]/20 transition-all duration-200"
          >
            {(Object.keys(CATEGORIES) as Category[]).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORIES[cat].label} · {CATEGORIES[cat].description}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button
        variant="primary"
        fullWidth
        onClick={() => onContinue(form)}
        disabled={!canContinue}
      >
        המשך
      </Button>
    </div>
  );
}
