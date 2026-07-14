"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { IconFileText, IconBrain, IconDownload, IconCircleCheck } from "@tabler/icons-react";

const STEPS = [
  {
    icon: IconFileText,
    number: "01",
    title: "ספר לנו מה קרה",
    description: "כתב או הקלט בקול.\nבלי טפסים, בלי שפה משפטית.\nרק תספר מה עשו לך.",
    align: "right" as const,
  },
  {
    icon: IconBrain,
    number: "02",
    title: "AI מנתח ומנסח",
    description: "המערכת בודקת את המקרה,\nמזהה סעיפי חוק רלוונטיים,\nומייצרת מכתב מקצועי.",
    align: "left" as const,
  },
  {
    icon: IconDownload,
    number: "03",
    title: "הורד ושלח",
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
  const [stepThresholds, setStepThresholds] = useState<number[]>([0.33, 0.5, 0.66]);
  const [lastPointY, setLastPointY] = useState(0);
  const [containerH, setContainerH] = useState(0);

  const calculatePath = useCallback(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    const containerRect = container.getBoundingClientRect();
    const points: { x: number; y: number }[] = [];

    circleRefs.current.forEach((circleEl) => {
      if (!circleEl) return;
      const rect = circleEl.getBoundingClientRect();
      const x = rect.left + rect.width / 2 - containerRect.left;
      const y = rect.top + rect.height / 2 - containerRect.top;
      points.push({ x, y });
    });

    if (points.length < 3) return;

    const w = containerRect.width;
    const h = containerRect.height;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    setLastPointY(points[2].y);
    setContainerH(h);

    const centerX = w / 2;

    let d = `M ${centerX} 0`;

    const cp1y = points[0].y * 0.5;
    d += ` C ${centerX} ${cp1y}, ${points[0].x} ${cp1y}, ${points[0].x} ${points[0].y}`;

    const mid01y = (points[0].y + points[1].y) / 2;
    d += ` C ${points[0].x} ${mid01y}, ${points[1].x} ${mid01y}, ${points[1].x} ${points[1].y}`;

    const mid12y = (points[1].y + points[2].y) / 2;
    d += ` C ${points[1].x} ${mid12y}, ${points[2].x} ${mid12y}, ${points[2].x} ${points[2].y}`;

    setPathD(d);

    setTimeout(() => {
      const path = pathRef.current;
      if (!path) return;
      const totalLength = path.getTotalLength();
      if (totalLength === 0) return;

      const thresholds: number[] = [];
      for (const pt of points) {
        let closestDist = Infinity;
        let closestT = 0;
        const steps = 200;
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const pathPt = path.getPointAtLength(t * totalLength);
          const dist = Math.hypot(pathPt.x - pt.x, pathPt.y - pt.y);
          if (dist < closestDist) {
            closestDist = dist;
            closestT = t;
          }
        }
        thresholds.push(closestT);
      }
      setStepThresholds(thresholds);
    }, 50);
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
    if (!container) return;

    let rafId: number;

    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const containerTop = rect.top;
        const containerHeight = rect.height;

        const start = windowHeight * 0.75;
        const scrolled = start - containerTop;
        const totalScrollable = containerHeight;

        const pct = Math.max(0, Math.min(1, scrolled / totalScrollable));
        progressRef.current = pct;

        const path = pathRef.current;
        if (path && pathD) {
          const length = path.getTotalLength();
          path.style.strokeDashoffset = `${length * (1 - pct)}`;
        }

        const newActive = stepThresholds.map((t) => pct >= t);
        const changed = newActive.some((v, i) => v !== activeSteps[i]);
        if (changed) {
          setActiveSteps(newActive);
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [stepThresholds, pathD, activeSteps]);

  useEffect(() => {
    const path = pathRef.current;
    if (!path || !pathD) return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length * (1 - progressRef.current)}`;
  }, [pathD]);

  const isLastActive = activeSteps[2];

  return (
    <div ref={containerRef} className="relative max-w-2xl mx-auto">
      {/* SVG winding path */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="path-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset={`${((lastPointY - 20) / containerH) * 100}%`} stopColor="white" stopOpacity="1" />
            <stop offset={`${(lastPointY / containerH) * 100}%`} stopColor="white" stopOpacity="0.3" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="path-mask">
            <rect width="100%" height="100%" fill="url(#path-fade)" />
          </mask>
        </defs>
        {pathD && (
          <g mask="url(#path-mask)">
            <path
              d={pathD}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              ref={pathRef}
              d={pathD}
              stroke="var(--color-accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              className="will-change-[stroke-dashoffset]"
            />
          </g>
        )}
      </svg>

      <div className="relative flex flex-col gap-28 py-12">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = activeSteps[i];
          const isRight = step.align === "right";
          const isLast = i === STEPS.length - 1;

          return (
            <div
              key={step.number}
              data-step={i}
              className={`flex items-center gap-5 ${isRight ? "flex-row" : "flex-row-reverse"}`}
            >
              {/* Number circle */}
              <div className="relative flex-shrink-0 z-20">
                <div
                  ref={(el) => { circleRefs.current[i] = el; }}
                  className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                    isActive
                      ? "border-[var(--color-accent)] bg-[#1a1610] scale-110 shadow-[0_0_28px_-4px_rgba(201,168,76,0.6)]"
                      : "border-white/[0.12] bg-[#0e0e11]"
                  }`}
                >
                  <span
                    className={`text-base font-bold transition-colors duration-500 ${
                      isActive ? "text-[#C9A84C]" : "text-zinc-500"
                    }`}
                  >
                    {step.number}
                  </span>
                </div>
                {/* Pulse ring on last step */}
                {isLast && isLastActive && (
                  <div className="absolute inset-0 rounded-full border-2 border-[var(--color-accent)]/40 animate-ping" />
                )}
              </div>

              {/* Content card */}
              <div
                className={`relative z-30 max-w-[260px] transition-all duration-700 ease-out ${
                  isActive
                    ? "opacity-100 translate-x-0 translate-y-0"
                    : `opacity-0 ${isRight ? "translate-x-8" : "-translate-x-8"} translate-y-4`
                }`}
              >
                <div className={`p-4 rounded-xl bg-[#13131a]/60 backdrop-blur-lg border border-white/[0.07] hover:bg-[#1a1a24]/70 hover:border-white/[0.12] hover:scale-[1.02] hover:-translate-y-0.5 ${isActive ? "border-[var(--color-accent)]/20" : ""} ${isLast && isLastActive ? "animate-[celebrateGlow_2s_ease-in-out_infinite]" : ""} transition-all duration-300 cursor-default`}>
                  <div
                    className={`w-8 h-8 rounded-md flex items-center justify-center mb-2.5 transition-all duration-500 ${
                      isActive
                        ? "bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30"
                        : "bg-white/[0.04] border border-white/[0.08]"
                    }`}
                  >
                    {isLast && isLastActive ? (
                      <IconCircleCheck size={15} className="text-[var(--color-accent)] animate-pulse" />
                    ) : (
                      <Icon
                        size={15}
                        className={`transition-colors duration-500 ${
                          isActive ? "text-[var(--color-accent)]" : "text-[var(--color-subtle)]"
                        }`}
                      />
                    )}
                  </div>
                  <h3
                    className={`text-sm font-semibold mb-1 transition-colors duration-500 ${
                      isActive ? "text-white" : "text-zinc-500"
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
