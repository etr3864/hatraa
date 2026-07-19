import Link from "next/link";
import { BUSINESS } from "@/lib/business";
import { SITE_NAME } from "@/lib/constants";

export function LegalPageShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="text-sm text-[var(--color-primary)] hover:underline mb-8 inline-block"
        >
          ← חזרה לדף הבית
        </Link>

        <h1 className="text-3xl font-extrabold text-[var(--color-ink)] mb-4">
          {title}
        </h1>
        <p className="text-sm text-[var(--color-subtle)] mb-8">
          עדכון אחרון: {BUSINESS.lastUpdatedLabel} · מופעל על ידי{" "}
          {BUSINESS.legalName}
        </p>

        <div className="space-y-8 text-[var(--color-body)] leading-relaxed text-sm md:text-base">
          {children}
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--color-border)] flex flex-wrap gap-4 text-sm">
          <Link href="/terms" className="text-[var(--color-primary)] hover:underline">
            תנאי שימוש
          </Link>
          <Link href="/privacy" className="text-[var(--color-primary)] hover:underline">
            מדיניות פרטיות
          </Link>
          <Link
            href="/accessibility"
            className="text-[var(--color-primary)] hover:underline"
          >
            הצהרת נגישות
          </Link>
          <Link href="/wizard" className="text-[var(--color-primary)] hover:underline">
            יצירת מכתב
          </Link>
        </div>

        <p className="mt-6 text-xs text-[var(--color-placeholder)]">
          © {new Date().getFullYear()} {SITE_NAME}. התוכן המשפטי באתר הוא תבנית
          כללית; יש להשלים פרטי עוסק ולאשר מול עו״ד.
        </p>
      </div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-bold text-[var(--color-ink)] mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
