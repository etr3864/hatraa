import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]" dir="rtl">
      <div className="text-center px-4">
        <h1 className="text-6xl font-extrabold text-[var(--color-ink)] mb-4">404</h1>
        <h2 className="text-xl font-bold text-[var(--color-primary)] mb-3">
          הדף לא נמצא
        </h2>
        <p className="text-[var(--color-body)] mb-8">
          הדף שחיפשת לא קיים או הועבר.
        </p>
        <Link href="/">
          <Button variant="primary">חזור לדף הבית</Button>
        </Link>
      </div>
    </div>
  );
}
