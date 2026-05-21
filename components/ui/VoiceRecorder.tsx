"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { IconMicrophone, IconMicrophoneOff, IconPlayerStop } from "@tabler/icons-react";
import { clsx } from "@/lib/utils";
import { MAX_RECORDING_SECONDS } from "@/lib/constants";

type RecorderState = "idle" | "recording" | "processing";

interface VoiceRecorderProps {
  onAudioReady: (base64Audio: string, mimeType: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onAudioReady, onError, disabled }: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [bars, setBars] = useState<number[]>([0.3, 0.3, 0.3, 0.3, 0.3, 0.3]);
  const [supported, setSupported] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setSupported(false);
    }
  }, []);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const startWaveform = useCallback((stream: MediaStream) => {
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 32;
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const draw = () => {
      analyser.getByteFrequencyData(dataArray);
      const normalized = Array.from({ length: 6 }, (_, i) => {
        const val = dataArray[i * 2] / 255;
        return Math.max(0.15, val);
      });
      setBars(normalized);
      animationRef.current = requestAnimationFrame(draw);
    };
    draw();
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    stopAnimation();
    setBars([0.3, 0.3, 0.3, 0.3, 0.3, 0.3]);
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setState("processing");
  }, [stopAnimation]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          onAudioReady(base64, mimeType);
        };
        reader.readAsDataURL(blob);
      };

      recorder.start(100);
      setSeconds(0);
      setState("recording");
      startWaveform(stream);

      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_RECORDING_SECONDS) {
            stopRecording();
            return s;
          }
          return s + 1;
        });
      }, 1000);
    } catch {
      onError("לא הצלחנו לגשת למיקרופון. אפשר גם לכתוב את הסיפור שלך.");
    }
  }, [startWaveform, stopRecording, onAudioReady, onError]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopAnimation();
    };
  }, [stopAnimation]);

  if (!supported) return null;

  const isNearLimit = seconds >= MAX_RECORDING_SECONDS - 30;
  const timeDisplay = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-4">
      {state === "recording" && (
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="flex items-end gap-1 h-10">
            {bars.map((h, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full transition-all duration-75"
                style={{
                  height: `${h * 40}px`,
                  backgroundColor: "var(--color-primary)",
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
          <span
            className={clsx(
              "text-sm font-medium tabular-nums",
              isNearLimit
                ? "text-[var(--color-gold)]"
                : "text-[var(--color-subtle)]"
            )}
          >
            {timeDisplay} / 8:00
          </span>
        </div>
      )}

      {state === "recording" ? (
        <button
          onClick={stopRecording}
          className="flex items-center gap-2 rounded-lg px-5 py-3 bg-[var(--color-error)] text-white font-medium hover:opacity-85 transition-opacity"
        >
          <IconPlayerStop size={18} />
          עצור הקלטה
        </button>
      ) : (
        <button
          onClick={startRecording}
          disabled={disabled || state === "processing"}
          className={clsx(
            "flex items-center gap-2 rounded-lg px-5 py-3 font-medium transition-opacity",
            "border border-[var(--color-border)] text-[var(--color-accent)] bg-[var(--color-surface)]",
            "hover:border-[var(--color-primary)] hover:opacity-85",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {state === "processing" ? (
            <>
              <IconMicrophoneOff size={18} />
              מעבד הקלטה...
            </>
          ) : (
            <>
              <IconMicrophone size={18} />
              אני רוצה לדבר
            </>
          )}
        </button>
      )}
    </div>
  );
}
