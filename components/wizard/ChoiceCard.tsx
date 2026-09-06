import { clsx } from "@/lib/utils";

interface ChoiceCardProps {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

export function ChoiceCard({ title, description, selected, onClick }: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={clsx("wizard-choice", selected && "is-selected")}
    >
      <span className="wizard-choice-title">{title}</span>
      <span className="wizard-choice-desc">{description}</span>
    </button>
  );
}
