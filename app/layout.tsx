import type { Metadata } from "next";
import { SiteVisitTracker } from "@/components/analytics/SiteVisitTracker";
import { SiteChrome } from "@/components/legal/SiteChrome";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://hatraa.co.il";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "התראה בקליק | מכתב התראה מקצועי תוך דקות",
  description:
    "ייצר מכתב התראה משפטי מקצועי בעברית תוך דקות. ספר לנו מה קרה ו-AI יייצר עבורך מכתב מוכן לשליחה.",
  openGraph: {
    title: "התראה בקליק",
    description: "מכתב התראה מקצועי תוך דקות",
    locale: "he_IL",
    type: "website",
    url: siteUrl,
    siteName: "התראה בקליק",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "התראה בקליק — מכתב התראה מקצועי תוך דקות",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "התראה בקליק",
    description: "מכתב התראה מקצועי תוך דקות",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[var(--color-bg)] text-[var(--color-body)]">
        <SiteVisitTracker />
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
