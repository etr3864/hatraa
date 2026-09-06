"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { VoiceRecorder } from "@/components/ui/VoiceRecorder";
import { StepHeading } from "@/components/wizard/StepHeading";
import { IconKeyboard, IconMicrophone } from "@tabler/icons-react";
import type { AudioInput } from "@/lib/types";
import { base64ToBlob, uploadFileForJob } from "@/lib/job-upload";

type InputMode = "text" | "voice";

interface FreeInputStepProps {
  onContinue: (rawInput: string, audioData?: AudioInput) => void;
  isProcessing: boolean;
  initialText?: string;
}

export function FreeInputStep({ onContinue, isProcessing, initialText }: FreeInputStepProps) {
  const [mode, setMode] = useState<InputMode | null>(initialText ? "text" : null);
  const [text, setText] = useState(initialText || "");
  const [voiceError, setVoiceError] = useState("");
  const [pendingAudio, setPendingAudio] = useState<AudioInput | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);

  const handleAudioReady = async (base64: string, mimeType: string) => {
    setVoiceError("");
    setIsUploadingAudio(true);
    try {
      const normalizedType = mimeType.split(";")[0] || "audio/webm";
      const storage = await uploadFileForJob({
        body: base64ToBlob(base64, normalizedType),
        name: "recording.webm",
        type: normalizedType,
      });
      setPendingAudio({ base64, mimeType: normalizedType, storage });
      setMode("voice");
    } catch (error) {
      setVoiceError(
        error instanceof Error ? error.message : "העלאת ההקלטה נכשלה"
      );
    } finally {
      setIsUploadingAudio(false);
    }
  };

  const handleContinue = () => {
    if (pendingAudio) {
      onContinue("", pendingAudio);
    } else if (text.trim().length >= 20) {
      onContinue(text.trim());
    }
  };

  const canContinue =
    pendingAudio !== null || (mode === "text" && text.trim().length >= 20);

  return (
    <div className="flex flex-col gap-8">
      <StepHeading
        kicker="שלב 1 · הסיפור"
        title="מה קרה?"
        subtitle="בלי שפה משפטית, בלי טפסים. רק הסיפור."
      />

      {!mode && (
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setMode("text")} className="wizard-mode">
            <span className="wizard-mode-icon">
              <IconKeyboard size={20} />
            </span>
            <span className="text-sm font-semibold text-[var(--color-ink)]">לכתוב</span>
            <span className="text-xs text-[var(--color-subtle)]">במילים חופשיות</span>
          </button>
          <button type="button" onClick={() => setMode("voice")} className="wizard-mode">
            <span className="wizard-mode-icon">
              <IconMicrophone size={20} />
            </span>
            <span className="text-sm font-semibold text-[var(--color-ink)]">להקליט</span>
            <span className="text-xs text-[var(--color-subtle)]">לספר בקול</span>
          </button>
        </div>
      )}

      {mode === "text" && (
        <div className="flex flex-col gap-4">
          <Textarea
            placeholder="למשל: חברת הביטוח לא השיבה כבר חודשיים. פניתי אליהם שלוש פעמים ואמרו שיחזרו, אבל כלום לא קורה..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            autoFocus
            className="text-base rounded-xl min-h-[180px]"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-subtle)]">
              {text.length < 20 ? `עוד ${20 - text.length} תווים לפחות` : "אפשר להמשיך"}
            </span>
            <button
              type="button"
              onClick={() => {
                setMode(null);
                setText("");
              }}
              className="text-xs text-[var(--color-subtle)] hover:text-[var(--color-accent)] transition-colors"
            >
              חזרה לבחירה
            </button>
          </div>
        </div>
      )}

      {mode === "voice" && (
        <div className="flex flex-col gap-4">
          {pendingAudio ? (
            <div className="wizard-panel text-center py-8">
              <p className="text-sm font-medium text-[var(--color-success)]">
                ההקלטה מוכנה. אפשר להמשיך
              </p>
            </div>
          ) : (
            <div className="wizard-panel py-8">
              <VoiceRecorder
                onAudioReady={handleAudioReady}
                onError={(msg) => {
                  setVoiceError(msg);
                  setMode("text");
                }}
                disabled={isUploadingAudio}
              />
            </div>
          )}

          {pendingAudio && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-[var(--color-subtle)] text-center">
                רוצים להוסיף פרטים בכתיבה?
              </p>
              <Textarea
                placeholder="הוספות אופציונליות..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="rounded-xl"
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setMode(null);
              setPendingAudio(null);
            }}
            className="text-xs text-[var(--color-subtle)] hover:text-[var(--color-accent)] transition-colors text-center"
          >
            חזרה לבחירה
          </button>
        </div>
      )}

      {voiceError && (
        <p className="text-sm text-[var(--color-error)] text-center">{voiceError}</p>
      )}

      {(mode === "text" || (mode === "voice" && pendingAudio)) && canContinue && (
        <Button
          variant="primary"
          fullWidth
          onClick={handleContinue}
          disabled={!canContinue}
          isLoading={isProcessing || isUploadingAudio}
        >
          המשך
        </Button>
      )}
    </div>
  );
}
