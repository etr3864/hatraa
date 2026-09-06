import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { LetterCarousel } from "@/components/landing/LetterCarousel";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { SIGNATURE_PRICE } from "@/lib/constants";

export function WhyItWorks() {
  return (
    <section className="why-section py-28 px-6 relative overflow-hidden">
      <div className="why-section-glow" />
      <div className="why-section-frame" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c9a84c]/30 to-transparent" />

      <div className="max-w-5xl mx-auto relative z-[1]">
        <ScrollReveal>
          <div className="text-center mb-14 md:mb-16">
            <p className="why-kicker">דוגמאות</p>
            <h2 className="why-heading">
              יש מכתב גם
              <br className="md:hidden" />
              {" "}
              למקרה שלכם.
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start md:items-center">
          <div>
            <ScrollReveal delay={60}>
              <p className="text-[var(--color-body)] text-base md:text-lg leading-relaxed max-w-md">
                מספרים מה קרה, ומקבלים מכתב התראה בפורמט רשמי,
                מוכן להדפסה ולשליחה. בחינם, בלי הרשמה.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={120}>
              <p className="mt-4 text-sm text-[var(--color-subtle)] max-w-md leading-relaxed">
                אחר כך אפשר להוסיף חתימת עו״ד ב־{SIGNATURE_PRICE} ש״ח,
                למי שרוצה יותר משקל.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={180}>
              <StartLetterButton className="hidden md:inline-flex mt-8" />
            </ScrollReveal>
          </div>

          <LetterCarousel />
        </div>
      </div>

      <div className="md:hidden relative z-[1] max-w-5xl mx-auto mt-8 flex justify-center">
        <ScrollReveal delay={220}>
          <StartLetterButton />
        </ScrollReveal>
      </div>
    </section>
  );
}

function StartLetterButton({ className }: { className?: string }) {
  return (
    <Link href="/wizard" className={className ?? "inline-flex"}>
      <Button variant="primary" className="text-base px-10 py-4">
        ייצר מכתב בחינם
        <IconArrowLeft size={18} />
      </Button>
    </Link>
  );
}
