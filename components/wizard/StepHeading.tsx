interface StepHeadingProps {
  kicker?: string;
  title: string;
  subtitle?: string;
}

export function StepHeading({ kicker, title, subtitle }: StepHeadingProps) {
  return (
    <header className="wizard-heading">
      {kicker ? <p className="wizard-kicker">{kicker}</p> : null}
      <h2 className="wizard-title">{title}</h2>
      {subtitle ? <p className="wizard-sub">{subtitle}</p> : null}
    </header>
  );
}
