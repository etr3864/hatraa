"use client";

import { useEffect, useState, useCallback } from "react";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { LeadPanel } from "@/components/database/LeadPanel";
import { downloadLeadsCsv } from "@/lib/leads-export";
import {
  IconDownload,
  IconRefresh,
  IconLock,
} from "@tabler/icons-react";
import type { Lead, Category } from "@/lib/types";
import { CATEGORIES, TONES } from "@/lib/constants";
import { categoryLabel } from "@/lib/utils";

const ADMIN_TOKEN_KEY = "adminToken";
const PAGE_SIZE = 50;

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "כל הקטגוריות" },
  ...Object.entries(CATEGORIES).map(([k, v]) => ({ value: k, label: v.label })),
];

export default function DatabasePage() {
  const [token, setToken] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [category, setCategory] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (saved) setToken(saved);
  }, []);

  const buildParams = useCallback(
    (opts?: { page?: number; limit?: number }) => {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      params.set("page", String(opts?.page ?? page));
      params.set("limit", String(opts?.limit ?? PAGE_SIZE));
      return params;
    },
    [category, from, to, page]
  );

  const fetchLeads = useCallback(
    async (authToken: string) => {
      setIsLoading(true);
      setAuthError("");
      try {
        const res = await fetch(`/api/leads?${buildParams()}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (res.status === 401) {
          sessionStorage.removeItem(ADMIN_TOKEN_KEY);
          setToken(null);
          setAuthError("סיסמה שגויה או פג תוקף");
          setLeads([]);
          return;
        }

        const data = await res.json();
        if (!res.ok) {
          setAuthError(data.error || "שגיאה בטעינה");
          setLeads([]);
          return;
        }

        setLeads(data.leads ?? []);
        setTotal(data.total ?? 0);
      } catch {
        setLeads([]);
        setAuthError("שגיאה בטעינת הלידים");
      } finally {
        setIsLoading(false);
      }
    },
    [buildParams]
  );

  useEffect(() => {
    if (token) fetchLeads(token);
  }, [token, fetchLeads]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const value = passwordInput.trim();
    if (!value) {
      setAuthError("נא להזין סיסמה");
      return;
    }
    sessionStorage.setItem(ADMIN_TOKEN_KEY, value);
    setToken(value);
    setPasswordInput("");
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken(null);
    setLeads([]);
    setSelectedLead(null);
  };

  const handleExport = async () => {
    if (!token) return;
    setIsExporting(true);
    setAuthError("");
    try {
      const res = await fetch(`/api/leads?${buildParams({ page: 1, limit: 5000 })}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "שגיאה בייצוא");
        return;
      }
      const allLeads: Lead[] = data.leads ?? [];
      if (allLeads.length === 0) {
        setAuthError("אין לידים לייצוא לפי הסינון הנוכחי");
        return;
      }
      downloadLeadsCsv(allLeads);
    } catch {
      setAuthError("שגיאה בייצוא");
    } finally {
      setIsExporting(false);
    }
  };

  if (!token) {
    return (
      <div className="admin-crm flex items-center justify-center px-4" dir="rtl">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6 flex flex-col gap-4 shadow-sm"
        >
          <div className="flex items-center gap-2 text-[var(--color-ink)]">
            <IconLock size={20} stroke={1.5} />
            <h1 className="text-lg font-bold">כניסת מנהל</h1>
          </div>
          <p className="text-sm text-[var(--color-subtle)]">
            הזן את סיסמת האדמין כדי לצפות בלידים.
          </p>
          <Input
            type="password"
            label="סיסמה"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            autoFocus
          />
          {authError && (
            <p className="text-sm text-[var(--color-error)]">{authError}</p>
          )}
          <Button type="submit" variant="primary" fullWidth>
            כניסה
          </Button>
        </form>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="admin-crm" dir="rtl">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-[var(--color-ink)]">לידים</h1>
            <p className="text-sm text-[var(--color-subtle)]">{total} סה&quot;כ</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="!rounded-md !px-3 !py-2 text-sm !border-[var(--color-border)]"
            >
              יציאה
            </Button>
            <Button
              variant="ghost"
              onClick={() => token && fetchLeads(token)}
              className="!rounded-md !px-3 !py-2 text-sm !border-[var(--color-border)]"
            >
              <IconRefresh size={16} stroke={1.5} />
            </Button>
            <Button
              variant="primary"
              onClick={handleExport}
              isLoading={isExporting}
              className="!rounded-md !px-4 !py-2 text-sm"
            >
              <IconDownload size={16} stroke={1.5} />
              ייצא Excel
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-4">
        {authError && (
          <p className="text-sm text-[var(--color-error)]">{authError}</p>
        )}

        <div className="flex flex-wrap gap-3 p-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm bg-white text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)]"
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm bg-white text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)]"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm bg-white text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-primary)]"
          />
        </div>

        <p className="text-xs text-[var(--color-subtle)]">
          לחץ על שורה כדי לראות את תיאור המקרה, המכתב המלא, ולערוך או למחוק.
        </p>

        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]">
                {[
                  "תאריך",
                  "שם",
                  "טלפון",
                  "מייל",
                  "קטגוריה",
                  "נמען",
                  "סכום",
                  "טון",
                  "שילם",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-right px-4 py-3 text-xs font-bold text-[var(--color-subtle)] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
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
                    <LeadRow
                      key={lead.id}
                      lead={lead}
                      onSelect={() => setSelectedLead(lead)}
                    />
                  ))}
              {!isLoading && leads.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-[var(--color-subtle)]"
                  >
                    אין לידים
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {total > PAGE_SIZE && (
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="!rounded-md !px-4 !py-2 text-sm !border-[var(--color-border)]"
            >
              הקודם
            </Button>
            <span className="text-sm text-[var(--color-subtle)]">
              עמוד {page} מתוך {totalPages}
            </span>
            <Button
              variant="ghost"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className="!rounded-md !px-4 !py-2 text-sm !border-[var(--color-border)]"
            >
              הבא
            </Button>
          </div>
        )}
      </main>

      {selectedLead && token && (
        <LeadPanel
          lead={selectedLead}
          token={token}
          onClose={() => setSelectedLead(null)}
          onSaved={(updated) => {
            setLeads((prev) =>
              prev.map((l) => (l.id === updated.id ? updated : l))
            );
            setSelectedLead(updated);
          }}
          onDeleted={(id) => {
            setLeads((prev) => prev.filter((l) => l.id !== id));
            setTotal((t) => Math.max(0, t - 1));
            setSelectedLead(null);
          }}
        />
      )}
    </div>
  );
}

