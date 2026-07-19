"use client";

import { usePathname } from "next/navigation";
import { AccessibilityMenu } from "@/components/legal/AccessibilityMenu";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";
import { SiteFooter } from "@/components/legal/SiteFooter";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin =
    pathname.startsWith("/admin") || pathname.startsWith("/database");
  const isWizard = pathname.startsWith("/wizard");

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:right-3 focus:z-[100] focus:rounded-lg focus:bg-[var(--color-accent)] focus:px-4 focus:py-2 focus:text-black focus:text-sm focus:font-medium"
      >
        דלג לתוכן הראשי
      </a>
      <div id="main-content">{children}</div>
      {!isAdmin && !isWizard && <SiteFooter />}
      {!isAdmin && <CookieConsentBanner />}
      {!isAdmin && <AccessibilityMenu />}
    </>
  );
}
