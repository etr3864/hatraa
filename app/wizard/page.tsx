"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { IconArrowRight } from "@tabler/icons-react";
import { FreeInputStep } from "@/components/wizard/FreeInputStep";
import { EvidenceStep } from "@/components/wizard/EvidenceStep";
import { ConfirmStep, type ConfirmData } from "@/components/wizard/ConfirmStep";
import { ToneStep } from "@/components/wizard/ToneStep";
import { ContactStep, type ContactData } from "@/components/wizard/ContactStep";
import { GeneratingLoader } from "@/components/wizard/GeneratingLoader";
import { Button } from "@/components/ui/Button";
import type { ExtractedData, Tone, Goal, Category, EvidenceFile } from "@/lib/types";

type Step = "input" | "evidence" | "extracting" | "confirm" | "tone" | "contact" | "generating";

interface WizardData {
  rawInput: string;
  audioData?: { base64: string; mimeType: string };
  evidenceFiles: EvidenceFile[];
  extractedData: ExtractedData | null;
  confirmData: ConfirmData | null;
  tone: Tone | null;
  goal: Goal | null;
  contactData: ContactData | null;
}

const STEP_LABELS: Partial<Record<Step, string>> = {
  input: "ספר לנו",
  evidence: "ראיות",
  confirm: "אשר פרטים",
  tone: "טון ומטרה",
  contact: "הפרטים שלך",
};

const STEP_ORDER: Step[] = ["input", "evidence", "confirm", "tone", "contact"];