function LeadRow({ lead, onSelect }: { lead: Lead; onSelect: () => void }) {
  const paid =
    lead.payment?.status === "completed" || lead.payment?.status === "mock";

  return (
    <tr
      onClick={onSelect}
      className="border-b border-[var(--color-border)] hover:bg-[var(--color-muted)] cursor-pointer transition-colors"
    >
      <td className="px-4 py-3 whitespace-nowrap text-[var(--color-subtle)]">
        {new Date(lead.createdAt).toLocaleDateString("he-IL")}
      </td>
      <td className="px-4 py-3 font-medium text-[var(--color-ink)]">{lead.name}</td>
      <td className="px-4 py-3 text-[var(--color-body)]">{lead.phone}</td>
      <td className="px-4 py-3 text-[var(--color-body)]">{lead.email}</td>
      <td className="px-4 py-3">
        {lead.letter && (
          <Tag variant="category">
            {categoryLabel(lead.letter.category as Category)}
          </Tag>
        )}
      </td>
      <td className="px-4 py-3 text-[var(--color-body)]">
        {lead.letter?.respondentName ?? "—"}
      </td>
      <td className="px-4 py-3 text-[var(--color-body)]">
        {lead.letter?.amount ?? "—"}
      </td>
      <td className="px-4 py-3 text-[var(--color-body)]">
        {lead.letter
          ? TONES[lead.letter.tone as keyof typeof TONES]?.label ??
            lead.letter.tone
          : "—"}
      </td>
      <td className="px-4 py-3">
        <Tag variant={paid ? "status-success" : "status-pending"}>
          {paid ? "שילם" : "לא שילם"}
        </Tag>
      </td>
    </tr>
  );
}
