"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export type SenderType = "individual" | "company";

export interface ContactData {
  senderType: SenderType;
  senderName: string;
  senderIdNumber: string;
  senderStreet: string;
  senderCity: string;
  senderZip: string;
  senderPhone: string;
  senderEmail: string;
  companyName?: string;
  companyNumber?: string;
  signatoryRole?: string;
}

interface ContactStepProps {
  onContinue: (data: ContactData) => void;
  isLoading?: boolean;
  initialData?: ContactData | null;
}

export function ContactStep({ onContinue, isLoading, initialData }: ContactStepProps) {
  const [form, setForm] = useState<ContactData>(
    initialData ?? {
      senderType: "individual",
      senderName: "",
      senderIdNumber: "",
      senderStreet: "",
      senderCity: "",
      senderZip: "",
      senderPhone: "",
      senderEmail: "",
      companyName: "",
      companyNumber: "",
      signatoryRole: "",
    }
  );
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const set = (field: keyof ContactData) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const isCompany = form.senderType === "company";

  const canContinue =
    form.senderName.trim().length > 0 &&
    form.senderStreet.trim().length > 0 &&
    form.senderCity.trim().length > 0 &&
    form.senderPhone.trim().length > 0 &&
    form.senderEmail.includes("@") &&
    agreedToTerms &&
    (!isCompany || (
      (form.companyName?.trim().length ?? 0) > 0 &&
      (form.companyNumber?.trim().length ?? 0) > 0
    ));

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-[var(--color-ink)] mb-2">
          הפרטים שלך
        </h2>
        <p className="text-sm text-[var(--color-body)]">
          הפרטים האלה יופיעו במכתב כפרטי השולח
        </p>
      </div>

      <div className="flex rounded-xl border border-[var(--color-border)] overflow-hidden">
        <button
          type="button"
          onClick={() => setForm((prev) => ({ ...prev, senderType: "individual" }))}
          className={`flex-1 py-3 text-sm font-medium transition-all duration-200 ${
            !isCompany
              ? "bg-[var(--color-accent)] text-[var(--color-bg)]"
              : "bg-[var(--color-surface)] text-[var(--color-body)] hover:bg-[var(--color-elevated)]"
          }`}
        >
          אדם פרטי
        </button>
        <button
          type="button"
          onClick={() => setForm((prev) => ({ ...prev, senderType: "company" }))}
          className={`flex-1 py-3 text-sm font-medium transition-all duration-200 ${
            isCompany
              ? "bg-[var(--color-accent)] text-[var(--color-bg)]"
              : "bg-[var(--color-surface)] text-[var(--color-body)] hover:bg-[var(--color-elevated)]"
          }`}
        >
          חברה בע״מ
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {isCompany && (
          <>
            <Input
              label="שם החברה"
              value={form.companyName || ""}
              onChange={set("companyName")}
              placeholder='חברת אלפא בע"מ'
              required
              autoFocus
            />
            <Input
              label="ח.פ. (מספר חברה)"
              value={form.companyNumber || ""}
              onChange={set("companyNumber")}
              placeholder="51-123456-7"
              required
              inputMode="numeric"
            />
          </>
        )}

        <Input
          label={isCompany ? "שם מורשה החתימה" : "שם מלא"}
          value={form.senderName}
          onChange={set("senderName")}
          placeholder={isCompany ? "ישראל ישראלי" : "ישראל ישראלי"}
          required
          autoFocus={!isCompany}
        />

        {isCompany && (
          <Input
            label="תפקיד מורשה החתימה"
            value={form.signatoryRole || ""}
            onChange={set("signatoryRole")}
            placeholder='מנכ"ל / דירקטור / בעלים'
          />
        )}

        {!isCompany && (
          <Input
            label="תעודת זהות"
            value={form.senderIdNumber}
            onChange={set("senderIdNumber")}
            placeholder="מספר תעודת זהות"
            hint="אופציונלי, מחזק את תוקף המכתב"
            inputMode="numeric"
          />
        )}

        <Input
          label={isCompany ? "כתובת רשומה (רחוב ומספר)" : "רחוב ומספר בית"}
          value={form.senderStreet}
          onChange={set("senderStreet")}
          placeholder="רחוב הרצל 12"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="עיר"
            value={form.senderCity}
            onChange={set("senderCity")}
            placeholder="תל אביב"
            required
          />
          <Input
            label="מיקוד"
            value={form.senderZip}
            onChange={set("senderZip")}
            placeholder="6200000"
            inputMode="numeric"
          />
        </div>

        <Input
          label="טלפון"
          value={form.senderPhone}
          onChange={set("senderPhone")}
          placeholder="050-1234567"
          type="tel"
          inputMode="tel"
          required
        />

        <Input
          label="כתובת מייל"
          value={form.senderEmail}
          onChange={set("senderEmail")}
          placeholder="israel@example.com"
          type="email"
          inputMode="email"
          required
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer select-none group">
        <input
          type="checkbox"
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-accent)] cursor-pointer flex-shrink-0"
        />
        <span className="text-xs text-[var(--color-subtle)] leading-relaxed">
          אני מאשר/ת את{" "}
          <Link
            href="/terms"
            target="_blank"
            className="underline text-[var(--color-accent)] font-medium hover:opacity-80"
          >
            תנאי השימוש
          </Link>
          {" "}ו{" "}
          <Link
            href="/privacy"
            target="_blank"
            className="underline text-[var(--color-accent)] font-medium hover:opacity-80"
          >
            מדיניות הפרטיות
          </Link>
          , לרבות העברת פרטיי ופרטי המקרה לעורכי דין לצורך מתן שירות משפטי,
          וקבלת פניות טלפוניות ו/או הודעות מעורכי דין בנוגע למקרה שלי.
          ידוע לי שמכתב ההתראה מיוצר באמצעות בינה מלאכותית (AI) ואינו מהווה
          ייעוץ משפטי עד לחתימת עורך דין.
        </span>
      </label>

      <Button
        variant="primary"
        fullWidth
        onClick={() => onContinue(form)}
        disabled={!canContinue}
        isLoading={isLoading}
      >
        ייצר את המכתב שלי
      </Button>
    </div>
  );
}
