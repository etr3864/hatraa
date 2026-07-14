"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { IconX, IconTrash, IconDeviceFloppy } from "@tabler/icons-react";
import type { Lead, Category, Tone, Goal } from "@/lib/types";
import { CATEGORIES, TONES, GOALS } from "@/lib/constants";
import { categoryLabel } from "@/lib/utils";

interface LeadPanelProps {
  lead: Lead;
  token: string;
  onClose: () => void;
  onSaved: (lead: Lead) => void;
  onDeleted: (id: string) => void;
}

interface EditForm {
  name: string;
  idNumber: string;
  address: string;
  phone: string;
  email: string;
  category: string;
  respondentName: string;
  respondentAddress: string;
  eventDate: string;
  amount: string;
  tone: string;
  goal: string;
  rawInput: string;
  content: string;
}

function toForm(lead: Lead): EditForm {
  return {
    name: lead.name,
    idNumber: lead.idNumber ?? "",
    address: lead.address,
    phone: lead.phone,
    email: lead.email,
    category: lead.letter?.category ?? "consumer",
    respondentName: lead.letter?.respondentName ?? "",
    respondentAddress: lead.letter?.respondentAddress ?? "",
    eventDate: lead.letter?.eventDate ?? "",
    amount: lead.letter?.amount ?? "",
    tone: lead.letter?.tone ?? "firm",
    goal: lead.letter?.goal ?? "compensation",
    rawInput: lead.letter?.rawInput ?? "",
    content: lead.letter?.content ?? "",
  };
}

