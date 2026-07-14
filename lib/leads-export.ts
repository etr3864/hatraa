import type { Lead, Category } from "@/lib/types";
import { CATEGORIES, TONES, GOALS } from "@/lib/constants";
import { categoryLabel } from "@/lib/utils";

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""').replace(/\r?\n/g, "\n")}"`;
}

/** ייצוא מלא ל־Excel (CSV עם BOM) — כל המידע העסקי של הליד */
export function buildLeadsCsv(leads: Lead[]): string {
  const headers = [
    "תאריך",
    "שם",
    "ת.ז / ח.פ",
    "כתובת",
    "טלפון",
    "מייל",
    "קטגוריה",
    "נמען",
    "כתובת נמען",
    "תאריך אירוע",
    "סכום",
    "טון",
    "מטרה",
    "תיאור המקרה (מה שהמשתמש כתב)",
    "תוכן המכתב",
    "שם קובץ",
    "הודעת אפסייל",
    "שילם",
    "סכום תשלום",
    "מאומת משפטית",
  ];

  const rows = leads.map((l) => {
    const letter = l.letter;
    const paid =
      l.payment?.status === "completed" || l.payment?.status === "mock";

    return [
      new Date(l.createdAt).toLocaleString("he-IL"),
      l.name,
      l.idNumber ?? "",
      l.address,
      l.phone,
      l.email,
      letter ? categoryLabel(letter.category as Category) : "",
      letter?.respondentName ?? "",
      letter?.respondentAddress ?? "",
      letter?.eventDate ?? "",
      letter?.amount ?? "",
      letter ? TONES[letter.tone as keyof typeof TONES]?.label ?? letter.tone : "",
      letter ? GOALS[letter.goal as keyof typeof GOALS]?.label ?? letter.goal : "",
      letter?.rawInput ?? "",
      letter?.content ?? "",
      letter?.fileName ?? "",
      letter?.upsellMessage ?? "",
      paid ? "כן" : "לא",
      l.payment?.amount != null ? String(l.payment.amount) : "",
      letter?.verified ? "כן" : "לא",
    ];
  });

  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function downloadLeadsCsv(leads: Lead[], filename?: string) {
  const csv = "\uFEFF" + buildLeadsCsv(leads);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `leads_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function categoryOptions() {
  return Object.entries(CATEGORIES).map(([value, meta]) => ({
    value,
    label: meta.label,
  }));
}
