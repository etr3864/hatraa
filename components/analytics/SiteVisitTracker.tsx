"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackClientEvent } from "@/lib/analytics";

const VISIT_KEY = "hatraa:site-visit";

export function SiteVisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/database")) {
      return;
    }
    if (sessionStorage.getItem(VISIT_KEY)) return;
    sessionStorage.setItem(VISIT_KEY, "1");

    const params = new URLSearchParams(window.location.search);
    trackClientEvent("SITE_VISIT", {
      utm: {
        source: params.get("utm_source") ?? undefined,
        medium: params.get("utm_medium") ?? undefined,
        campaign: params.get("utm_campaign") ?? undefined,
        content: params.get("utm_content") ?? undefined,
        term: params.get("utm_term") ?? undefined,
      },
    });
  }, [pathname]);

  return null;
}
