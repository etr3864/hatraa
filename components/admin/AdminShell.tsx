"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconChartBar,
  IconDatabase,
  IconLogout,
  IconSettingsDollar,
} from "@tabler/icons-react";

const NAV_ITEMS = [
  { href: "/admin/overview", label: "סקירה עסקית", icon: IconChartBar },
  { href: "/admin/leads", label: "לקוחות ומכתבים", icon: IconDatabase },
  { href: "/admin/pricing", label: "הגדרות עלויות", icon: IconSettingsDollar },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.refresh();
  };

  return (
    <div className="admin-crm min-h-screen bg-[var(--color-bg)]" dir="rtl">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="font-bold text-[var(--color-ink)]">התראה בקליק</p>
            <p className="text-xs text-[var(--color-subtle)]">מערכת ניהול</p>
          </div>
          <nav className="flex flex-wrap items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-[var(--color-accent)] text-white"
                      : "text-[var(--color-body)] hover:bg-[var(--color-border)]/40"
                  }`}
                >
                  <Icon size={17} stroke={1.5} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 text-sm text-[var(--color-subtle)] hover:text-[var(--color-ink)]"
          >
            <IconLogout size={17} stroke={1.5} />
            יציאה
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}

