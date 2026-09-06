"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ChoiceCard } from "@/components/wizard/ChoiceCard";
import { StepHeading } from "@/components/wizard/StepHeading";
import type { Tone, Goal } from "@/lib/types";
import { TONES, GOALS } from "@/lib/constants";

interface ToneStepProps {
  onContinue: (tone: Tone, goal: Goal) => void;
  initialTone?: Tone | null;
  initialGoal?: Goal | null;
}

export function ToneStep({ onContinue, initialTone, initialGoal }: ToneStepProps) {
  const [selectedTone, setSelectedTone] = useState<Tone | null>(initialTone ?? null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(initialGoal ?? null);

  return (
    <div className="flex flex-col gap-8">
      <StepHeading
        kicker="שלב 4 · ניסוח"
        title="איך המכתב צריך להישמע?"
        subtitle="טון ומטרה. המכתב יותאם לבחירה."
      />

      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold tracking-[0.14em] text-[var(--color-subtle)]">
          טון המכתב
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(TONES) as Tone[]).map((tone) => (
            <ChoiceCard
              key={tone}
              title={TONES[tone].label}
              description={TONES[tone].description}
              selected={selectedTone === tone}
              onClick={() => setSelectedTone(tone)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold tracking-[0.14em] text-[var(--color-subtle)]">
          מטרת המכתב
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(GOALS) as Goal[]).map((goal) => (
            <ChoiceCard
              key={goal}
              title={GOALS[goal].label}
              description={GOALS[goal].description}
              selected={selectedGoal === goal}
              onClick={() => setSelectedGoal(goal)}
            />
          ))}
        </div>
      </div>

      <Button
        variant="primary"
        fullWidth
        onClick={() => selectedTone && selectedGoal && onContinue(selectedTone, selectedGoal)}
        disabled={!selectedTone || !selectedGoal}
      >
        המשך
      </Button>
    </div>
  );
}
