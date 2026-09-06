"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ConfirmData } from "@/components/wizard/ConfirmStep";
import type { ContactData } from "@/components/wizard/ContactStep";
import { MouseGlow } from "@/components/ui/MouseGlow";
import { WizardChrome } from "@/components/wizard/WizardChrome";
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
import { deleteJobUploads } from "@/lib/job-upload";

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
  const [stepDir, setStepDir] = useState<"forward" | "back">("forward");

  const stepIndex = STEP_ORDER.indexOf(step);

  const goTo = useCallback((next: WizardStep, dir: "forward" | "back" = "forward") => {
    setStepDir(dir);
    setStep(next);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

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
          goTo("generating");
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
          goTo("extracting");
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
          goTo("confirm");
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setExtractError(
            error instanceof Error ? error.message : "שחזור העיבוד נכשל"
          );
          goTo("input", "back");
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
  }, [goTo, router]);

  const goBack = useCallback(() => {
    if (step === "evidence") {
      goTo("input", "back");
    } else if (step === "confirm") {
      goTo("evidence", "back");
    } else if (step === "tone") {
      goTo("confirm", "back");
    } else if (step === "contact") {
      goTo("tone", "back");
    }
  }, [goTo, step]);

  const confirmReset = useCallback(() => {
    if (!data.extractedData) {
      deleteJobUploads([
        ...data.evidenceFiles.map((file) => file.storage?.key),
        data.audioData?.storage?.key,
      ]);
    }
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
    goTo("input", "back");
  }, [data.audioData?.storage?.key, data.evidenceFiles, data.extractedData, goTo]);

  const confirmGoHome = useCallback(() => {
    if (step === "input" || step === "evidence") {
      deleteJobUploads([
        ...data.evidenceFiles.map((file) => file.storage?.key),
        data.audioData?.storage?.key,
      ]);
      clearWizardEvidence();
    }
    setShowHomeDialog(false);
    router.push("/");
  }, [data.audioData?.storage?.key, data.evidenceFiles, router, step]);

  const handleFreeInputContinue = useCallback(
    async (rawInput: string, audioData?: AudioInput) => {
      setData((prev) => ({
        ...prev,
        rawInput,
        audioData: audioData || undefined,
      }));
      goTo("evidence");
    },
    [goTo]
  );

  const runExtraction = async (
    rawInput: string,
    audioData: AudioInput | undefined,
    evidenceFiles: EvidenceFile[]
  ) => {
    const hasAudio = !!audioData;
    setIsAudioMode(hasAudio);
    setIsExtracting(true);
    goTo("extracting");
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
      goTo("confirm");
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "שגיאה בחילוץ הפרטים");
      goTo("evidence", "back");
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
    goTo("tone");
  }, [data.audioData, data.evidenceFiles.length, goTo]);

  const handleToneContinue = useCallback((tone: Tone, goal: Goal) => {
    setData((prev) => ({ ...prev, tone, goal }));
    goTo("contact");
  }, [goTo]);

  const handleContactContinue = useCallback(
    async (contactData: ContactData) => {
      setData((prev) => ({ ...prev, contactData }));
      setIsGenerating(true);
      goTo("generating");

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
          goTo("contact", "back");
          setIsGenerating(false);
          return;
        }
        const message = err instanceof Error ? err.message : "שגיאה בייצור המכתב";
        setExtractError(message);
        goTo("contact", "back");
        setIsGenerating(false);
      } finally {
        setAbortController(null);
      }
    },
    [data, goTo, router]
  );

  const confirmCancelGeneration = useCallback(() => {
    setShowCancelDialog(false);
    if (abortController) {
      abortController.abort();
    }
    setIsGenerating(false);
    goTo("contact", "back");
  }, [abortController, goTo]);

  return (
    <div className="wizard-shell relative" data-glow="studio" dir="rtl">
      <MouseGlow />
      <div className="wizard-shell-grain" aria-hidden />

      <WizardChrome
        step={step}
        stepIndex={stepIndex}
        totalSteps={STEP_ORDER.length}
        onHome={() => {
          if (step === "input" && !data.extractedData) {
            router.push("/");
          } else {
            setShowHomeDialog(true);
          }
        }}
        onBack={goBack}
        onCancel={() => setShowCancelDialog(true)}
      />

      <WizardStepContent
        step={step}
        stepDir={stepDir}
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
