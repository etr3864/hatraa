"use client";

import { useState, useEffect } from "react";
import {
  IconSearch,
  IconScale,
  IconPencil,
  IconCheck,
} from "@tabler/icons-react";
import type { Tone, Category } from "@/lib/types";
import { toneLabel, categoryLabel } from "@/lib/utils";
import { LOADER_MIN_MS } from "@/lib/constants";

const ICONS = {
  search: IconSearch,
  scale: IconScale,
  pencil: IconPencil,
  check: IconCheck,
} as const;

type IconKey = keyof typeof ICONS;

interface Stage {
  text: string;
  icon: IconKey;
  duration: number;
}

interface GeneratingLoaderProps {
  respondentName: string;
  tone: Tone;
  category?: Category;
  userQuote: string;
  onMinimumElapsed: () => void;
}

export function GeneratingLoader({
  respondentName,
  tone,
  category,
  onMinimumElapsed,
}: GeneratingLoaderProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [visible, setVisible] = useState(true);

  const catLabel = category ? categoryLabel(category) : "המקרה";

  const stages: Stage[] = [
    {
      text: `מנתח את המקרה מול ${respondentName}...`,
      icon: "search",
      duration: 3500,
    },
    {
      text: `מאתר סעיפי חוק רלוונטיים ב${catLabel}...`,
      icon: "scale",
      duration: 4500,
    },
    {
      text: `מנסח מכתב בטון ${toneLabel(tone)}...`,
      icon: "pencil",
      duration: 4500,
    },
  ];

  useEffect(() => {
    let elapsed = 0;
    let stageIdx = 0;

    const advanceStage = () => {
      if (stageIdx >= stages.length - 1) {
        if (elapsed >= LOADER_MIN_MS) {
          onMinimumElapsed();
        } else {
          setTimeout(onMinimumElapsed, LOADER_MIN_MS - elapsed);
        }
        return;
      }

      const duration = stages[stageIdx].duration;
      elapsed += duration;
      stageIdx++;

      setTimeout(() => {
        setVisible(false);
        setTimeout(() => {
          setCurrentStage(stageIdx);
          setVisible(true);
          advanceStage();
        }, 200);
      }, duration);
    };

    advanceStage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stage = stages[currentStage];
  const Icon = ICONS[stage.icon];
  const progress = Math.round(((currentStage + 1) / stages.length) * 100);

  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] gap-8 px-4">
      <div
        className={`flex flex-col items-center gap-5 transition-opacity duration-150 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="w-12 h-12 rounded-lg bg-white border border-[var(--color-border)] flex items-center justify-center">
          <Icon size={22} stroke={1.5} className="text-[var(--color-primary)]" />
        </div>

        <p className="text-center font-medium max-w-xs leading-relaxed text-base text-[var(--color-ink)]">
          {stage.text}
        </p>
      </div>

      <div className="w-48 h-1 rounded-full bg-[var(--color-muted)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-xs text-[var(--color-subtle)] flex items-center gap-1.5">
        <IconCheck size={14} stroke={1.5} />
        מכינים את המכתב שלך...
      </p>
    </div>
  );
}
