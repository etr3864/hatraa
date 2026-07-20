"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clearStoredLetterResult } from "@/lib/letter-result";

interface UseLeaveGuardOptions {
  enabled: boolean;
  isPaid: boolean;
}

function isSafeInternalPath(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

export function useLeaveGuard({ enabled, isPaid }: UseLeaveGuardOptions) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const pendingHrefRef = useRef<string | null>(null);
  const allowLeaveRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    allowLeaveRef.current = false;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowLeaveRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };

    history.pushState({ leaveGuard: true }, "", window.location.href);

    const onPopState = () => {
      if (allowLeaveRef.current) return;
      history.pushState({ leaveGuard: true }, "", window.location.href);
      pendingHrefRef.current = "/wizard";
      setDialogOpen(true);
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("popstate", onPopState);
    };
  }, [enabled]);

  const requestLeave = useCallback(
    (href: string) => {
      const target = isSafeInternalPath(href) ? href : "/";
      if (!enabled || allowLeaveRef.current) {
        router.push(target);
        return;
      }
      pendingHrefRef.current = target;
      setDialogOpen(true);
    },
    [enabled, router]
  );

  const cancelLeave = useCallback(() => {
    pendingHrefRef.current = null;
    setDialogOpen(false);
  }, []);

  const confirmLeave = useCallback(() => {
    const href = pendingHrefRef.current ?? "/wizard";
    allowLeaveRef.current = true;
    setDialogOpen(false);
    pendingHrefRef.current = null;
    if (isPaid) clearStoredLetterResult();
    router.push(href);
  }, [isPaid, router]);

  return {
    dialogOpen,
    requestLeave,
    cancelLeave,
    confirmLeave,
  };
}
