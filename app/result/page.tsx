"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LetterDisplay } from "@/components/result/LetterDisplay";
import { UpsellBlock } from "@/components/result/UpsellBlock";
import { DownloadSection } from "@/components/result/DownloadSection";
import { IconCheck, IconArrowRight } from "@tabler/icons-react";
import type { LetterInput } from "@/lib/types";
import { attorneyShortLabel } from "@/lib/attorney";

interface LetterResult {
  leadId: string;
  letterId: string;
  content: string;
  upsellMessage: string;
  fileName: string;
  letterInput: LetterInput;
  attorneyVerified?: boolean;
}

type UpsellState = "pending" | "accepted" | "declined";

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<LetterResult | null>(null);
  const [upsellState, setUpsellState] = useState<UpsellState>("pending");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeStep, setUpgradeStep] = useState<"pay" | "rewrite" | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("letterResult");
    if (!stored) {
      router.replace("/wizard");
      return;
    }
    try {
      const parsed = JSON.parse(stored) as LetterResult;
      setResult(parsed);
      if (parsed.attorneyVerified) {
        setUpsellState("accepted");
      }
    } catch {
      router.replace("/wizard");
    }
  }, [router]);

  const persistResult = (next: LetterResult) => {
    setResult(next);
    localStorage.setItem("letterResult", JSON.stringify(next));
  };

  const handleAcceptUpsell = async () => {
    if (!result) return;
    setIsUpgrading(true);
    setUpgradeStep("pay");
    try {
      const payRes = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: result.leadId }),
      });
      if (!payRes.ok) throw new Error("שגיאה בתשלום");

      setUpgradeStep("rewrite");
      const rewriteRes = await fetch("/api/attorney-rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: result.leadId,
          content: result.content,
          letterInput: result.letterInput,
        }),
      });
      const data = await rewriteRes.json();
      if (!rewriteRes.ok) {
        throw new Error(data.error || "שגיאה בניסוח מחדש");
      }

      persistResult({
        ...result,
        content: data.content,
        attorneyVerified: true,
      });
      setUpsellState("accepted");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "שגיאה בעיבוד. נסה שוב.";
      alert(msg);
    } finally {
      setIsUpgrading(false);
      setUpgradeStep(null);
    }
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
  const attorneyVerified = upsellState === "accepted" && !!result.attorneyVerified;

  return (
    <div className="min-h-screen bg-[var(--color-bg)]" dir="rtl">
      <header className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg)]/80 backdrop-blur-xl fixed top-0 left-0 right-0 z-50">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-[var(--color-body)] hover:text-[var(--color-ink)] transition-colors flex items-center gap-1"
          >
            <IconArrowRight size={14} />
            דף הבית
          </Link>
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
          <p className="text-[var(--color-body)] text-base">
            מכתב התראה מקצועי מוכן לשליחה אל {result.letterInput.respondentName}
          </p>
        </div>

        {isUpgrading && (
          <div className="rounded-lg border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 px-5 py-4 text-sm text-[var(--color-ink)]">
            {upgradeStep === "pay"
              ? "מאשר תשלום..."
              : `מנסח מחדש בשם ${attorneyShortLabel()}...`}
          </div>
        )}

        <LetterDisplay
          content={result.content}
          senderName={result.letterInput.senderName}
          respondentName={result.letterInput.respondentName}
          withSignatureBlur={upsellState === "pending" && !isUpgrading}
          attorneyVerified={attorneyVerified}
        />

        {upsellState === "pending" && !isUpgrading && (
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

        {showDownload && !isUpgrading && (
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
          <Link
            href="/wizard"
            className="text-xs text-[var(--color-accent)] hover:opacity-80 transition-opacity mt-3 inline-block"
          >
            ייצר מכתב נוסף
          </Link>
        </div>
      </main>
    </div>
  );
}
