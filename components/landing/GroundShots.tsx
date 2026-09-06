"use client";

import { useEffect, useRef, useState } from "react";

type Shot = {
  num: string;
  title: string;
  body: string;
};

export function GroundShots({ items }: { items: Shot[] }) {
  const rootRef = useRef<HTMLOListElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef(0);
  const onRef = useRef([false, false, false]);
  const [lit, setLit] = useState([false, false, false]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let raf = 0;
    let running = false;
    let current = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ease = reduced ? 1 : 0.12;
    const marks = [0.08, 0.5, 0.92];

    const targetFromScroll = () => {
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.72;
      const travel = rect.height + vh * 0.12;
      return Math.max(0, Math.min(1, (start - rect.top) / travel));
    };

    const apply = (pct: number) => {
      progressRef.current = pct;
      if (fillRef.current) fillRef.current.style.transform = `scaleY(${pct})`;
      const next = marks.map((mark) => pct >= mark);
      if (next.some((value, i) => value !== onRef.current[i])) {
        onRef.current = next;
        setLit(next);
      }
    };

    const tick = () => {
      const target = targetFromScroll();
      current += (target - current) * ease;
      if (Math.abs(target - current) < 0.0008) current = target;
      apply(current);

      const rect = root.getBoundingClientRect();
      const away = rect.bottom < -80 || rect.top > window.innerHeight + 80;
      if (away && current === target) {
        running = false;
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const kick = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick, { passive: true });
    kick();
    return () => {
      running = false;
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <ol ref={rootRef} className="ground-shots">
      <span className="ground-shots-rail" aria-hidden>
        <span ref={fillRef} className="ground-shots-fill" />
      </span>
      {items.map((item, i) => (
        <li key={item.num} className={`ground-shot${lit[i] ? " is-on" : ""}`}>
          <span className="ground-shot-seal" aria-hidden />
          <div className="ground-shot-copy">
            <p className="ground-pillar-num">{item.num}</p>
            <p className="ground-pillar-title">{item.title}</p>
            <p className="ground-pillar-body">{item.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
