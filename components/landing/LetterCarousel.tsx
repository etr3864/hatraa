"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LetterPreview } from "@/components/landing/LetterPreview";
import { SAMPLE_LETTERS } from "@/components/landing/sample-letters";

const SWIPE_THRESHOLD = 40;
const AUTOPLAY_MS = 5500;

export function LetterCarousel() {
  const [index, setIndex] = useState(0);
  const [entered, setEntered] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false);
  const [viewportW, setViewportW] = useState(0);
  const startX = useRef<number | null>(null);
  const startY = useRef(0);
  const axis = useRef<"x" | "y" | null>(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntered(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.22, rootMargin: "0px 0px -6%" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const sync = () => setViewportW(el.offsetWidth);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const goTo = useCallback((next: number) => {
    const count = SAMPLE_LETTERS.length;
    const wrapped = ((next % count) + count) % count;
    setIndex(wrapped);
    offsetRef.current = 0;
    setOffsetX(0);
  }, []);

  useEffect(() => {
    const list = tabsRef.current;
    const tab = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!list || !tab) return;
    const listBox = list.getBoundingClientRect();
    const tabBox = tab.getBoundingClientRect();
    const delta = tabBox.left + tabBox.width / 2 - (listBox.left + listBox.width / 2);
    list.scrollBy({ left: delta, behavior: "smooth" });
  }, [index]);

  useEffect(() => {
    pausedRef.current = paused || dragging;
  }, [paused, dragging]);

  useEffect(() => {
    if (!entered || paused || dragging) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(max-width: 767px)").matches) return;

    const id = window.setInterval(() => {
      if (pausedRef.current) return;
      setIndex((current) => (current + 1) % SAMPLE_LETTERS.length);
      offsetRef.current = 0;
      setOffsetX(0);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [entered, paused, dragging]);

  const pause = () => setPaused(true);

  const onPointerDown = (event: React.PointerEvent) => {
    startX.current = event.clientX;
    startY.current = event.clientY;
    axis.current = null;
    offsetRef.current = 0;
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (startX.current === null) return;
    const dx = event.clientX - startX.current;
    const dy = event.clientY - startY.current;

    if (!axis.current) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axis.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (axis.current === "x") {
        pause();
        setDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }

    if (axis.current !== "x") return;
    offsetRef.current = dx;
    setOffsetX(dx);
  };

  const onPointerUp = () => {
    if (startX.current === null) return;
    if (axis.current === "x") {
      const delta = offsetRef.current;
      if (delta <= -SWIPE_THRESHOLD) goTo(index + 1);
      else if (delta >= SWIPE_THRESHOLD) goTo(index - 1);
      else {
        offsetRef.current = 0;
        setOffsetX(0);
      }
    }
    startX.current = null;
    axis.current = null;
    setDragging(false);
  };

  const shift = -index * viewportW + (dragging ? offsetX : 0);

  return (
    <div ref={rootRef} className={`w-full letter-carousel ${entered ? "is-in" : ""}`}>
      <TopicTabs
        ref={tabsRef}
        index={index}
        onSelect={(next) => {
          pause();
          goTo(next);
        }}
      />

      <div
        ref={viewportRef}
        className="letter-carousel-viewport overflow-hidden touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          dir="ltr"
          className="flex will-change-transform"
          style={{
            transform: `translateX(${shift}px)`,
            transition: dragging ? "none" : "transform 480ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {SAMPLE_LETTERS.map((letter) => (
            <div
              key={letter.id}
              className="shrink-0"
              dir="rtl"
              style={{ width: viewportW || "100%" }}
            >
              <LetterPreview letter={letter} />
            </div>
          ))}
        </div>
      </div>

      <Dots
        index={index}
        paused={paused || dragging}
        onSelect={(next) => {
          pause();
          goTo(next);
        }}
      />
    </div>
  );
}

function TopicTabs({
  index,
  onSelect,
  ref,
}: {
  index: number;
  onSelect: (next: number) => void;
  ref: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={ref}
      role="tablist"
      aria-label="נושאי מכתבים"
      className="flex gap-2 overflow-x-auto px-1 pb-4 mb-1 justify-start md:justify-center snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {SAMPLE_LETTERS.map((letter, i) => {
        const active = i === index;
        return (
          <button
            key={letter.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(i)}
            className={
              active
                ? "letter-tab is-on snap-center shrink-0 min-h-11 rounded-full px-4 py-2.5 text-[13px] font-semibold bg-[#c9a84c] text-[#0c0c0e] cursor-pointer transition-[background,color,border-color] duration-300 ease-out"
                : "letter-tab snap-center shrink-0 min-h-11 rounded-full px-4 py-2.5 text-[13px] font-medium border border-white/12 text-[var(--color-body)] cursor-pointer bg-transparent transition-[background,color,border-color] duration-300 ease-out"
            }
          >
            {letter.topic}
          </button>
        );
      })}
    </div>
  );
}

function Dots({
  index,
  paused,
  onSelect,
}: {
  index: number;
  paused: boolean;
  onSelect: (next: number) => void;
}) {
  return (
    <div className="carousel-dots flex justify-center items-center gap-2 mt-4 min-h-8" aria-hidden>
      {SAMPLE_LETTERS.map((letter, i) => (
        <button
          key={letter.id}
          type="button"
          aria-label={letter.topic}
          onClick={() => onSelect(i)}
          className={
            i === index
              ? "relative w-8 h-2 rounded-full bg-[#c9a84c]/25 border-0 cursor-pointer p-0 overflow-hidden"
              : "w-2 h-2 rounded-full bg-white/25 border-0 cursor-pointer p-0"
          }
        >
          {i === index ? (
            <span
              key={index}
              className={`carousel-progress absolute inset-y-0 right-0 bg-[#c9a84c] ${paused ? "is-paused" : ""}`}
            />
          ) : null}
        </button>
      ))}
    </div>
  );
}
