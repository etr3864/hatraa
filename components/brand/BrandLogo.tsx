type BrandLogoProps = {
  size?: "header" | "hero";
  className?: string;
};

/** Mark aspect from public/logo-mark.svg viewBox. */
const MARK_ASPECT = 470 / 373;

const SIZES = {
  header: {
    markHeight: 36,
    text: "text-[15px] md:text-base font-extrabold tracking-tight",
    gap: "gap-2.5",
  },
  hero: {
    markHeight: 80,
    text: "text-4xl md:text-5xl font-extrabold tracking-tight",
    gap: "gap-4",
  },
} as const;

export function BrandLogo({ size = "header", className = "" }: BrandLogoProps) {
  const s = SIZES[size];
  const markHeight = s.markHeight;
  const markWidth = Math.round(markHeight * MARK_ASPECT);

  return (
    <div
      className={`inline-flex items-center ${s.gap} text-[var(--color-ink)] ${className}`}
      aria-label="התראה בקליק"
    >
      <img
        src="/logo-mark.svg"
        alt=""
        width={markWidth}
        height={markHeight}
        className="shrink-0 object-contain"
        style={{ width: markWidth, height: markHeight }}
        decoding="async"
      />
      <span className={`${s.text} leading-none`}>{`התראה בקליק`}</span>
    </div>
  );
}
