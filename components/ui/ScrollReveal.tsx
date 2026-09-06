"use client";

import { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "scale";
}

function motionReduced(): boolean {
  if (typeof window === "undefined") return false;
  if (document.documentElement.dataset.a11yMotion === "reduce") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (motionReduced()) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -12%" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hiddenTransform: Record<string, string> = {
    up: "translateY(18px)",
    left: "translateX(16px)",
    right: "translateX(-16px)",
    scale: "scale(0.97)",
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transitionProperty: "opacity, transform",
        transitionDuration: "0.9s",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${delay}ms`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "none" : hiddenTransform[direction],
      }}
    >
      {children}
    </div>
  );
}