export function LeadPanel({ lead, token, onClose, onSaved, onDeleted }: LeadPanelProps) {
  const [form, setForm] = useState<EditForm>(() => toForm(lead));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(toForm(lead));
    setIsEditing(false);
    setError("");
  }, [lead]);

  const setField = <K extends keyof EditForm>(key: K, value: EditForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          idNumber: form.idNumber || null,
          address: form.address,
          phone: form.phone,
          email: form.email,
          letter: {
            category: form.category,
            respondentName: form.respondentName,
            respondentAddress: form.respondentAddress || null,
            eventDate: form.eventDate || null,
            amount: form.amount || null,
            tone: form.tone,
            goal: form.goal,
            rawInput: form.rawInput,
            content: form.content,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "שגיאה בשמירה");
        return;
      }
      onSaved(data.lead);
      setIsEditing(false);
    } catch {
      setError("שגיאה בשמירה");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("למחוק את הליד לצמיתות? פעולה זו לא ניתנת לביטול.")) return;
    setIsDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "שגיאה במחיקה");
        return;
      }
      onDeleted(lead.id);
    } catch {
      setError("שגיאה במחיקה");
    } finally {
      setIsDeleting(false);
    }
  };

  const paid =
    lead.payment?.status === "completed" || lead.payment?.status === "mock";

  return (
    <div className="fixed inset-0 z-50 flex justify-end" dir="rtl">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 border-0 cursor-pointer"
        aria-label="סגור"
        onClick={onClose}
      />
      <aside className="relative w-full max-w-xl h-full bg-white text-zinc-900 shadow-xl overflow-y-auto">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">{lead.name}</h2>
            <p className="text-xs text-zinc-500">
              {new Date(lead.createdAt).toLocaleString("he-IL")}
              {" · "}
              {paid ? "שילם" : "לא שילם"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 border-0 cursor-pointer bg-transparent"
          >
            <IconX size={18} />
          </button>
        </header>

        <div className="p-5 flex flex-col gap-5">
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-2">
            {!isEditing ? (
              <Button
                variant="primary"
                className="!rounded-md !px-4 !py-2 text-sm"
                onClick={() => setIsEditing(true)}
              >
                עריכה
              </Button>
            ) : (
              <>
                <Button
                  variant="primary"
                  className="!rounded-md !px-4 !py-2 text-sm"
                  onClick={handleSave}
                  isLoading={isSaving}
                >
                  <IconDeviceFloppy size={16} />
                  שמירה
                </Button>
                <Button
                  variant="ghost"
                  className="!rounded-md !px-4 !py-2 text-sm !border-[var(--color-border)]"
                  onClick={() => {
                    setForm(toForm(lead));
                    setIsEditing(false);
                  }}
                  disabled={isSaving}
                >
                  ביטול
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              className="!rounded-md !px-4 !py-2 text-sm !text-red-700 !border-red-300"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              <IconTrash size={16} />
              מחיקה
            </Button>
          </div>

          {isEditing ? (
            <div className="flex flex-col gap-3">
              <Input label="שם" value={form.name} onChange={(e) => setField("name", e.target.value)} />
              <Input
                label="ת.ז / ח.פ"
                value={form.idNumber}
                onChange={(e) => setField("idNumber", e.target.value)}
              />
              <Input
                label="כתובת"
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
              />
              <Input
                label="טלפון"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />
              <Input
                label="מייל"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-zinc-700">קטגוריה</span>
                <select
                  className="rounded-md border border-zinc-300 px-3 py-2 bg-white text-zinc-900"
                  value={form.category}
                  onChange={(e) => setField("category", e.target.value)}
                >
                  {Object.entries(CATEGORIES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </label>

              <Input
                label="נמען"
                value={form.respondentName}
                onChange={(e) => setField("respondentName", e.target.value)}
              />
              <Input
                label="כתובת נמען"
                value={form.respondentAddress}
                onChange={(e) => setField("respondentAddress", e.target.value)}
              />
              <Input
                label="תאריך אירוע"
                value={form.eventDate}
                onChange={(e) => setField("eventDate", e.target.value)}
              />
              <Input
                label="סכום"
                value={form.amount}
                onChange={(e) => setField("amount", e.target.value)}
              />

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-zinc-700">טון</span>
                <select
                  className="rounded-md border border-zinc-300 px-3 py-2 bg-white text-zinc-900"
                  value={form.tone}
                  onChange={(e) => setField("tone", e.target.value)}
                >
                  {Object.entries(TONES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-zinc-700">מטרה</span>
                <select
                  className="rounded-md border border-zinc-300 px-3 py-2 bg-white text-zinc-900"
                  value={form.goal}
                  onChange={(e) => setField("goal", e.target.value)}
                >
                  {Object.entries(GOALS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </label>

              <Textarea
                label="תיאור המקרה (מה שהמשתמש כתב)"
                rows={6}
                value={form.rawInput}
                onChange={(e) => setField("rawInput", e.target.value)}
              />
              <Textarea
                label="תוכן המכתב"
                rows={12}
                value={form.content}
                onChange={(e) => setField("content", e.target.value)}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-5 text-sm text-zinc-800">
              <Section title="פרטי שולח">
                <Row label="שם" value={lead.name} />
                <Row label="ת.ז / ח.פ" value={lead.idNumber ?? "—"} />
                <Row label="כתובת" value={lead.address} />
                <Row label="טלפון" value={lead.phone} />
                <Row label="מייל" value={lead.email} />
              </Section>

              <Section title="פרטי המקרה">
                <Row
                  label="קטגוריה"
                  value={
                    lead.letter
                      ? categoryLabel(lead.letter.category as Category)
                      : "—"
                  }
                />
                <Row label="נמען" value={lead.letter?.respondentName ?? "—"} />
                <Row
                  label="כתובת נמען"
                  value={lead.letter?.respondentAddress ?? "—"}
                />
                <Row label="תאריך אירוע" value={lead.letter?.eventDate ?? "—"} />
                <Row label="סכום" value={lead.letter?.amount ?? "—"} />
                <Row
                  label="טון"
                  value={
                    lead.letter
                      ? TONES[lead.letter.tone as Tone]?.label ?? lead.letter.tone
                      : "—"
                  }
                />
                <Row
                  label="מטרה"
                  value={
                    lead.letter
                      ? GOALS[lead.letter.goal as Goal]?.label ?? lead.letter.goal
                      : "—"
                  }
                />
              </Section>

              <Section title="מה שהמשתמש כתב">
                <pre className="whitespace-pre-wrap rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800 leading-relaxed font-[inherit]">
                  {lead.letter?.rawInput || "—"}
                </pre>
              </Section>

              <Section title="המכתב שנוצר">
                <pre className="whitespace-pre-wrap rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800 leading-relaxed font-[inherit]">
                  {lead.letter?.content || "—"}
                </pre>
              </Section>

              {lead.letter?.upsellMessage && (
                <Section title="הודעת אפסייל">
                  <p className="text-zinc-700">{lead.letter.upsellMessage}</p>
                </Section>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-xs font-bold uppercase tracking-wide text-zinc-500">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 border-b border-zinc-100 py-2">
      <span className="w-28 shrink-0 text-zinc-500">{label}</span>
      <span className="text-zinc-900 font-medium break-words">{value}</span>
    </div>
  );
}
