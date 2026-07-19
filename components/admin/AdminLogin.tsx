"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconLock } from "@tabler/icons-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "הכניסה נכשלה");
        return;
      }
      setPassword("");
      router.refresh();
    } catch {
      setError("לא ניתן להתחבר כרגע");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-crm min-h-screen flex items-center justify-center px-4" dir="rtl">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm"
      >
        <div className="mb-5 flex items-center gap-2 text-[var(--color-ink)]">
          <IconLock size={20} stroke={1.5} />
          <h1 className="text-lg font-bold">כניסת מנהל</h1>
        </div>
        <Input
          type="password"
          label="סיסמה"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoFocus
        />
        {error && (
          <p className="mt-3 text-sm text-[var(--color-error)]">{error}</p>
        )}
        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isLoading}
          className="mt-5"
        >
          כניסה
        </Button>
      </form>
    </div>
  );
}

