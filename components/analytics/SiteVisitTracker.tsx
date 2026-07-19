"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackClientEvent } from "@/lib/analytics";
import { hasAnalyticsConsent } from "@/lib/cookie-consent";

export function SiteVisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/database")) {
      return;
    }

    const track = () => {
      if (!hasAnalyticsConsent()) return;
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
    };

    const timeout = window.setTimeout(track, 0);
    window.addEventListener("hatraah:cookie-consent-changed", track);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("hatraah:cookie-consent-changed", track);
    };
  }, [pathname]);

  return null;
}
