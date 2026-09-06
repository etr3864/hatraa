"use client";

import { memo, useEffect, useRef, useState, useCallback, type RefObject } from "react";

const STEPS = [
  {
    id: "story" as const,
    number: "01",
    title: "ספר לנו מה קרה",
    description: "כתב או הקלט בקול.\nבלי טפסים, בלי שפה משפטית.\nרק תספר מה עשו לך.",
    align: "right" as const,
  },
  {
    id: "letter" as const,
    number: "02",
    title: "המכתב מנוסח",
    description: "המערכת בודקת את המקרה,\nמזהה סעיפי חוק רלוונטיים,\nומייצרת מכתב מקצועי.",
    align: "left" as const,
  },
  {
    id: "send" as const,
    number: "03",
    title: "מוכן לשליחה",
    description: "קבל PDF מוכן עם הפרטים שלך.\nשלח במייל, בוואטסאפ, או בדואר רשום.",
    align: "right" as const,
  },
];

export function TimelineSteps() {
  const containerRef = useRef<HTMLDivElement>(null);
  const circleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const progressRef = useRef(0);
  const [activeSteps, setActiveSteps] = useState<boolean[]>([false, false, false]);
  const [pathD, setPathD] = useState("");
  const [lastPointY, setLastPointY] = useState(0);
  const [containerH, setContainerH] = useState(0);
  const activeRef = useRef(activeSteps);
  activeRef.current = activeSteps;

  const calculatePath = useCallback(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    const containerRect = container.getBoundingClientRect();
    const points: { x: number; y: number }[] = [];

    circleRefs.current.forEach((circleEl) => {
      if (!circleEl) return;
      const rect = circleEl.getBoundingClientRect();
      points.push({
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top + rect.height / 2 - containerRect.top,
      });
    });

    if (points.length < 3) return;

    const w = containerRect.width;
    const h = containerRect.height;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    setLastPointY(points[2].y);
    setContainerH(h);

    const centerX = w / 2;
    const cp1y = points[0].y * 0.5;
    const mid01y = (points[0].y + points[1].y) / 2;
    const mid12y = (points[1].y + points[2].y) / 2;
    setPathD(
      `M ${centerX} 0` +
        ` C ${centerX} ${cp1y}, ${points[0].x} ${cp1y}, ${points[0].x} ${points[0].y}` +
        ` C ${points[0].x} ${mid01y}, ${points[1].x} ${mid01y}, ${points[1].x} ${points[1].y}` +
        ` C ${points[1].x} ${mid12y}, ${points[2].x} ${mid12y}, ${points[2].x} ${points[2].y}`
    );
  }, []);

  useEffect(() => {
    calculatePath();
    window.addEventListener("resize", calculatePath);
    const timer = setTimeout(calculatePath, 150);
    return () => {
      window.removeEventListener("resize", calculatePath);
      clearTimeout(timer);
    };
  }, [calculatePath]);

  useEffect(() => {
    const container = containerRef.current;
    const path = pathRef.current;
    if (!container || !path || !pathD) return;

    let raf = 0;
    let current = progressRef.current;
    let docTop = 0;
    let height = 1;
    let circleTops = [0, 0, 0];
    const ease = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 1
      : 0.38;

    const measure = () => {
      const rect = container.getBoundingClientRect();
      docTop = rect.top + window.scrollY;
      height = Math.max(rect.height, 1);
      circleTops = circleRefs.current.map((el) =>
        el ? el.getBoundingClientRect().top + window.scrollY : 0
      );
    };

    const progressFromScroll = () => {
      const top = docTop - window.scrollY;
      const travel = Math.max(height * 0.88, 1);
      return Math.max(0, Math.min(1, (window.innerHeight * 0.7 - top) / travel));
    };

    const syncCards = () => {
      const line = window.scrollY + window.innerHeight * 0.88;
      const next = circleTops.map((top) => top < line);
      const prev = activeRef.current;
      if (next.some((value, i) => value !== prev[i])) {
        activeRef.current = next;
        setActiveSteps(next);
      }
    };

    const tick = () => {
      const target = progressFromScroll();
      current += (target - current) * ease;
      if (Math.abs(target - current) < 0.001) current = target;
      progressRef.current = current;
      path.style.strokeDashoffset = String(1 - current);
      syncCards();

      if (current !== target) {
        raf = requestAnimationFrame(tick);
        return;
      }
      raf = 0;
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onResize = () => {
      measure();
      kick();
    };

    measure();
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    tick();
    return () => {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pathD]);

  const fadeMid =
    containerH > 0 ? Math.max(0, Math.min(100, ((lastPointY - 20) / containerH) * 100)) : 70;
  const fadeEnd =
    containerH > 0 ? Math.max(0, Math.min(100, (lastPointY / containerH) * 100)) : 85;

  return (
    <div ref={containerRef} className="path-read relative max-w-2xl mx-auto">
      <PathInk
        svgRef={svgRef}
        pathRef={pathRef}
        pathD={pathD}
        fadeMid={fadeMid}
        fadeEnd={fadeEnd}
      />

      <div className="relative flex flex-col gap-28 py-12">
        {STEPS.map((step, i) => {
          const isActive = activeSteps[i];
          const isRight = step.align === "right";

          return (
            <div
              key={step.id}
              className={`flex items-center gap-5 ${isRight ? "flex-row" : "flex-row-reverse"}`}
            >
              <div
                ref={(el) => {
                  circleRefs.current[i] = el;
                }}
                className={`path-node z-20 ${isActive ? "is-on" : ""}`}
              />

              <div className={`path-card relative z-30 max-w-[360px]${isActive ? " is-on" : ""}`}>
                <StepObject kind={step.id} />
                <div className="path-copy">
                  <p className="path-step-num">{step.number}</p>
                  <h3 className="path-step-title">{step.title}</h3>
                  <p className="path-step-body">{step.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const PathInk = memo(function PathInk({
  svgRef,
  pathRef,
  pathD,
  fadeMid,
  fadeEnd,
}: {
  svgRef: RefObject<SVGSVGElement | null>;
  pathRef: RefObject<SVGPathElement | null>;
  pathD: string;
  fadeMid: number;
  fadeEnd: number;
}) {
  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="path-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset={`${fadeMid}%`} stopColor="white" stopOpacity="1" />
          <stop offset={`${fadeEnd}%`} stopColor="white" stopOpacity="0.3" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id="path-mask">
          <rect width="100%" height="100%" fill="url(#path-fade)" />
        </mask>
      </defs>
      {pathD ? (
        <g mask="url(#path-mask)">
          <path
            d={pathD}
            pathLength={1}
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            ref={pathRef}
            className="path-ink"
            d={pathD}
            pathLength={1}
            stroke="var(--color-accent)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="1"
            strokeDashoffset="1"
          />
        </g>
      ) : null}
    </svg>
  );
});

function StepObject({ kind }: { kind: (typeof STEPS)[number]["id"] }) {
  return (
    <div className={`path-scrap path-scrap-${kind}`} aria-hidden>
      {kind === "story" ? <StoryInk /> : null}
      {kind === "letter" ? <LetterChip /> : null}
      {kind === "send" ? <MailChip /> : null}
    </div>
  );
}

function StoryInk() {
  return (
    <svg viewBox="0 0 160 72" className="w-full h-auto" fill="none">
      <path
        d="M18 28 C36 18, 54 38, 78 26 C96 18, 118 34, 142 22"
        stroke="#1a1a1a"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M22 42 C48 36, 70 48, 102 40 C124 34, 138 44, 148 40"
        stroke="#1a1a1a"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M20 54 C40 50, 62 58, 88 52"
        stroke="#c9a84c"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LetterChip() {
  return (
    <>
      <div className="path-scrap-goldbar" />
      <p className="path-scrap-subject">הנדון: דרישה לתשלום</p>
      <div className="path-scrap-rules" />
    </>
  );
}

function MailChip() {
  return (
    <svg viewBox="0 0 160 88" className="w-full h-auto" fill="none">
      <rect x="18" y="22" width="124" height="52" rx="3" stroke="#1a1a1a" strokeWidth="1.3" />
      <path d="M18 24 L80 52 L142 24" stroke="#c9a84c" strokeWidth="1.4" />
      <circle cx="80" cy="50" r="11" fill="#c9a84c" />
      <circle cx="80" cy="50" r="6" fill="none" stroke="#f7f3ea" strokeWidth="1.2" />
    </svg>
  );
}
