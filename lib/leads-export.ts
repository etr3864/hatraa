import type { Lead, Category } from "@/lib/types";
import { CATEGORIES, TONES, GOALS } from "@/lib/constants";
import { categoryLabel } from "@/lib/utils";

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""').replace(/\r?\n/g, "\n")}"`;
}

const HEADERS = [
  "מזהה",
  "תאריך יצירה",
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
  "תיאור המקרה (קלט גולמי)",
  "תוכן המכתב",
  "שם קובץ",
  "הודעת אפסייל",
  "ראיות (שם קובץ + תיאור)",
  "כמות ראיות",
  "שילם",
  "סכום תשלום",
  "תאריך תשלום",
  "מאומת משפטית",
  "נתונים שחולצו",
];

export function buildLeadsCsv(leads: Lead[]): string {
  const rows = leads.map((lead) => {
    const letter = lead.letter;
    const paid =
      lead.payment?.status === "completed" || lead.payment?.status === "mock";
    const evidenceList = lead.evidence ?? [];
    const evidenceDetail = evidenceList
      .map((e) => {
        const desc = e.description ? ` (${e.description})` : "";
        return `${e.label}: ${e.fileName}${desc}`;
      })
      .join(" | ");

    const extractedJson =
      letter?.extractedData && typeof letter.extractedData === "object"
        ? JSON.stringify(letter.extractedData)
        : "";

    return [
      lead.id,
      new Date(lead.createdAt).toLocaleString("he-IL"),
      lead.name,
      lead.idNumber ?? "",
      lead.address,
      lead.phone,
      lead.email,
      letter ? categoryLabel(letter.category as Category) : "",
      letter?.respondentName ?? "",
      letter?.respondentAddress ?? "",
      letter?.eventDate ?? "",
      letter?.amount ?? "",
      letter
        ? (TONES[letter.tone as keyof typeof TONES]?.label ?? letter.tone)
        : "",
      letter
        ? (GOALS[letter.goal as keyof typeof GOALS]?.label ?? letter.goal)
        : "",
      letter?.rawInput ?? "",
      letter?.content ?? "",
      letter?.fileName ?? "",
      letter?.upsellMessage ?? "",
      evidenceDetail,
      String(evidenceList.length),
      paid ? "כן" : "לא",
      lead.payment?.amount != null ? String(lead.payment.amount) : "",
      lead.payment?.paidAt
        ? new Date(lead.payment.paidAt).toLocaleString("he-IL")
        : "",
      letter?.verified ? "כן" : "לא",
      extractedJson,
    ];
  });

  return [HEADERS, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function downloadLeadsCsv(leads: Lead[], filename?: string) {
  const csv = "\uFEFF" + buildLeadsCsv(leads);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    filename ?? `leads_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function categoryOptions() {
  return Object.entries(CATEGORIES).map(([value, meta]) => ({
    value,
    label: meta.label,
  }));
}
