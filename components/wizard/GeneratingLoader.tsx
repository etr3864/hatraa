"use client";

import { useState, useEffect } from "react";
import type { Tone, Category } from "@/lib/types";
import { toneLabel, categoryLabel, extractFirstSentence } from "@/lib/utils";
import { LOADER_MIN_MS } from "@/lib/constants";
import { WizardWaiting } from "@/components/wizard/WizardWaiting";

interface Stage {
  text: string;
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
  const quote = extractFirstSentence(userQuote);
  const catLabel = category ? categoryLabel(category) : "המקרה";

  const stages: Stage[] = [
    { text: `מנתח את המקרה מול ${respondentName}...`, duration: 4000 },
    { text: `"${quote}"`, duration: 4000 },
    { text: `סורק חקיקה ופסיקה בתחום ${catLabel}...`, duration: 4500 },
    { text: "מזהה סעיפי חוק רלוונטיים למקרה...", duration: 4000 },
    { text: `בוחן את חוזקות הטענה מול ${respondentName}...`, duration: 4500 },
    { text: `מנסח את המכתב בטון ${toneLabel(tone)}...`, duration: 4500 },
    { text: "בונה מבנה טענות משפטי מותאם לפרטים...", duration: 4000 },
    { text: "מוסיף הפניות לסעיפי חוק ספציפיים...", duration: 4000 },
    { text: "בודק תקינות משפטית ודיוק הניסוח...", duration: 4000 },
    { text: "מכין את המכתב לחתימה...", duration: 3500 },
    { text: "מלטש פרטים אחרונים...", duration: 3500 },
    { text: "כמעט מוכן, עוד רגע...", duration: 3000 },
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
        setCurrentStage(stageIdx);
        advanceStage();
      }, duration);
    };

    advanceStage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = Math.round(((currentStage + 1) / stages.length) * 100);

  return (
    <WizardWaiting
      title={stages[currentStage].text}
      subtitle="המכתב נכתב עכשיו. אפשר לסגור ולחזור מאוחר יותר."
      progress={progress}
    />
  );
}
