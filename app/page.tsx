import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { GroundedInLaw } from "@/components/landing/GroundedInLaw";
import { HowItWorksMarks } from "@/components/landing/HowItWorksMarks";
import { WhyItWorks } from "@/components/landing/WhyItWorks";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { TimelineSteps } from "@/components/ui/TimelineSteps";
import { MouseGlow } from "@/components/ui/MouseGlow";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]" dir="rtl">
      <MouseGlow />
      <header className="fixed top-0 left-0 right-0 z-50 header-enter">
        <div className="bg-[#111113]/92 border-b border-white/[0.04]">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <BrandLogo size="header" className="header-brand opacity-95" />
            <Link href="/wizard">
              <Button variant="primary" className="text-sm px-6 py-2.5">
                ייצר מכתב
                <IconArrowLeft size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-20">
        <Hero />
        <HowItWorks />
        <GroundedInLaw />
        <WhyItWorks />
        <FinalCTA />
      </main>
    </div>
  );
}

function Hero() {
  return (
    <section data-glow="hero" className="relative overflow-hidden min-h-[90vh] flex items-center justify-center bg-[#0d0d0f]">
      <div className="absolute inset-0 bg-radial-fade pointer-events-none" />
      <div className="absolute inset-0 bg-grid opacity-100 pointer-events-none" />

      <div className="absolute top-[20%] right-[10%] w-72 h-72 rounded-full bg-[var(--color-accent)]/[0.04] blur-[100px] animate-float-slow pointer-events-none" />
      <div className="absolute bottom-[15%] left-[5%] w-96 h-96 rounded-full bg-[var(--color-accent)]/[0.03] blur-[120px] animate-float-delayed pointer-events-none" />
      <div className="absolute top-[40%] left-[30%] w-40 h-40 rounded-full bg-purple-500/[0.03] blur-[80px] animate-float-slow pointer-events-none" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/[0.02] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-white/[0.015] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-white/[0.01] pointer-events-none" />

      <div className="max-w-3xl mx-auto px-6 pt-8 pb-20 text-center relative z-[1]">
        <ScrollReveal>
          <div className="relative flex justify-center mb-10">
            <div className="absolute -inset-10 bg-[var(--color-accent)]/[0.05] rounded-full blur-[80px] pointer-events-none" />
            <BrandLogo
              size="hero"
              className="relative mx-auto drop-shadow-[0_0_12px_rgba(255,255,255,0.08)]"
            />
          </div>
        </ScrollReveal>

        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-md px-4 py-1.5 text-sm text-[var(--color-body)] mb-8 fade-in-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
          חינמי לחלוטין, ללא התחייבות
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[var(--color-ink)] mb-6 leading-[1.05] tracking-tight fade-in-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
          עשו לך עוול?
          <br />
          <span className="text-[var(--color-accent)]">שלח מכתב התראה</span>
          <br />
          תוך 3 דקות.
        </h1>

        <p className="text-lg md:text-xl text-[var(--color-body)] mb-12 max-w-lg mx-auto leading-relaxed fade-in-up" style={{ animationDelay: "0.35s", opacity: 0 }}>
          ספר לנו מה קרה, בטקסט או בקול. המערכת תנתח את המקרה שלך,
          תבדוק סעיפי חוק רלוונטיים, ותייצר מכתב התראה מקצועי מוכן לשליחה.
        </p>

        <div className="hero-cta fade-in-up" style={{ animationDelay: "0.5s", opacity: 0 }}>
          <Link href="/wizard">
            <Button variant="primary" className="text-lg px-14 py-5">
              התחל עכשיו
              <IconArrowLeft size={20} />
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-8 mt-14 text-sm text-[var(--color-subtle)] fade-in-up" style={{ animationDelay: "0.65s", opacity: 0 }}>
          {["ללא הרשמה", "מוכן לשליחה", "PDF להורדה"].map((item) => (
            <span key={item} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[var(--color-accent)]" />
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#0a0a0c] pointer-events-none" />
    </section>
  );
}

function HowItWorks() {
  return (
    <section data-glow="path" className="py-28 px-6 relative bg-[#0a0a0c] overflow-hidden">
      <div className="absolute inset-x-0 -top-32 h-64 bg-gradient-to-b from-[#0d0d0f] to-[#0a0a0c] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#0a0a0c] to-transparent pointer-events-none z-[1]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0a0a0c] to-transparent pointer-events-none z-[1]" />
      <HowItWorksMarks />
      <div className="max-w-4xl mx-auto relative z-[2]">
        <ScrollReveal>
          <div className="text-center mb-20">
            <p className="text-sm font-medium text-[var(--color-accent)] mb-3 tracking-wide">
              איך זה עובד?
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-ink)]">
              שלושה צעדים פשוטים
            </h2>
          </div>
        </ScrollReveal>

        <TimelineSteps />
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section data-glow="close" className="py-28 px-6 relative overflow-hidden bg-[#060607]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0c0c0e] to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-radial-fade pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[var(--color-accent)]/[0.04] blur-[100px] pointer-events-none" />

      <div className="max-w-2xl mx-auto text-center relative">
        <ScrollReveal>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-ink)] mb-5">
            מוכן לשלוח מכתב?
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={90}>
          <p className="text-[var(--color-body)] mb-10 max-w-md mx-auto text-lg">
            תהליך פשוט של 3 דקות. ללא הרשמה, ללא התחייבות.
          </p>
        </ScrollReveal>
        <ScrollReveal delay={180}>
          <Link href="/wizard">
            <Button variant="primary" className="text-lg px-14 py-5">
              התחל עכשיו בחינם
              <IconArrowLeft size={20} />
            </Button>
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
