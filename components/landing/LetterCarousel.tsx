"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LetterPreview } from "@/components/landing/LetterPreview";
import { SAMPLE_LETTERS } from "@/components/landing/sample-letters";

const SWIPE_THRESHOLD = 48;
const SLIDE_RATIO = 0.88;
const AUTOPLAY_MS = 5500;

export function LetterCarousel() {
  const [index, setIndex] = useState(0);
  const [entered, setEntered] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false);
  const [viewportW, setViewportW] = useState(0);
  const startX = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

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
      { threshold: 0.28, rootMargin: "0px 0px -8%" }
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
    const last = SAMPLE_LETTERS.length - 1;
    const wrapped = ((next % SAMPLE_LETTERS.length) + SAMPLE_LETTERS.length) % SAMPLE_LETTERS.length;
    setIndex(Math.max(0, Math.min(last, wrapped)));
    offsetRef.current = 0;
    setOffsetX(0);
  }, []);

  useEffect(() => {
    pausedRef.current = paused || dragging;
  }, [paused, dragging]);

  useEffect(() => {
    if (!entered || paused || dragging) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
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
    pause();
    startX.current = event.clientX;
    offsetRef.current = 0;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (startX.current === null) return;
    const delta = event.clientX - startX.current;
    offsetRef.current = delta;
    setOffsetX(delta);
  };

  const onPointerUp = () => {
    if (startX.current === null) return;
    const delta = offsetRef.current;
    if (delta <= -SWIPE_THRESHOLD) goTo(index + 1);
    else if (delta >= SWIPE_THRESHOLD) goTo(index - 1);
    else {
      offsetRef.current = 0;
      setOffsetX(0);
    }
    startX.current = null;
    setDragging(false);
  };

  const slideW = viewportW * SLIDE_RATIO;
  const shift = -index * slideW + (dragging ? offsetX : 0);

  return (
    <div
      ref={rootRef}
      className={`w-full letter-carousel ${entered ? "is-in" : ""}`}
      onPointerDown={pause}
    >
      <TopicTabs
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
          {SAMPLE_LETTERS.map((letter, i) => (
            <div
              key={letter.id}
              className="shrink-0"
              dir="rtl"
              style={{ width: viewportW ? slideW : "88%" }}
            >
              <LetterPreview letter={letter} dimmed={i !== index} />
            </div>
          ))}
        </div>
      </div>

      <p className="carousel-hint mt-3 text-center text-[12px] tracking-wide text-[var(--color-subtle)]">
        החליקו בין הנושאים · {index + 1} מתוך {SAMPLE_LETTERS.length}
      </p>
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
}: {
  index: number;
  onSelect: (next: number) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="נושאי מכתבים"
      className="flex gap-2 overflow-x-auto pb-4 mb-1 justify-start md:justify-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                ? "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold bg-[#c9a84c] text-[#0c0c0e] cursor-pointer transition-[background,color,border-color,transform] duration-300 ease-out"
                : "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium border border-white/12 text-[var(--color-body)] hover:text-[var(--color-ink)] hover:border-white/25 cursor-pointer bg-transparent transition-[background,color,border-color,transform] duration-300 ease-out"
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
    <div className="carousel-dots flex justify-center gap-2 mt-3" aria-hidden>
      {SAMPLE_LETTERS.map((letter, i) => (
        <button
          key={letter.id}
          type="button"
          aria-label={letter.topic}
          onClick={() => onSelect(i)}
          className={
            i === index
              ? "relative w-8 h-1.5 rounded-full bg-[#c9a84c]/25 border-0 cursor-pointer p-0 overflow-hidden"
              : "w-1.5 h-1.5 rounded-full bg-white/25 border-0 cursor-pointer p-0"
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
