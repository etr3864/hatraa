import Link from "next/link";
import { BUSINESS, isBusinessPlaceholder } from "@/lib/business";
import { SITE_NAME } from "@/lib/constants";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.06] bg-[var(--color-bg)]">
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-8">
        <div className="grid gap-8 md:grid-cols-3 text-sm">
          <div className="space-y-2">
            <p className="font-semibold text-[var(--color-ink)]">{SITE_NAME}</p>
            <p className="text-[var(--color-subtle)] leading-relaxed">
              מכתבי התראה מיוצרים באמצעות AI ואינם מהווים ייעוץ משפטי.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-[var(--color-ink)]">מידע משפטי</p>
            <nav className="flex flex-col gap-1.5" aria-label="קישורים משפטיים">
              <FooterLink href="/terms">תנאי שימוש</FooterLink>
              <FooterLink href="/privacy">מדיניות פרטיות</FooterLink>
              <FooterLink href="/accessibility">הצהרת נגישות</FooterLink>
            </nav>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-[var(--color-ink)]">פרטי העוסק</p>
            <ul className="space-y-1 text-[var(--color-subtle)]">
              <li>{BUSINESS.legalName}</li>
              <li>
                {BUSINESS.registrationType}: {BUSINESS.registrationNumber}
              </li>
              <li>{BUSINESS.address}</li>
              <li>
                <a
                  href={
                    isBusinessPlaceholder(BUSINESS.email)
                      ? undefined
                      : `mailto:${BUSINESS.email}`
                  }
                  className="hover:text-[var(--color-accent)] transition-colors"
                >
                  {BUSINESS.email}
                </a>
              </li>
              <li>{BUSINESS.phone}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.04] pt-6 text-center space-y-2">
          <p className="text-sm text-[var(--color-subtle)]">
            © {year} {SITE_NAME} · כל הזכויות שמורות
          </p>
          <p className="text-xs text-[var(--color-placeholder)] max-w-xl mx-auto">
            השימוש באתר מהווה הסכמה ל
            <Link href="/terms" className="underline mx-1">
              תנאי השימוש
            </Link>
            ו
            <Link href="/privacy" className="underline mx-1">
              מדיניות הפרטיות
            </Link>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-[var(--color-subtle)] hover:text-[var(--color-accent)] transition-colors w-fit"
    >
      {children}
    </Link>
  );
}
