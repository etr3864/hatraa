"use client";

import { useEffect, useState, useCallback } from "react";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { IconDownload, IconRefresh } from "@tabler/icons-react";
import type { Lead, Category } from "@/lib/types";
import { CATEGORIES, TONES, GOALS } from "@/lib/constants";
import { categoryLabel } from "@/lib/utils";

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "כל הקטגוריות" },
  ...Object.entries(CATEGORIES).map(([k, v]) => ({ value: k, label: v.label })),
];

export default function DatabasePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      params.set("page", String(page));
      params.set("limit", "50");

      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      setLeads(data.leads ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  }, [category, from, to, page]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const exportCSV = () => {
    const headers = ["תאריך", "שם", "טלפון", "מייל", "קטגוריה", "נמען", "סכום", "טון", "מטרה", "שילם"];
    const rows = leads.map((l) => [
      new Date(l.createdAt).toLocaleDateString("he-IL"),
      l.name,
      l.phone,
      l.email,
      l.letter ? categoryLabel(l.letter.category as Category) : "",
      l.letter?.respondentName ?? "",
      l.letter?.amount ?? "",
      l.letter ? TONES[l.letter.tone as keyof typeof TONES]?.label ?? l.letter.tone : "",
      l.letter ? GOALS[l.letter.goal as keyof typeof GOALS]?.label ?? l.letter.goal : "",
      l.payment?.status === "completed" || l.payment?.status === "mock" ? "כן" : "לא",
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)]" dir="rtl">
      <header className="border-b border-[var(--color-border)] bg-white px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[var(--color-ink)]">לידים</h1>
            <p className="text-sm text-[var(--color-subtle)]">{total} סה&quot;כ</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={fetchLeads} className="px-3 py-2 text-sm">
              <IconRefresh size={16} />
            </Button>
            <Button variant="primary" onClick={exportCSV} className="px-4 py-2 text-sm">
              <IconDownload size={16} />
              ייצא CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-4">
        <div className="flex flex-wrap gap-3 p-4 bg-white rounded-lg border border-[var(--color-border)]">
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm bg-white text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)]"
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm bg-white text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)]"
            placeholder="מתאריך"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm bg-white text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)]"
            placeholder="עד תאריך"
          />
        </div>

        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-white">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
                {["תאריך", "שם", "טלפון", "מייל", "קטגוריה", "נמען", "סכום", "טון", "שילם"].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-right px-4 py-3 text-xs font-bold text-[var(--color-subtle)] whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-[var(--color-border)]">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-3 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                : leads.map((lead) => (
                    <LeadRow key={lead.id} lead={lead} />
                  ))}
              {!isLoading && leads.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-[var(--color-subtle)]">
                    אין לידים
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {total > 50 && (
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm"
            >
              הקודם
            </Button>
            <span className="text-sm text-[var(--color-subtle)]">
              עמוד {page} מתוך {Math.ceil(total / 50)}
            </span>
            <Button
              variant="ghost"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / 50)}
              className="px-4 py-2 text-sm"
            >
              הבא
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  const paid =
    lead.payment?.status === "completed" || lead.payment?.status === "mock";

  return (
    <tr className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface)] transition-colors">
      <td className="px-4 py-3 whitespace-nowrap text-[var(--color-subtle)]">
        {new Date(lead.createdAt).toLocaleDateString("he-IL")}
      </td>
      <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{lead.name}</td>
      <td className="px-4 py-3 text-[var(--color-body)]">{lead.phone}</td>
      <td className="px-4 py-3 text-[var(--color-body)]">{lead.email}</td>
      <td className="px-4 py-3">
        {lead.letter && (
          <Tag variant="category">{categoryLabel(lead.letter.category as Category)}</Tag>
        )}
      </td>
      <td className="px-4 py-3 text-[var(--color-body)]">
        {lead.letter?.respondentName ?? "—"}
      </td>
      <td className="px-4 py-3 text-[var(--color-body)]">
        {lead.letter?.amount ?? "—"}
      </td>
      <td className="px-4 py-3 text-[var(--color-body)]">
        {lead.letter ? TONES[lead.letter.tone as keyof typeof TONES]?.label ?? lead.letter.tone : "—"}
      </td>
      <td className="px-4 py-3">
        <Tag variant={paid ? "status-success" : "status-pending"}>
          {paid ? "שילם" : "לא שילם"}
        </Tag>
      </td>
    </tr>
  );
}
