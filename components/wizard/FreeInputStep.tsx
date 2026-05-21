"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { VoiceRecorder } from "@/components/ui/VoiceRecorder";
import { IconKeyboard, IconMicrophone } from "@tabler/icons-react";

type InputMode = "text" | "voice";

interface FreeInputStepProps {
  onContinue: (rawInput: string, audioData?: { base64: string; mimeType: string }) => void;
  isProcessing: boolean;
  initialText?: string;
}

export function FreeInputStep({ onContinue, isProcessing, initialText }: FreeInputStepProps) {
  const [mode, setMode] = useState<InputMode | null>(initialText ? "text" : null);
  const [text, setText] = useState(initialText || "");
  const [voiceError, setVoiceError] = useState("");
  const [pendingAudio, setPendingAudio] = useState<{ base64: string; mimeType: string } | null>(null);

  const handleAudioReady = (base64: string, mimeType: string) => {
    setPendingAudio({ base64, mimeType });
    setMode("voice");
  };

  const handleContinue = () => {
    if (pendingAudio) {
      onContinue("", pendingAudio);
    } else if (text.trim().length >= 20) {
      onContinue(text.trim());
    }
  };

  const canContinue =
    (pendingAudio !== null) || (mode === "text" && text.trim().length >= 20);

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-[var(--color-ink)] mb-3">
          ספר לנו מה קרה
        </h2>
        <p className="text-[var(--color-body)] text-base max-w-sm mx-auto">
          בלי שפה משפטית, בלי טפסים. רק תספר את הסיפור שלך
        </p>
      </div>

      {!mode && (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setMode("text")}
            className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-elevated)] transition-all duration-200 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--color-elevated)] border border-[var(--color-border)] flex items-center justify-center group-hover:border-[var(--color-accent)]/40 transition-colors">
              <IconKeyboard size={22} className="text-[var(--color-accent)]" />
            </div>
            <span className="text-sm font-medium text-[var(--color-ink)]">
              אני מעדיף לכתוב
            </span>
          </button>

          <div
            className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-elevated)] transition-all duration-200 cursor-pointer group"
            onClick={() => setMode("voice")}
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--color-elevated)] border border-[var(--color-border)] flex items-center justify-center group-hover:border-[var(--color-accent)]/40 transition-colors">
              <IconMicrophone size={22} className="text-[var(--color-accent)]" />
            </div>
            <span className="text-sm font-medium text-[var(--color-ink)]">
              אני מעדיף להקליט
            </span>
          </div>
        </div>
      )}

      {mode === "text" && (
        <div className="flex flex-col gap-4">
          <Textarea
            placeholder="למשל: חברת הביטוח לא השיבה כבר חודשיים. פניתי אליהם שלוש פעמים ואמרו שיחזרו אליי אבל כלום לא קורה..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={7}
            autoFocus
            className="text-base"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-subtle)]">
              {text.length < 20 ? `עוד ${20 - text.length} תווים לפחות` : ""}
            </span>
            <button
              onClick={() => { setMode(null); setText(""); }}
              className="text-xs text-[var(--color-subtle)] hover:text-[var(--color-accent)] transition-colors"
            >
              חזור לבחירה
            </button>
          </div>
        </div>
      )}

      {mode === "voice" && (
        <div className="flex flex-col gap-4">
          {pendingAudio ? (
            <div className="p-6 rounded-xl bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 text-center">
              <p className="text-sm font-medium text-[var(--color-success)]">
                ההקלטה מוכנה. לחץ המשך
              </p>
            </div>
          ) : (
            <VoiceRecorder
              onAudioReady={handleAudioReady}
              onError={(msg) => {
                setVoiceError(msg);
                setMode("text");
              }}
            />
          )}

          {pendingAudio && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-[var(--color-subtle)] text-center">
                רוצה להוסיף פרטים בכתיבה?
              </p>
              <Textarea
                placeholder="הוספות אופציונליות..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <button
            onClick={() => { setMode(null); setPendingAudio(null); }}
            className="text-xs text-[var(--color-subtle)] hover:text-[var(--color-accent)] transition-colors text-center"
          >
            חזור לבחירה
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
          isLoading={isProcessing}
          className="rounded-xl py-4"
        >
          המשך
        </Button>
      )}
    </div>
  );
}
