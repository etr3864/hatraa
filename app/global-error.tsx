"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]" dir="rtl">
          <div className="text-center px-4">
            <h2 className="text-xl font-bold text-[var(--color-primary)] mb-3">
              משהו השתבש
            </h2>
            <p className="text-[var(--color-body)] mb-8">
              אירעה שגיאה בלתי צפויה. אנא נסה שוב.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="primary" onClick={reset}>נסה שוב</Button>
              <Link href="/">
                <Button variant="ghost">חזור לדף הבית</Button>
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
