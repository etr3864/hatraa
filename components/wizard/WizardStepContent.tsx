"use client";

import { ConfirmStep, type ConfirmData } from "./ConfirmStep";
import { ContactStep, type ContactData } from "./ContactStep";
import { EvidenceStep } from "./EvidenceStep";
import { FreeInputStep } from "./FreeInputStep";
import { GeneratingLoader } from "./GeneratingLoader";
import { ToneStep } from "./ToneStep";
import type {
  AudioInput,
  EvidenceFile,
  ExtractedData,
  Goal,
  Tone,
} from "@/lib/types";

export type WizardStep =
  | "input"
  | "evidence"
  | "extracting"
  | "confirm"
  | "tone"
  | "contact"
  | "generating";

export interface WizardViewData {
  rawInput: string;
  audioData?: AudioInput;
  evidenceFiles: EvidenceFile[];
  extractedData: ExtractedData | null;
  confirmData: ConfirmData | null;
  tone: Tone | null;
  goal: Goal | null;
  contactData: ContactData | null;
}

interface WizardStepContentProps {
  step: WizardStep;
  data: WizardViewData;
  error: string;
  isExtracting: boolean;
  isGenerating: boolean;
  isAudioMode: boolean;
  processingStage: string;
  topSlot?: React.ReactNode;
  onInput: (rawInput: string, audio?: AudioInput) => void;
  onEvidence: (files: EvidenceFile[]) => void;
  onSkipEvidence: () => void;
  onConfirm: (data: ConfirmData) => void;
  onTone: (tone: Tone, goal: Goal) => void;
  onContact: (data: ContactData) => void;
}

export function WizardStepContent(props: WizardStepContentProps) {
  const { step, data } = props;
  return (
    <main className="max-w-xl mx-auto px-6 pt-24 pb-16 min-h-screen flex flex-col justify-center">
      {props.topSlot}
      {props.error && (step === "input" || step === "evidence") && (
        <ErrorMessage message={props.error} className="mb-6" />
      )}

      {step === "input" && (
        <div key="input" className="wizard-step">
          <FreeInputStep
            onContinue={props.onInput}
            isProcessing={props.isExtracting}
            initialText={data.rawInput || undefined}
          />
        </div>
      )}

      {step === "evidence" && (
        <div key="evidence" className="wizard-step">
          <EvidenceStep
            initialFiles={
              data.evidenceFiles.length > 0 ? data.evidenceFiles : undefined
            }
            onContinue={props.onEvidence}
            onSkip={props.onSkipEvidence}
          />
        </div>
      )}

      {step === "extracting" && (
        <ProcessingStatus
          title={
            props.processingStage ||
            (props.isAudioMode
              ? "מתמלל ומנתח את ההקלטה..."
              : "מנתח את הפרטים...")
          }
          subtitle="אפשר לסגור את הדפדפן ולחזור מאוחר יותר"
        />
      )}

      {step === "confirm" && data.extractedData && (
        <div key="confirm" className="wizard-step">
          <ConfirmStep
            extracted={data.extractedData}
            initialData={data.confirmData}
            onContinue={props.onConfirm}
          />
        </div>
      )}

      {step === "tone" && (
        <div key="tone" className="wizard-step">
          <ToneStep
            initialTone={data.tone}
            initialGoal={data.goal}
            onContinue={props.onTone}
          />
        </div>
      )}

      {step === "contact" && (
        <div key="contact" className="wizard-step">
          {props.error && <ErrorMessage message={props.error} className="mb-4" />}
          <ContactStep
            initialData={data.contactData}
            onContinue={props.onContact}
            isLoading={props.isGenerating}
          />
        </div>
      )}

      {step === "generating" && data.confirmData && data.tone ? (
        <GeneratingLoader
          respondentName={data.confirmData.respondentName}
          tone={data.tone}
          category={data.confirmData.category}
          userQuote={data.rawInput || data.confirmData.description}
          onMinimumElapsed={() => undefined}
        />
      ) : null}

      {step === "generating" && (!data.confirmData || !data.tone) && (
        <ProcessingStatus
          title={props.processingStage || "ממשיך ליצור את המכתב"}
          subtitle="אפשר לסגור את הדפדפן ולחזור מאוחר יותר"
        />
      )}
    </main>
  );
}

function ProcessingStatus(props: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-8 fade-in">
      <div className="w-12 h-12 rounded-full border-2 border-[var(--color-accent)]/20 border-t-[var(--color-accent)] animate-spin" />
      <div className="text-center">
        <p className="text-lg font-medium text-[var(--color-ink)] mb-2">
          {props.title}
        </p>
        <p className="text-sm text-[var(--color-subtle)]">{props.subtitle}</p>
      </div>
    </div>
  );
}

function ErrorMessage(props: { message: string; className: string }) {
  return (
    <div
      className={`${props.className} p-4 rounded-xl bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 fade-in`}
    >
      <p className="text-sm text-[var(--color-error)]">{props.message}</p>
    </div>
  );
}