export default function WizardPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [data, setData] = useState<WizardData>({
    rawInput: "",
    audioData: undefined,
    evidenceFiles: [],
    extractedData: null,
    confirmData: null,
    tone: null,
    goal: null,
    contactData: null,
  });
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [isAudioMode, setIsAudioMode] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showHomeDialog, setShowHomeDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const stepIndex = STEP_ORDER.indexOf(step);

  const goBack = useCallback(() => {
    if (step === "evidence") {
      setStep("input");
    } else if (step === "confirm") {
      setStep("evidence");
    } else if (step === "tone") {
      setStep("confirm");
    } else if (step === "contact") {
      setStep("tone");
    }
  }, [step]);

  const confirmReset = useCallback(() => {
    setShowResetDialog(false);
    setData((prev) => ({
      ...prev,
      extractedData: null,
      confirmData: null,
      evidenceFiles: [],
      audioData: undefined,
      tone: null,
      goal: null,
      contactData: null,
    }));
    setStep("input");
  }, []);

  const confirmGoHome = useCallback(() => {
    setShowHomeDialog(false);
    router.push("/");
  }, [router]);

  const handleFreeInputContinue = useCallback(
    async (rawInput: string, audioData?: { base64: string; mimeType: string }) => {
      setData((prev) => ({
        ...prev,
        rawInput,
        audioData: audioData || undefined,
      }));
      setStep("evidence");
    },
    []
  );

  const runExtraction = async (rawInput: string, audioData: { base64: string; mimeType: string } | undefined, evidenceFiles: EvidenceFile[]) => {
    const hasAudio = !!audioData;
    setIsAudioMode(hasAudio);
    setIsExtracting(true);
    setStep("extracting");
    setExtractError("");

    try {
      const body: Record<string, unknown> = audioData
        ? { audio: audioData.base64, mimeType: audioData.mimeType }
        : { text: rawInput };

      if (evidenceFiles.length > 0) {
        body.evidence = evidenceFiles.map((f) => ({
          name: f.name,
          type: f.type,
          base64: f.base64,
          description: f.description,
        }));
      }

      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const responseJson = await res.json();

      if (!res.ok || (responseJson as { error?: string }).error) {
        throw new Error((responseJson as { error?: string }).error || "שגיאה בחילוץ");
      }

      const extracted = responseJson as ExtractedData;

      setData((prev) => ({
        ...prev,
        rawInput: rawInput || extracted.rawTranscription || "",
        extractedData: extracted,
      }));
      setStep("confirm");
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "שגיאה בחילוץ הפרטים");
      setStep("evidence");
    } finally {
      setIsExtracting(false);
      setIsAudioMode(false);
    }
  };

  const handleEvidenceContinue = useCallback(
    (evidenceFiles: EvidenceFile[]) => {
      setData((prev) => {
        const updated = { ...prev, evidenceFiles };
        runExtraction(updated.rawInput, updated.audioData, evidenceFiles);
        return updated;
      });
    },
    []
  );

  const handleEvidenceSkip = useCallback(() => {
    setData((prev) => {
      const updated = { ...prev, evidenceFiles: [] };
      runExtraction(updated.rawInput, updated.audioData, []);
      return updated;
    });
  }, []);

  const handleConfirmContinue = useCallback((confirmData: ConfirmData) => {
    setData((prev) => ({ ...prev, confirmData }));
    setStep("tone");
  }, []);

  const handleToneContinue = useCallback((tone: Tone, goal: Goal) => {
    setData((prev) => ({ ...prev, tone, goal }));
    setStep("contact");
  }, []);

  const handleContactContinue = useCallback(
    async (contactData: ContactData) => {
      setData((prev) => ({ ...prev, contactData }));
      setIsGenerating(true);
      setStep("generating");

      const controller = new AbortController();
      setAbortController(controller);

      try {
        const { confirmData, tone, goal, rawInput, extractedData, evidenceFiles } = data;

        const senderAddress = `${contactData.senderStreet}, ${contactData.senderCity}${contactData.senderZip ? ` ${contactData.senderZip}` : ""}`;

        const payload: Record<string, unknown> = {
          category: confirmData?.category as Category,
          respondentName: confirmData?.respondentName,
          respondentAddress: confirmData?.respondentAddress,
          eventDate: confirmData?.eventDate,
          amount: confirmData?.amount,
          description: confirmData?.description,
          tone,
          goal,
          rawInput,
          extractedData,
          senderType: contactData.senderType,
          senderName: contactData.senderName,
          senderAddress,
          senderPhone: contactData.senderPhone,
          senderEmail: contactData.senderEmail,
          senderIdNumber: contactData.senderIdNumber || undefined,
          companyName: contactData.companyName || undefined,
          companyNumber: contactData.companyNumber || undefined,
          signatoryRole: contactData.signatoryRole || undefined,
        };

        if (evidenceFiles.length > 0) {
          payload.evidence = evidenceFiles.map((f) => ({
            name: f.name,
            type: f.type,
            base64: f.base64,
            description: f.description,
          }));
        }

        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        const result = await res.json();

        if (!res.ok || result.error) {
          throw new Error(result.error || "שגיאה בייצור המכתב");
        }

        localStorage.setItem(
          "letterResult",
          JSON.stringify({
            ...result,
            letterInput: { ...payload, senderAddress },
          })
        );

        router.push("/result");
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setStep("contact");
          setIsGenerating(false);
          return;
        }
        const message = err instanceof Error ? err.message : "שגיאה בייצור המכתב";
        setExtractError(message);
        setStep("contact");
        setIsGenerating(false);
      } finally {
        setAbortController(null);
      }
    },
    [data, router]
  );

  const handleLoaderDone = useCallback(() => {
    // Loader signals minimum time passed
  }, []);

  const confirmCancelGeneration = useCallback(() => {
    setShowCancelDialog(false);
    if (abortController) {
      abortController.abort();
    }
    setIsGenerating(false);
    setStep("contact");
  }, [abortController]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]" dir="rtl">
      <header className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg)]/80 backdrop-blur-xl fixed top-0 left-0 right-0 z-50">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {step !== "generating" && step !== "extracting" && (
              <button
                onClick={() => {
                  if (step === "input" && !data.extractedData) {
                    router.push("/");
                  } else {
                    setShowHomeDialog(true);
                  }
                }}
                className="text-sm text-[var(--color-body)] hover:text-[var(--color-ink)] transition-colors"
              >
                דף הבית
              </button>
            )}
            {stepIndex > 0 && step !== "generating" && step !== "extracting" && (
              <button
                onClick={goBack}
                className="flex items-center gap-1 text-sm text-[var(--color-body)] hover:text-[var(--color-ink)] transition-colors"
              >
                <IconArrowRight size={14} />
                <span>חזור</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            {step === "generating" && (
              <button
                onClick={() => setShowCancelDialog(true)}
                className="text-sm text-[var(--color-error)] hover:opacity-70 transition-opacity font-medium"
              >
                ביטול
              </button>
            )}
            {step !== "generating" && step !== "extracting" && (
              <span className="text-xs text-[var(--color-subtle)]">
                שלב {stepIndex + 1} מתוך 5
              </span>
            )}
          </div>
        </div>
      </header>

      {step !== "generating" && step !== "extracting" && stepIndex >= 0 && (
        <div className="fixed top-[65px] left-0 right-0 z-40">
          <div className="max-w-xl mx-auto px-6">
            <div className="h-0.5 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((stepIndex + 1) / STEP_ORDER.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <main className="max-w-xl mx-auto px-6 pt-24 pb-16 min-h-screen flex flex-col justify-center">
        {extractError && (step === "input" || step === "evidence") && (
          <div className="mb-6 p-4 rounded-xl bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 fade-in">
            <p className="text-sm text-[var(--color-error)]">{extractError}</p>
          </div>
        )}

        {step === "input" && (
          <div key="input" className="wizard-step">
            <FreeInputStep
              onContinue={handleFreeInputContinue}
              isProcessing={isExtracting}
              initialText={data.rawInput || undefined}
            />
          </div>
        )}

        {step === "evidence" && (
          <div key="evidence" className="wizard-step">
            <EvidenceStep
              initialFiles={data.evidenceFiles.length > 0 ? data.evidenceFiles : undefined}
              onContinue={handleEvidenceContinue}
              onSkip={handleEvidenceSkip}
            />
          </div>
        )}

        {step === "extracting" && (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-8 fade-in">
            <div className="w-12 h-12 rounded-full border-2 border-[var(--color-accent)]/20 border-t-[var(--color-accent)] animate-spin" />
            <div className="text-center">
              <p className="text-lg font-medium text-[var(--color-ink)] mb-2 text-reveal">
                {isAudioMode ? "מתמלל ומנתח את ההקלטה..." : "מנתח את הפרטים..."}
              </p>
              <p className="text-sm text-[var(--color-subtle)]">זה לוקח כמה שניות</p>
            </div>
          </div>
        )}

        {step === "confirm" && data.extractedData && (
          <div key="confirm" className="wizard-step">
            <ConfirmStep
              extracted={data.extractedData}
              initialData={data.confirmData}
              onContinue={handleConfirmContinue}
            />
          </div>
        )}

        {step === "tone" && (
          <div key="tone" className="wizard-step">
            <ToneStep
              initialTone={data.tone}
              initialGoal={data.goal}
              onContinue={handleToneContinue}
            />
          </div>
        )}

        {step === "contact" && (
          <div key="contact" className="wizard-step">
            {extractError && (
              <div className="mb-4 p-3 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 fade-in">
                <p className="text-sm text-[var(--color-error)]">{extractError}</p>
              </div>
            )}
            <ContactStep
              initialData={data.contactData}
              onContinue={handleContactContinue}
              isLoading={isGenerating}
            />
          </div>
        )}

        {step === "generating" && data.confirmData && data.tone && (
          <GeneratingLoader
            respondentName={data.confirmData.respondentName}
            tone={data.tone}
            category={data.confirmData.category}
            userQuote={data.rawInput || data.confirmData.description}
            onMinimumElapsed={handleLoaderDone}
          />
        )}
      </main>

      {showResetDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowResetDialog(false)}
          />
          <div className="relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl max-w-sm w-full p-8 flex flex-col gap-4 scale-in">
            <h3 className="text-lg font-bold text-[var(--color-ink)]">
              לחזור להתחלה?
            </h3>
            <p className="text-sm text-[var(--color-body)] leading-relaxed">
              חזרה לשלב הראשון תמחק את המידע שחולץ מההקלטה/הטקסט שלך.
              תצטרך לתאר שוב את המקרה.
            </p>
            <div className="flex gap-3 mt-2">
              <Button
                variant="primary"
                className="flex-1"
                onClick={confirmReset}
              >
                כן, התחל מחדש
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setShowResetDialog(false)}
              >
                ביטול
              </Button>
            </div>
          </div>
        </div>
      )}

      {showHomeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowHomeDialog(false)}
          />
          <div className="relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl max-w-sm w-full p-8 flex flex-col gap-4 scale-in">
            <h3 className="text-lg font-bold text-[var(--color-ink)]">
              לעזוב את הויזרד?
            </h3>
            <p className="text-sm text-[var(--color-body)] leading-relaxed">
              אם תחזור לדף הבית כל הנתונים שמילאת עד עכשיו יאבדו ותצטרך להתחיל מחדש.
            </p>
            <div className="flex gap-3 mt-2">
              <Button
                variant="primary"
                className="flex-1"
                onClick={confirmGoHome}
              >
                כן, חזור לדף הבית
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setShowHomeDialog(false)}
              >
                להישאר כאן
              </Button>
            </div>
          </div>
        </div>
      )}

      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCancelDialog(false)}
          />
          <div className="relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl max-w-sm w-full p-8 flex flex-col gap-4 scale-in">
            <h3 className="text-lg font-bold text-[var(--color-ink)]">
              לבטל את יצירת המכתב?
            </h3>
            <p className="text-sm text-[var(--color-body)] leading-relaxed">
              אם תבטל עכשיו, המכתב לא ייווצר. תוכל לחזור ולנסות שוב מאוחר יותר מבלי למלא את הפרטים מחדש.
            </p>
            <div className="flex gap-3 mt-2">
              <Button
                variant="ghost"
                className="flex-1 !border-[var(--color-error)] !text-[var(--color-error)]"
                onClick={confirmCancelGeneration}
              >
                כן, בטל
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => setShowCancelDialog(false)}
              >
                המשך ליצור
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
