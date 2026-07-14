import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "התראה בקליק | מכתב התראה מקצועי תוך דקות",
  description:
    "ייצר מכתב התראה משפטי מקצועי בעברית תוך דקות. ספר לנו מה קרה ו-AI יייצר עבורך מכתב מוכן לשליחה.",
  openGraph: {
    title: "התראה בקליק",
    description: "מכתב התראה מקצועי תוך דקות, ללא עורך דין",
    locale: "he_IL",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[var(--color-surface)] text-[var(--color-body)]">{children}</body>
    </html>
  );
}
