"use client";

import { useState, useEffect } from "react";
import {
  IconSearch,
  IconScale,
  IconPencil,
  IconCheck,
  IconQuote,
  IconShieldCheck,
  IconFileText,
  IconGavel,
  IconEye,
  IconListCheck,
  IconSignature,
  IconSparkles,
} from "@tabler/icons-react";
import type { Tone, Category } from "@/lib/types";
import { toneLabel, categoryLabel, extractFirstSentence } from "@/lib/utils";
import { LOADER_MIN_MS } from "@/lib/constants";

const ICONS = {
  search: IconSearch,
  scale: IconScale,
  pencil: IconPencil,
  check: IconCheck,
  quote: IconQuote,
  shield: IconShieldCheck,
  file: IconFileText,
  gavel: IconGavel,
  eye: IconEye,
  list: IconListCheck,
  signature: IconSignature,
  sparkles: IconSparkles,
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
  userQuote,
  onMinimumElapsed,
}: GeneratingLoaderProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [visible, setVisible] = useState(true);

  const quote = extractFirstSentence(userQuote);
  const catLabel = category ? categoryLabel(category) : "המקרה";

  const stages: Stage[] = [
    {
      text: `מנתח את המקרה שלך מול ${respondentName}...`,
      icon: "search",
      duration: 4000,
    },
    {
      text: `"${quote}"`,
      icon: "quote",
      duration: 4000,
    },
    {
      text: `סורק חקיקה ופסיקה בתחום ${catLabel}...`,
      icon: "scale",
      duration: 4500,
    },
    {
      text: "מזהה סעיפי חוק רלוונטיים למקרה שלך...",
      icon: "gavel",
      duration: 4000,
    },
    {
      text: `בוחן את חוזקות הטענה מול ${respondentName}...`,
      icon: "eye",
      duration: 4500,
    },
    {
      text: `מנסח את המכתב בטון ${toneLabel(tone)}...`,
      icon: "pencil",
      duration: 4500,
    },
    {
      text: `בונה מבנה טענות משפטי מותאם לפרטי המקרה...`,
      icon: "file",
      duration: 4000,
    },
    {
      text: `מוסיף הפניות לסעיפי חוק ספציפיים...`,
      icon: "list",
      duration: 4000,
    },
    {
      text: "בודק תקינות משפטית ודיוק הניסוח...",
      icon: "shield",
      duration: 4000,
    },
    {
      text: "מכין את המכתב לחתימה...",
      icon: "signature",
      duration: 3500,
    },
    {
      text: "מלטש פרטים אחרונים...",
      icon: "sparkles",
      duration: 3500,
    },
    {
      text: "כמעט מוכן, עוד רגע...",
      icon: "check",
      duration: 3000,
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
        }, 250);
      }, duration);
    };

    advanceStage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stage = stages[currentStage];
  const Icon = ICONS[stage.icon];
  const progress = Math.round(((currentStage + 1) / stages.length) * 100);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-10 px-4">
      <div
        className={`flex flex-col items-center gap-6 transition-all duration-300 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <div className="w-14 h-14 rounded-xl bg-[var(--color-elevated)] border border-[var(--color-border)] flex items-center justify-center">
          <Icon size={24} className="text-[var(--color-accent)]" />
        </div>

        <p
          className={`text-center font-medium max-w-xs leading-relaxed ${
            stage.icon === "quote"
              ? "text-sm text-[var(--color-subtle)] italic"
              : "text-base text-[var(--color-ink)]"
          }`}
        >
          {stage.text}
        </p>
      </div>

      <div className="w-48 h-1 rounded-full bg-[var(--color-border)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-xs text-[var(--color-subtle)]">
        מכינים את המכתב שלך...
      </p>
    </div>
  );
}
