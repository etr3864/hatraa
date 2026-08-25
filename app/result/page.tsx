"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LetterDisplay } from "@/components/result/LetterDisplay";
import { UpsellBlock } from "@/components/result/UpsellBlock";
import {
  DownloadSection,
  downloadLetterPdf,
} from "@/components/result/DownloadSection";
import { AttorneyUpgradeOverlay } from "@/components/result/AttorneyUpgradeOverlay";
import { LetterNotSavedWarning } from "@/components/result/LetterNotSavedWarning";
import { LeaveLetterDialog } from "@/components/result/LeaveLetterDialog";
import { Button } from "@/components/ui/Button";
import { IconCheck, IconArrowRight } from "@tabler/icons-react";
import { attorneyShortLabel } from "@/lib/attorney";
import { trackClientEvent } from "@/lib/analytics";
import {
  LETTER_RESULT_KEY,
  readStoredLetterResult,
  type StoredLetterResult,
} from "@/lib/letter-result";
import { useLeaveGuard } from "@/hooks/use-leave-guard";
import {
  hasPendingProcessingJob,
  runProcessingJob,
} from "@/lib/processing-jobs";
import type { AttorneyRewriteJobResult } from "@/backend/services/jobs/types";

type LetterResult = StoredLetterResult;
type UpsellState = "pending" | "accepted" | "declined";
type UpgradeStep = "pay" | "processing" | "rewrite";

const POLL_INTERVAL_MS = 2000;

export default function ResultPage() {
  return (
    <Suspense fallback={<ResultPageFallback />}>
      <ResultPageContent />
    </Suspense>
  );
}

function ResultPageFallback() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-[var(--color-accent)]/20 border-t-[var(--color-accent)] animate-spin" />
    </div>
  );
}

function ResultPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentReturn = searchParams.get("payment");
  const [result, setResult] = useState<LetterResult | null>(null);
  const [upsellState, setUpsellState] = useState<UpsellState>("pending");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeStep, setUpgradeStep] = useState<UpgradeStep | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [ignoreReturnFailure, setIgnoreReturnFailure] = useState(false);
  const autoDownloaded = useRef(false);
  const trackedPaymentFailure = useRef(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const stored = readStoredLetterResult();
      if (!stored) {
        router.replace("/wizard");
        return;
      }
      setResult(stored);
      setUpsellState(stored.attorneyVerified ? "accepted" : "pending");
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [router]);

  const persistResult = useCallback((next: LetterResult) => {
    setResult(next);
    localStorage.setItem(LETTER_RESULT_KEY, JSON.stringify(next));
  }, []);

  const downloadSignedPdf = useCallback((current: LetterResult) => {
    if (autoDownloaded.current) return;
    autoDownloaded.current = true;
    void downloadLetterPdf({
      leadId: current.leadId,
      fileName: current.fileName,
      content: current.content,
      letterInput: current.letterInput,
      withSignature: true,
    }).catch((error) => {
      console.error("Auto PDF download failed:", error);
    });
  }, []);

  const markPaymentFailed = useCallback((leadId: string, message: string) => {
    if (!trackedPaymentFailure.current) {
      trackedPaymentFailure.current = true;
      trackClientEvent("PAYMENT_FAILED", { entityId: leadId });
    }
    setPaymentError(message);
    setIsUpgrading(false);
    setUpgradeStep(null);
  }, []);

  const isPaid = !!result?.attorneyVerified;
  const { dialogOpen, requestLeave, cancelLeave, confirmLeave } = useLeaveGuard({
    enabled: !!result,
    isPaid,
  });

  const clearPaymentQuery = useCallback(() => {
    router.replace("/result", { scroll: false });
  }, [router]);

  const runAttorneyRewrite = useCallback(
    async (current: LetterResult, signal?: AbortSignal) => {
      const rewritten = await runProcessingJob<AttorneyRewriteJobResult>({
        scope: `attorney-rewrite:${current.leadId}`,
        type: "ATTORNEY_REWRITE",
        payload: {
          leadId: current.leadId,
          content: current.content,
          letterInput: current.letterInput,
        },
        signal,
      });
      persistResult({
        ...current,
        content: rewritten.content,
        attorneyVerified: true,
      });
      setUpsellState("accepted");
    },
    [persistResult]
  );

  const startCheckout = useCallback(
    async (current: LetterResult) => {
      trackClientEvent("PAYMENT_STARTED", {
        entityId: current.leadId,
        category: current.letterInput.category,
        senderType: current.letterInput.senderType,
        hasEvidence: !!current.letterInput.evidence?.length,
      });
      trackedPaymentFailure.current = false;
      setIgnoreReturnFailure(true);
      setPaymentError(null);
      clearPaymentQuery();
      setIsUpgrading(true);
      setUpgradeStep("pay");
      try {
        const payRes = await fetch("/api/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: current.leadId }),
        });
        const body = (await payRes.json()) as {
          checkoutUrl?: string;
          alreadyPaid?: boolean;
          error?: string;
        };
        if (!payRes.ok) {
          throw new Error(body.error ?? "שגיאה בפתיחת התשלום");
        }
        if (body.alreadyPaid) {
          setUpgradeStep("processing");
          router.replace("/result?payment=success", { scroll: false });
          return;
        }
        if (!body.checkoutUrl) {
          throw new Error("לא התקבל קישור תשלום");
        }
        window.location.assign(body.checkoutUrl);
      } catch (err) {
        setIsUpgrading(false);
        setUpgradeStep(null);
        setPaymentError(
          err instanceof Error ? err.message : "שגיאה בפתיחת התשלום"
        );
      }
    },
    [clearPaymentQuery, router]
  );

  useEffect(() => {
    if (!result || result.attorneyVerified || paymentReturn) return;
    if (!hasPendingProcessingJob(`attorney-rewrite:${result.leadId}`)) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsUpgrading(true);
      setUpgradeStep("rewrite");
      try {
        await runAttorneyRewrite(result, controller.signal);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setPaymentError(
            error instanceof Error
              ? error.message
              : "שחזור השכתוב נכשל. נסה שוב."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsUpgrading(false);
          setUpgradeStep(null);
        }
      }
    }, 0);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [paymentReturn, result, runAttorneyRewrite]);

  useEffect(() => {
    if (!result || paymentReturn !== "failure" || ignoreReturnFailure) {
      return;
    }
    if (trackedPaymentFailure.current) return;
    trackedPaymentFailure.current = true;
    trackClientEvent("PAYMENT_FAILED", { entityId: result.leadId });
  }, [ignoreReturnFailure, paymentReturn, result]);

  useEffect(() => {
    if (!result || paymentReturn !== "success") return;

    if (result.attorneyVerified) {
      downloadSignedPdf(result);
      clearPaymentQuery();
      return;
    }

    let cancelled = false;
    const poll = async () => {
      const res = await fetch(
        `/api/payment/status?leadId=${encodeURIComponent(result.leadId)}`
      );
      if (!res.ok) {
        throw new Error("לא הצלחנו לבדוק את סטטוס התשלום");
      }
      const body = (await res.json()) as {
        status: string;
        rewriteReady: boolean;
        content?: string;
      };
      if (cancelled) return false;
      if (body.status === "failed") {
        markPaymentFailed(
          result.leadId,
          "התשלום נכשל. אפשר לנסות שוב בלי לאבד את המכתב."
        );
        clearPaymentQuery();
        return true;
      }
      if (body.status === "completed" && body.rewriteReady && body.content) {
        const next = {
          ...result,
          content: body.content,
          attorneyVerified: true,
        };
        persistResult(next);
        setUpsellState("accepted");
        downloadSignedPdf(next);
        clearPaymentQuery();
        return true;
      }
      if (body.status === "completed") {
        setUpgradeStep("rewrite");
      }
      return false;
    };

    let timer: number | undefined;
    const tick = async () => {
      try {
        const done = await poll();
        if (!done && !cancelled) {
          timer = window.setTimeout(tick, POLL_INTERVAL_MS);
        } else if (done) {
          setIsUpgrading(false);
          setUpgradeStep(null);
        }
      } catch (error) {
        if (cancelled) return;
        setPaymentError(
          error instanceof Error ? error.message : "שגיאה בבדיקת התשלום"
        );
        setIsUpgrading(false);
        setUpgradeStep(null);
      }
    };
    void tick();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [
    clearPaymentQuery,
    downloadSignedPdf,
    markPaymentFailed,
    persistResult,
    paymentReturn,
    result,
  ]);

  const handleAcceptUpsell = async () => {
    if (!result) return;
    await startCheckout(result);
  };

  const handleDeclineUpsell = () => {
    setUpsellState("declined");
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--color-accent)]/20 border-t-[var(--color-accent)] animate-spin" />
      </div>
    );
  }

  const showDownload = upsellState === "accepted" || upsellState === "declined";
  const withSignature = upsellState === "accepted";
  const attorneyVerified =
    upsellState === "accepted" && !!result.attorneyVerified;
  const waitingForProvider =
    paymentReturn === "success" && !result.attorneyVerified;
  const overlayStep: UpgradeStep | null =
    isUpgrading && upgradeStep
      ? upgradeStep
      : waitingForProvider
        ? (upgradeStep ?? "processing")
        : null;
  const queryFailure =
    paymentReturn === "failure" && !ignoreReturnFailure
      ? "התשלום לא הושלם. אפשר לנסות שוב בלי לאבד את המכתב."
      : null;
  const displayError = paymentError ?? queryFailure;

  return (
    <div className="min-h-screen bg-[var(--color-bg)]" dir="rtl">
      <LeaveLetterDialog
        open={dialogOpen}
        isPaid={isPaid}
        onStay={cancelLeave}
        onLeave={confirmLeave}
      />

      <header className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg)]/80 backdrop-blur-xl fixed top-0 left-0 right-0 z-50">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => requestLeave("/")}
            className="text-sm text-[var(--color-body)] hover:text-[var(--color-ink)] transition-colors flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
          >
            <IconArrowRight size={14} />
            דף הבית
          </button>
          <div className="flex items-center gap-2 text-sm text-[var(--color-success)]">
            <IconCheck size={16} />
            <span>המכתב מוכן</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-24 pb-16 flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[var(--color-ink)] mb-3">
            המכתב שלך מוכן
          </h1>
          <p className="text-[var(--color-body)] text-base mb-4">
            מכתב התראה מקצועי מוכן לשליחה אל {result.letterInput.respondentName}
          </p>
          <LetterNotSavedWarning />
        </div>

        {overlayStep && <AttorneyUpgradeOverlay step={overlayStep} />}

        {displayError && (
          <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col gap-3">
            <p className="text-sm text-[var(--color-ink)]">{displayError}</p>
            <Button variant="primary" onClick={handleAcceptUpsell}>
              נסה תשלום שוב
            </Button>
          </div>
        )}

        <LetterDisplay
          content={result.content}
          senderName={result.letterInput.senderName}
          senderPhone={result.letterInput.senderPhone}
          senderEmail={result.letterInput.senderEmail}
          respondentName={result.letterInput.respondentName}
          withSignatureBlur={
            upsellState === "pending" && !isUpgrading && !waitingForProvider
          }
          attorneyVerified={attorneyVerified}
          leadId={result.leadId}
        />

        {upsellState === "pending" &&
          !isUpgrading &&
          !waitingForProvider &&
          !displayError && (
          <UpsellBlock
            upsellMessage={result.upsellMessage}
            onAccept={handleAcceptUpsell}
            onDecline={handleDeclineUpsell}
            isLoading={isUpgrading}
          />
        )}

        {upsellState === "declined" && (
          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3">
            <p className="text-sm text-[var(--color-body)]">
              רוצה בכל זאת מכתב בשם עו&quot;ד עם חתימה?
            </p>
            <button
              onClick={() => setUpsellState("pending")}
              className="text-sm font-medium text-[var(--color-accent)] hover:opacity-80 transition-opacity whitespace-nowrap bg-transparent border-0 cursor-pointer"
            >
              שדרג עכשיו
            </button>
          </div>
        )}

        {upsellState === "accepted" && attorneyVerified && (
          <div className="p-5 rounded-xl bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 flex items-center gap-3">
            <IconCheck size={20} className="text-[var(--color-success)] flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[var(--color-success)]">
                שודרג למכתב בשם {attorneyShortLabel()}
              </p>
              <p className="text-xs text-[var(--color-body)] mt-0.5">
                הניסוח עודכן ללשון ייצוג, כולל חתימה מאומתת
              </p>
            </div>
          </div>
        )}

        {showDownload && !isUpgrading && !waitingForProvider && (
          <DownloadSection
            leadId={result.leadId}
            fileName={result.fileName}
            content={result.content}
            letterInput={result.letterInput}
            withSignature={withSignature}
          />
        )}

        <div className="border-t border-white/[0.04] pt-8 text-center">
          <p className="text-xs text-[var(--color-subtle)]">
            מכתבי ההתראה מיוצרים באמצעות AI ואינם מהווים ייעוץ משפטי.
            לתביעות מורכבות מומלץ להתייעץ עם עורך דין.
          </p>
          <button
            type="button"
            onClick={() => requestLeave("/wizard")}
            className="text-xs text-[var(--color-accent)] hover:opacity-80 transition-opacity mt-3 inline-block bg-transparent border-0 cursor-pointer"
          >
            ייצר מכתב נוסף
          </button>
        </div>
      </main>
    </div>
  );
}
