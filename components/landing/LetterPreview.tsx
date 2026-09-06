import { BrandLogo } from "@/components/brand/BrandLogo";
import { SAMPLE_LETTERS, type SampleLetter } from "@/components/landing/sample-letters";

export function LetterPreview({
  letter = SAMPLE_LETTERS[0],
}: {
  letter?: SampleLetter;
}) {
  return (
    <div className="landing-letter-wrap relative mx-auto w-full max-w-none md:max-w-[420px]" aria-hidden>
      <article dir="rtl" className="landing-letter">
        <div className="h-[2px] bg-[#c9a84c]" />
        <div className="px-7 pt-5 pb-8 md:px-9 md:pt-6 md:pb-9">
          <header className="flex justify-center mb-6 pb-4 border-b border-[#e6e0d4]">
            <BrandLogo size="letter" tone="onLight" />
          </header>
          <LetterMeta letter={letter} />
          <LetterBody paragraphs={letter.paragraphs} />
          <BlurredSignature name={letter.signName} />
        </div>
      </article>
    </div>
  );
}

function LetterMeta({ letter }: { letter: SampleLetter }) {
  return (
    <div className="landing-letter-meta mb-4">
      <div className="flex justify-between items-start gap-4 mb-4">
        <div className="text-right">
          <p className="font-bold">{letter.senderName}</p>
          <p className="landing-letter-mute">{letter.senderCity}</p>
        </div>
        <div className="text-left shrink-0" dir="ltr">
          <p>12.3.2026</p>
          <p className="landing-letter-mute" dir="rtl">
            כ״ג באדר תשפ״ו
          </p>
        </div>
      </div>
      <p className="font-bold mb-0.5">לכבוד</p>
      <p>{letter.recipient}</p>
      {letter.recipientLine ? (
        <p className="landing-letter-mute">{letter.recipientLine}</p>
      ) : null}
      <p className="landing-letter-prejudice">-מבלי לפגוע בזכויות-</p>
      <p className="landing-letter-subject">הנדון: {letter.subject}</p>
    </div>
  );
}

function LetterBody({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="landing-letter-body">
      <p>א.נ.,</p>
      {paragraphs.map((text) => (
        <p key={text}>{text}</p>
      ))}
    </div>
  );
}

function BlurredSignature({ name }: { name: string }) {
  return (
    <div className="mt-8">
      <p className="landing-letter-close">בכבוד רב,</p>
      <div
        className="w-[188px] h-[46px] pointer-events-none select-none"
        style={{ filter: "blur(7px)" }}
      >
        <SignatureInk />
      </div>
      <div className="landing-letter-signatory">
        <p>{name}</p>
      </div>
    </div>
  );
}

function SignatureInk() {
  return (
    <svg viewBox="0 0 200 56" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 40 C22 8, 40 50, 62 26 C78 10, 90 44, 112 24 C130 8, 148 40, 174 20 C184 12, 192 24, 196 28"
        stroke="#1a1a1a"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M14 46 C40 36, 68 48, 98 38 C128 28, 154 44, 186 34"
        stroke="#1a1a1a"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <path
        d="M48 16 C52 6, 64 4, 70 16"
        stroke="#1a1a1a"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
