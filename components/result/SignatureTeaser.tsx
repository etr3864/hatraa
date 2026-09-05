import { ATTORNEY, attorneySignatureName } from "@/lib/attorney";

export function SignatureTeaser() {
  return (
    <div className="relative mt-2 select-none pointer-events-none" aria-hidden>
      <div className="signature-teaser-blur relative flex items-end justify-start gap-4 min-h-[88px]">
        <div className="relative w-[200px] h-[72px] shrink-0">
          <img
            src="/signature-scribble.png"
            alt=""
            className="absolute -inset-x-2 top-1/2 -translate-y-[55%] w-[200px] h-auto opacity-30"
          />
          <InkScribble className="absolute inset-x-0 top-0 w-[150px] h-[44px] text-[#1a2744] opacity-90" />
          <div className="absolute bottom-0 inset-x-0 z-[1]">
            <p className="text-[11px] font-bold text-[#1a1a1a] leading-tight">
              {ATTORNEY.officeName}
            </p>
            <p className="text-[11px] font-bold text-[#1a1a1a] leading-tight">
              {attorneySignatureName()}
            </p>
          </div>
        </div>

        <RoundStamp className="shrink-0 mb-1 opacity-90" />
      </div>

      <p className="mt-2 text-[11px] text-zinc-500">
        {ATTORNEY.signatureCaption} · חתימת עו״ד
      </p>
    </div>
  );
}

function InkScribble({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 44"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 30 C18 8, 28 38, 42 22 C52 10, 58 34, 72 20 C84 8, 92 32, 108 18 C120 8, 128 28, 142 16 C148 12, 154 20, 156 22"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 34 C30 28, 48 36, 66 30 C84 24, 100 34, 118 28 C130 24, 142 30, 150 26"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M38 14 C40 6, 48 4, 52 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RoundStamp({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 88 88"
      width={72}
      height={72}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="44"
        cy="44"
        r="40"
        fill="none"
        stroke="#8B6914"
        strokeWidth="2.5"
        opacity="0.85"
      />
      <circle
        cx="44"
        cy="44"
        r="34"
        fill="none"
        stroke="#8B6914"
        strokeWidth="1.2"
        opacity="0.7"
        strokeDasharray="2.5 2"
      />
      <text
        x="44"
        y="32"
        textAnchor="middle"
        fill="#8B6914"
        fontSize="7.5"
        fontWeight="700"
        fontFamily="Heebo, Arial, sans-serif"
      >
        מאומת
      </text>
      <text
        x="44"
        y="44"
        textAnchor="middle"
        fill="#8B6914"
        fontSize="6.5"
        fontWeight="600"
        fontFamily="Heebo, Arial, sans-serif"
      >
        {attorneySignatureName()}
      </text>
      <text
        x="44"
        y="56"
        textAnchor="middle"
        fill="#8B6914"
        fontSize="5.5"
        fontFamily="Heebo, Arial, sans-serif"
        opacity="0.9"
      >
        {ATTORNEY.letterheadName}
      </text>
      <path
        d="M30 62 L38 68 L58 48"
        fill="none"
        stroke="#8B6914"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}
