import Link from "next/link";
import Image from "next/image";
import {
  IconArrowLeft,
  IconScale,
  IconTrendingUp,
  IconSignature,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { TimelineSteps } from "@/components/ui/TimelineSteps";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]" dir="rtl">
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="backdrop-blur-xl bg-[#111113]/80 border-b border-white/[0.04]">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="relative">
              <Image
                src="https://res.cloudinary.com/daowx6msw/image/upload/v1779318696/hatra_logo_otqaex.png"
                alt="התראה בקליק"
                width={140}
                height={44}
                className="h-9 w-auto object-contain relative brightness-0 invert opacity-90"
                priority
              />
            </div>
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
        <WhyItWorks />
        <FinalCTA />
      </main>

      <footer className="border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6 py-10 text-center">
          <p className="text-sm text-[var(--color-subtle)]">
            © 2026 התראה בקליק · כל הזכויות שמורות
          </p>
          <p className="text-xs text-[var(--color-placeholder)] mt-2 max-w-md mx-auto">
            מכתבי ההתראה מיוצרים באמצעות AI ואינם מהווים ייעוץ משפטי.
            ניתן להוסיף חתימת עורך דין לתוקף משפטי מלא.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center justify-center bg-[#0d0d0f]">
      <div className="absolute inset-0 bg-radial-fade pointer-events-none" />
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      <div className="absolute top-[20%] right-[10%] w-72 h-72 rounded-full bg-[var(--color-accent)]/[0.04] blur-[100px] animate-float-slow pointer-events-none" />
      <div className="absolute bottom-[15%] left-[5%] w-96 h-96 rounded-full bg-[var(--color-accent)]/[0.03] blur-[120px] animate-float-delayed pointer-events-none" />
      <div className="absolute top-[40%] left-[30%] w-40 h-40 rounded-full bg-purple-500/[0.03] blur-[80px] animate-float-slow pointer-events-none" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/[0.02] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-white/[0.015] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-white/[0.01] pointer-events-none" />

      <div className="max-w-3xl mx-auto px-6 pt-8 pb-20 text-center relative">
        <ScrollReveal>
          <div className="relative inline-block mb-10 group cursor-default">
            <div className="absolute -inset-10 bg-[var(--color-accent)]/[0.05] rounded-full blur-[80px] group-hover:bg-[var(--color-accent)]/[0.09] transition-all duration-700" />
            <Image
              src="https://res.cloudinary.com/daowx6msw/image/upload/v1779318696/hatra_logo_otqaex.png"
              alt="התראה בקליק"
              width={380}
              height={120}
              className="h-28 md:h-36 w-auto object-contain mx-auto relative brightness-0 invert drop-shadow-[0_0_12px_rgba(255,255,255,0.08)] group-hover:drop-shadow-[0_0_20px_rgba(201,168,76,0.2)] transition-all duration-500"
              loading="eager"
              priority
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

        <div className="fade-in-up" style={{ animationDelay: "0.5s", opacity: 0 }}>
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
    <section className="py-28 px-6 relative bg-[#0a0a0c] overflow-hidden">
      <div className="absolute inset-x-0 -top-32 h-64 bg-gradient-to-b from-[#0d0d0f] to-[#0a0a0c] pointer-events-none" />

      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#0a0a0c] to-transparent pointer-events-none z-[1]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0a0a0c] to-transparent pointer-events-none z-[1]" />

      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />

      <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      {/* Legal illustrations with shark fins */}

      {/* Shark fin 1 - top left area */}
      <ScrollReveal className="absolute top-[5%] left-[4%] pointer-events-none" direction="right" delay={100}>
        <svg className="w-24 h-24 opacity-[0.1] animate-drift-slow" viewBox="0 0 60 60" fill="none" stroke="var(--color-accent)" strokeWidth="1.3" strokeLinecap="round">
          <path d="M 15 45 Q 27 43, 30 10 Q 34 43, 45 45" />
          <path d="M 8 48 Q 30 53, 52 48" strokeWidth="0.8" strokeDasharray="3 4" />
        </svg>
      </ScrollReveal>

      {/* Scales of justice - right upper */}
      <ScrollReveal className="absolute top-[8%] right-[5%] pointer-events-none" direction="left" delay={200}>
        <svg className="w-64 h-64 opacity-[0.11] animate-float-gentle" viewBox="0 0 200 200" fill="none" stroke="var(--color-accent)" strokeWidth="1.3" strokeLinecap="round">
          <line x1="100" y1="28" x2="100" y2="162" />
          <line x1="52" y1="58" x2="148" y2="58" />
          <path d="M 52 58 L 34 108 Q 52 126 70 108 Z" />
          <path d="M 148 58 L 130 108 Q 148 126 166 108 Z" />
          <circle cx="100" cy="26" r="8" />
          <rect x="76" y="160" width="48" height="12" rx="4" />
        </svg>
      </ScrollReveal>

      {/* Gavel - left mid */}
      <ScrollReveal className="absolute top-[26%] left-[2%] pointer-events-none" direction="right" delay={300}>
        <svg className="w-52 h-52 opacity-[0.095] -rotate-[15deg] animate-drift-gentle" viewBox="0 0 160 160" fill="none" stroke="var(--color-accent)" strokeWidth="1.3" strokeLinecap="round">
          <rect x="53" y="26" width="56" height="26" rx="6" transform="rotate(-30 81 39)" />
          <line x1="81" y1="55" x2="81" y2="128" strokeWidth="1.5" />
          <rect x="46" y="128" width="70" height="16" rx="5" />
        </svg>
      </ScrollReveal>

      {/* Law book - upper center */}
      <ScrollReveal className="absolute top-[12%] left-[35%] pointer-events-none" direction="up" delay={180}>
        <svg className="w-36 h-28 opacity-[0.09] rotate-[-2deg] animate-float-gentle" viewBox="0 0 140 90" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 70 18 L 70 78" />
          <path d="M 70 18 C 55 16, 30 13, 15 18 L 15 73 C 30 68, 55 70, 70 78" />
          <path d="M 70 18 C 85 16, 110 13, 125 18 L 125 73 C 110 68, 85 70, 70 78" />
          <line x1="28" y1="33" x2="58" y2="31" strokeWidth="0.8" />
          <line x1="28" y1="43" x2="54" y2="41" strokeWidth="0.8" />
          <line x1="28" y1="53" x2="56" y2="51" strokeWidth="0.8" />
          <line x1="82" y1="31" x2="112" y2="33" strokeWidth="0.8" />
          <line x1="82" y1="41" x2="108" y2="43" strokeWidth="0.8" />
        </svg>
      </ScrollReveal>

      {/* Shark fin 2 - right mid */}
      <ScrollReveal className="absolute top-[34%] right-[8%] pointer-events-none" direction="left" delay={350}>
        <svg className="w-20 h-20 opacity-[0.09] animate-drift-slow-reverse" viewBox="0 0 60 60" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinecap="round">
          <path d="M 15 45 Q 27 43, 30 12 Q 33 43, 45 45" />
          <path d="M 10 48 Q 30 52, 50 48" strokeWidth="0.7" strokeDasharray="3 3" />
        </svg>
      </ScrollReveal>

      {/* Paragraph § - left lower */}
      <ScrollReveal className="absolute top-[42%] left-[6%] pointer-events-none" direction="right" delay={400}>
        <svg className="w-36 h-48 opacity-[0.095] animate-drift-gentle" viewBox="0 0 80 140" fill="none" stroke="var(--color-accent)" strokeWidth="1.4" strokeLinecap="round">
          <path d="M 55 25 Q 60 15, 50 10 Q 35 5, 25 15 Q 18 25, 30 35 Q 42 42, 50 50 Q 62 58, 58 70 Q 55 78, 45 80 Q 35 82, 28 75" />
          <path d="M 28 75 Q 22 68, 30 60 Q 38 53, 48 60 Q 58 67, 55 80 Q 50 95, 38 100 Q 25 105, 22 95 Q 20 85, 30 80" />
          <line x1="40" y1="5" x2="40" y2="25" />
          <line x1="40" y1="95" x2="40" y2="120" />
        </svg>
      </ScrollReveal>

      {/* Document with signature - right center */}
      <ScrollReveal className="absolute top-[20%] right-[28%] pointer-events-none" direction="up" delay={250}>
        <svg className="w-32 h-40 opacity-[0.09] rotate-[6deg] animate-float-gentle" viewBox="0 0 100 130" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinecap="round">
          <rect x="10" y="10" width="80" height="110" rx="4" />
          <line x1="25" y1="32" x2="75" y2="32" />
          <line x1="25" y1="45" x2="72" y2="45" />
          <line x1="25" y1="58" x2="65" y2="58" />
          <line x1="25" y1="71" x2="55" y2="71" />
          <path d="M 40 92 Q 50 85, 58 92 Q 66 99, 75 90" strokeWidth="1.3" />
        </svg>
      </ScrollReveal>

      {/* Shield - bottom left */}
      <ScrollReveal className="absolute top-[62%] left-[3%] pointer-events-none" direction="right" delay={450}>
        <svg className="w-32 h-40 opacity-[0.085] animate-drift-slow" viewBox="0 0 100 130" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 50 10 L 88 27 L 88 62 Q 88 98, 50 118 Q 12 98, 12 62 L 12 27 Z" />
          <path d="M 33 62 L 46 78 L 72 48" strokeWidth="1.5" />
        </svg>
      </ScrollReveal>

      {/* Handshake - center */}
      <ScrollReveal className="absolute top-[38%] left-[38%] pointer-events-none" direction="up" delay={320}>
        <svg className="w-32 h-26 opacity-[0.08] rotate-[3deg] animate-drift-gentle" viewBox="0 0 130 80" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 15 40 L 35 40 L 52 32 L 68 36 L 82 30 L 95 36 L 115 40" />
          <path d="M 15 40 C 8 34, 6 28, 10 22 L 28 22" />
          <path d="M 115 40 C 122 34, 124 28, 120 22 L 102 22" />
          <path d="M 52 32 L 48 46 Q 58 52, 68 46 L 68 36" />
          <path d="M 82 30 L 86 44 Q 76 50, 68 46" />
        </svg>
      </ScrollReveal>

      {/* Briefcase - right lower */}
      <ScrollReveal className="absolute top-[55%] right-[4%] pointer-events-none" direction="left" delay={480}>
        <svg className="w-32 h-32 opacity-[0.09] rotate-[-4deg] animate-float-gentle" viewBox="0 0 100 100" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinecap="round">
          <rect x="12" y="33" width="76" height="52" rx="5" />
          <path d="M 33 33 L 33 23 Q 33 15, 41 15 L 59 15 Q 67 15, 67 23 L 67 33" />
          <line x1="12" y1="53" x2="88" y2="53" />
          <rect x="40" y="47" width="20" height="14" rx="3" />
        </svg>
      </ScrollReveal>

      {/* Pen / quill - center-left */}
      <ScrollReveal className="absolute top-[72%] left-[22%] pointer-events-none" direction="up" delay={500}>
        <svg className="w-20 h-36 opacity-[0.08] rotate-[12deg] animate-drift-slow-reverse" viewBox="0 0 50 100" fill="none" stroke="var(--color-accent)" strokeWidth="1.1" strokeLinecap="round">
          <path d="M 25 8 C 28 8, 30 12, 30 18 L 27 85 L 25 95 L 23 85 L 20 18 C 20 12, 22 8, 25 8 Z" />
          <line x1="25" y1="95" x2="25" y2="100" strokeWidth="1.5" />
          <path d="M 20 18 Q 25 22, 30 18" strokeWidth="0.8" />
        </svg>
      </ScrollReveal>

      {/* Shark fin 3 - bottom center */}
      <ScrollReveal className="absolute top-[80%] left-[50%] pointer-events-none" direction="up" delay={550}>
        <svg className="w-22 h-22 opacity-[0.09] animate-drift-slow" viewBox="0 0 60 60" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinecap="round">
          <path d="M 15 45 Q 28 43, 30 10 Q 33 43, 45 45" />
          <path d="M 8 48 Q 30 53, 52 48" strokeWidth="0.7" strokeDasharray="3 4" />
        </svg>
      </ScrollReveal>

      {/* Envelope - center upper */}
      <ScrollReveal className="absolute top-[16%] left-[60%] pointer-events-none" direction="left" delay={280}>
        <svg className="w-28 h-22 opacity-[0.085] rotate-[2deg] animate-drift-gentle" viewBox="0 0 100 70" fill="none" stroke="var(--color-accent)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
          <rect x="8" y="15" width="84" height="50" rx="3" />
          <path d="M 8 15 L 50 42 L 92 15" />
          <line x1="8" y1="65" x2="35" y2="42" strokeWidth="0.8" />
          <line x1="92" y1="65" x2="65" y2="42" strokeWidth="0.8" />
        </svg>
      </ScrollReveal>

      {/* Stamp / seal - bottom right */}
      <ScrollReveal className="absolute top-[74%] right-[12%] pointer-events-none" direction="left" delay={520}>
        <svg className="w-28 h-28 opacity-[0.085] animate-float-gentle" viewBox="0 0 80 80" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinecap="round">
          <circle cx="40" cy="40" r="28" />
          <circle cx="40" cy="40" r="22" />
          <path d="M 28 40 L 36 48 L 54 32" strokeWidth="1.5" />
        </svg>
      </ScrollReveal>

      {/* Clock - left bottom */}
      <ScrollReveal className="absolute top-[85%] left-[8%] pointer-events-none" direction="right" delay={580}>
        <svg className="w-26 h-26 opacity-[0.08] animate-drift-slow-reverse" viewBox="0 0 80 80" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinecap="round">
          <circle cx="40" cy="40" r="30" />
          <line x1="40" y1="40" x2="40" y2="22" strokeWidth="1.4" />
          <line x1="40" y1="40" x2="54" y2="46" strokeWidth="1.1" />
          <circle cx="40" cy="40" r="2.5" fill="var(--color-accent)" />
        </svg>
      </ScrollReveal>

      {/* Column / pillar - right upper-mid */}
      <ScrollReveal className="absolute top-[30%] right-[20%] pointer-events-none" direction="left" delay={330}>
        <svg className="w-20 h-44 opacity-[0.08] animate-float-gentle" viewBox="0 0 50 120" fill="none" stroke="var(--color-accent)" strokeWidth="1.1" strokeLinecap="round">
          <rect x="15" y="20" width="20" height="80" />
          <path d="M 10 20 L 40 20" strokeWidth="1.5" />
          <path d="M 8 15 L 42 15" strokeWidth="1.8" />
          <path d="M 10 100 L 40 100" strokeWidth="1.5" />
          <path d="M 8 105 L 42 105" strokeWidth="1.8" />
          <line x1="20" y1="35" x2="20" y2="85" strokeWidth="0.5" />
          <line x1="30" y1="35" x2="30" y2="85" strokeWidth="0.5" />
        </svg>
      </ScrollReveal>

      {/* Shark fin 4 - left mid */}
      <ScrollReveal className="absolute top-[52%] left-[30%] pointer-events-none" direction="up" delay={420}>
        <svg className="w-16 h-16 opacity-[0.08] animate-drift-slow" viewBox="0 0 50 50" fill="none" stroke="var(--color-accent)" strokeWidth="1.1" strokeLinecap="round">
          <path d="M 12 38 Q 23 36, 25 8 Q 28 36, 38 38" />
          <path d="M 6 41 Q 25 45, 44 41" strokeWidth="0.7" strokeDasharray="2 3" />
        </svg>
      </ScrollReveal>

      {/* Magnifying glass - bottom center-right */}
      <ScrollReveal className="absolute top-[68%] right-[30%] pointer-events-none" direction="up" delay={470}>
        <svg className="w-24 h-24 opacity-[0.075] rotate-[20deg] animate-drift-gentle" viewBox="0 0 80 80" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinecap="round">
          <circle cx="35" cy="35" r="20" />
          <line x1="50" y1="50" x2="68" y2="68" strokeWidth="2" />
        </svg>
      </ScrollReveal>

      {/* Balance weight - bottom center */}
      <ScrollReveal className="absolute bottom-[6%] left-[42%] pointer-events-none" direction="up" delay={600}>
        <svg className="w-28 h-20 opacity-[0.075] animate-float-gentle" viewBox="0 0 100 60" fill="none" stroke="var(--color-accent)" strokeWidth="1.1" strokeLinecap="round">
          <line x1="50" y1="10" x2="50" y2="50" />
          <line x1="20" y1="25" x2="80" y2="25" />
          <circle cx="20" cy="35" r="10" />
          <circle cx="80" cy="35" r="10" />
          <rect x="42" y="48" width="16" height="6" rx="2" />
        </svg>
      </ScrollReveal>

      {/* Exclamation - right */}
      <ScrollReveal className="absolute top-[46%] right-[35%] pointer-events-none" direction="up" delay={380}>
        <svg className="w-14 h-24 opacity-[0.07] animate-drift-slow-reverse" viewBox="0 0 40 70" fill="none" stroke="var(--color-accent)" strokeWidth="1.3" strokeLinecap="round">
          <path d="M 20 8 L 20 42" strokeWidth="3" />
          <circle cx="20" cy="55" r="4" />
        </svg>
      </ScrollReveal>

      {/* Shark fin 5 - top center-right */}
      <ScrollReveal className="absolute top-[3%] left-[57%] pointer-events-none" direction="up" delay={150}>
        <svg className="w-20 h-20 opacity-[0.085] animate-drift-slow-reverse" viewBox="0 0 60 60" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinecap="round">
          <path d="M 15 45 Q 28 43, 30 10 Q 33 43, 45 45" />
          <path d="M 8 48 Q 30 53, 52 48" strokeWidth="0.7" strokeDasharray="3 4" />
        </svg>
      </ScrollReveal>

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

function WhyItWorks() {
  const points = [
    {
      icon: <IconScale size={22} />,
      title: "מכתב ברמה של משרד עורכי דין",
      desc: "מבנה מקצועי, סעיפי חוק אמיתיים, פורמט שהצד השני מכיר ולוקח ברצינות.",
    },
    {
      icon: <IconTrendingUp size={22} />,
      title: "70% מהמקרים נפתרים עם מכתב התראה בלבד",
      desc: "לרוב הצד השני לא רוצה תביעה. מכתב רשמי הוא לרוב כל מה שצריך.",
    },
    {
      icon: <IconSignature size={22} />,
      title: "חתימת עורך דין ב-250 ש״ח בלבד",
      desc: "עורך דין חותם על המכתב ומעלה את הסיכוי לתגובה. פחות מרבע מעלות ייעוץ רגיל.",
    },
  ];

  return (
    <section className="py-28 px-6 relative bg-[var(--color-surface)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#080809] to-transparent pointer-events-none" />
      <div className="absolute top-[30%] right-[5%] w-60 h-60 rounded-full bg-[var(--color-accent)]/[0.02] blur-[80px] pointer-events-none" />

      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-[var(--color-accent)] mb-3 tracking-wide">
              למה זה עובד?
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-ink)]">
              מכתבים נוצרים על ידי מודל מאומן על עריכת דין והחוק הישראלי בלבד.
            </h2>
          </div>
        </ScrollReveal>

        <div className="flex flex-col gap-4">
          {points.map((p, i) => (
            <ScrollReveal key={p.title} delay={i * 100}>
              <div className="flex items-start gap-5 p-6 md:p-7 rounded-2xl bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] hover:bg-white/[0.05] hover:border-[var(--color-accent)]/20 transition-all duration-300 group hover:-translate-y-0.5">
                <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[var(--color-accent)] flex-shrink-0 group-hover:bg-[var(--color-accent)]/10 group-hover:border-[var(--color-accent)]/30 transition-all duration-300">
                  {p.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-[var(--color-ink)] mb-1.5">
                    {p.title}
                  </h3>
                  <p className="text-sm text-[var(--color-body)] leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-28 px-6 relative overflow-hidden bg-[#060607]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[var(--color-surface)] to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-radial-fade pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[var(--color-accent)]/[0.04] blur-[100px] pointer-events-none" />

      <div className="max-w-2xl mx-auto text-center relative">
        <ScrollReveal>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-ink)] mb-5">
            מוכן לשלוח מכתב?
          </h2>
          <p className="text-[var(--color-body)] mb-10 max-w-md mx-auto text-lg">
            תהליך פשוט של 3 דקות. ללא הרשמה, ללא התחייבות.
          </p>
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
