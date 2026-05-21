"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
      <div className="text-center">
        <h2 className="text-xl font-bold text-[var(--color-ink)] mb-2">
          איך אתה רוצה שהמכתב ישמע?
        </h2>
        <p className="text-sm text-[var(--color-body)]">
          בחר טון ומטרה. המכתב יותאם בדיוק לבחירה שלך
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-[var(--color-subtle)] uppercase tracking-wide">
          טון המכתב
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(TONES) as Tone[]).map((tone) => (
            <Card
              key={tone}
              selected={selectedTone === tone}
              onClick={() => setSelectedTone(tone)}
              className="p-4"
            >
              <p className="font-bold text-[var(--color-ink)] text-sm mb-1">
                {TONES[tone].label}
              </p>
              <p className="text-xs text-[var(--color-body)]">
                {TONES[tone].description}
              </p>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-bold text-[var(--color-subtle)] uppercase tracking-wide">
          מטרת המכתב
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(GOALS) as Goal[]).map((goal) => (
            <Card
              key={goal}
              selected={selectedGoal === goal}
              onClick={() => setSelectedGoal(goal)}
              className="p-4"
            >
              <p className="font-bold text-[var(--color-ink)] text-sm mb-1">
                {GOALS[goal].label}
              </p>
              <p className="text-xs text-[var(--color-body)]">
                {GOALS[goal].description}
              </p>
            </Card>
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
