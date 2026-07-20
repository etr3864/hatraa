"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconArrowRight } from "@tabler/icons-react";
import type { ConfirmData } from "@/components/wizard/ConfirmStep";
import type { ContactData } from "@/components/wizard/ContactStep";
import { WizardDialogs } from "@/components/wizard/WizardDialogs";
import { ResumeLetterBanner } from "@/components/wizard/ResumeLetterBanner";
import {
  WizardStepContent,
  type WizardStep,
  type WizardViewData,
} from "@/components/wizard/WizardStepContent";
import { LETTER_RESULT_KEY } from "@/lib/letter-result";
import type {
  AudioInput,
  ExtractedData,
  Tone,
  Goal,
  Category,
  EvidenceFile,
  LetterInput,
} from "@/lib/types";
import { trackClientEvent } from "@/lib/analytics";
import {
  clearWizardEvidence,
  rememberWizardEvidence,
  restoreWizardEvidence,
  runExtractionJob,
  runLetterGenerationJob,
} from "@/lib/wizard-jobs";
import {
  hasPendingProcessingJob,
  runProcessingJob,
} from "@/lib/processing-jobs";
import type { LetterGenerationJobResult } from "@/backend/services/jobs/types";

const STEP_ORDER: WizardStep[] = ["input", "evidence", "confirm", "tone", "contact"];

export default function WizardPage() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("input");
  const [data, setData] = useState<WizardViewData>(() => ({
    rawInput: "",
    audioData: undefined,
    evidenceFiles: [],
    extractedData: null,
    confirmData: null,
    tone: null,
    goal: null,
    contactData: null,
  }));
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [isAudioMode, setIsAudioMode] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showHomeDialog, setShowHomeDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [processingStage, setProcessingStage] = useState("");

  const stepIndex = STEP_ORDER.indexOf(step);

  useEffect(() => {
    trackClientEvent("WIZARD_STARTED");
  }, []);

  useEffect(() => {
    const restored = restoreWizardEvidence();
    if (restored.length > 0) {
      setData((current) => ({ ...current, evidenceFiles: restored }));
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        if (hasPendingProcessingJob("wizard-generation")) {
          setStep("generating");
          setIsGenerating(true);
          setProcessingStage("משחזר את יצירת המכתב");
          const result = await runProcessingJob<LetterGenerationJobResult>({
            scope: "wizard-generation",
            type: "LETTER_GENERATION",
            payload: {},
            signal: controller.signal,
            onProgress: (job) =>
              setProcessingStage(job.progressStage ?? "יוצר את המכתב"),
          });
          localStorage.setItem(LETTER_RESULT_KEY, JSON.stringify(result));
          clearWizardEvidence();
          router.push("/result");
          return;
        }

        if (hasPendingProcessingJob("wizard-extraction")) {
          setStep("extracting");
          setIsExtracting(true);
          setProcessingStage("משחזר את חילוץ הפרטים");
          const extracted = await runProcessingJob<ExtractedData>({
            scope: "wizard-extraction",
            type: "EXTRACTION",
            payload: {},
            signal: controller.signal,
            onProgress: (job) =>
              setProcessingStage(job.progressStage ?? "מחלץ פרטים"),
          });
          setData((previous) => ({
            ...previous,
            rawInput: extracted.rawTranscription || previous.rawInput,
            extractedData: extracted,
          }));
          setStep("confirm");
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setExtractError(
            error instanceof Error ? error.message : "שחזור העיבוד נכשל"
          );
          setStep("input");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsExtracting(false);
          setIsGenerating(false);
        }
      }
    }, 0);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [router]);

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
    clearWizardEvidence();
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
    async (rawInput: string, audioData?: AudioInput) => {
      setData((prev) => ({
        ...prev,
        rawInput,
        audioData: audioData || undefined,
      }));
      setStep("evidence");
    },
    []
  );

  const runExtraction = async (
    rawInput: string,
    audioData: AudioInput | undefined,
    evidenceFiles: EvidenceFile[]
  ) => {
    const hasAudio = !!audioData;
    setIsAudioMode(hasAudio);
    setIsExtracting(true);
    setStep("extracting");
    setExtractError("");
    setProcessingStage(hasAudio ? "מתמלל ומנתח" : "מנתח את הפרטים");

    try {
      const extracted = await runExtractionJob({
        rawInput,
        audioData,
        evidenceFiles,
        onProgress: setProcessingStage,
      });

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
      rememberWizardEvidence(evidenceFiles);
      setData((prev) => {
        const updated = { ...prev, evidenceFiles };
        runExtraction(updated.rawInput, updated.audioData, evidenceFiles);
        return updated;
      });
    },
    []
  );

  const handleEvidenceSkip = useCallback(() => {
    clearWizardEvidence();
    setData((prev) => {
      const updated = { ...prev, evidenceFiles: [] };
      runExtraction(updated.rawInput, updated.audioData, []);
      return updated;
    });
  }, []);

  const handleConfirmContinue = useCallback((confirmData: ConfirmData) => {
    setData((prev) => ({ ...prev, confirmData }));
    trackClientEvent("DETAILS_COMPLETED", {
      category: confirmData.category,
      inputMode: data.audioData ? "audio" : "text",
      hasEvidence: data.evidenceFiles.length > 0,
    });
    setStep("tone");
  }, [data.audioData, data.evidenceFiles.length]);

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
      setProcessingStage("מכין את יצירת המכתב");

      try {
        const { confirmData, tone, goal, rawInput, extractedData, evidenceFiles } = data;

        const senderAddress = `${contactData.senderStreet}, ${contactData.senderCity}${contactData.senderZip ? ` ${contactData.senderZip}` : ""}`;

        const letterInput: LetterInput = {
          category: confirmData?.category as Category,
          respondentName: confirmData?.respondentName || "",
          respondentAddress: confirmData?.respondentAddress || undefined,
          eventDate: confirmData?.eventDate || undefined,
          amount: confirmData?.amount || undefined,
          description: confirmData?.description || "",
          tone: tone as Tone,
          goal: goal as Goal,
          rawInput,
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

        const result = await runLetterGenerationJob({
          letterInput,
          extractedData,
          evidenceFiles,
          signal: controller.signal,
          onProgress: setProcessingStage,
        });

        localStorage.setItem(LETTER_RESULT_KEY, JSON.stringify(result));
        clearWizardEvidence();

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
                הפסק להמתין
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

      <WizardStepContent
        step={step}
        data={data}
        error={extractError}
        isExtracting={isExtracting}
        isGenerating={isGenerating}
        isAudioMode={isAudioMode}
        processingStage={processingStage}
        topSlot={
          step !== "generating" && step !== "extracting" ? (
            <ResumeLetterBanner />
          ) : null
        }
        onInput={handleFreeInputContinue}
        onEvidence={handleEvidenceContinue}
        onSkipEvidence={handleEvidenceSkip}
        onConfirm={handleConfirmContinue}
        onTone={handleToneContinue}
        onContact={handleContactContinue}
      />

      <WizardDialogs
        resetOpen={showResetDialog}
        homeOpen={showHomeDialog}
        cancelOpen={showCancelDialog}
        onCloseReset={() => setShowResetDialog(false)}
        onConfirmReset={confirmReset}
        onCloseHome={() => setShowHomeDialog(false)}
        onConfirmHome={confirmGoHome}
        onCloseCancel={() => setShowCancelDialog(false)}
        onConfirmCancel={confirmCancelGeneration}
      />
    </div>
  );
}
