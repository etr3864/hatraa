"use client";

import { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "scale";
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

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const baseStyles: React.CSSProperties = {
    transitionProperty: "opacity, transform",
    transitionDuration: "0.6s",
    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
    transitionDelay: `${delay}ms`,
  };

  const hiddenTransform: Record<string, string> = {
    up: "translateY(30px)",
    left: "translateX(30px)",
    right: "translateX(-30px)",
    scale: "scale(0.92)",
  };

  const style: React.CSSProperties = {
    ...baseStyles,
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? "none" : hiddenTransform[direction],
  };

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
