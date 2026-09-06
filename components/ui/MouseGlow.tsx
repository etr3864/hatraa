"use client";

import { useEffect } from "react";

export function MouseGlow() {
  useEffect(() => {
    if (window.matchMedia("(hover: none), (max-width: 767px)").matches) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 3;
    let lit: HTMLElement | null = null;
    let frame = 0;
    let armed = false;

    const zoneAt = (px: number, py: number) => {
      if (lit) {
        const box = lit.getBoundingClientRect();
        if (px >= box.left && px <= box.right && py >= box.top && py <= box.bottom) {
          return lit;
        }
      }
      const hit = document.elementFromPoint(px, py);
      return hit instanceof Element ? hit.closest<HTMLElement>("[data-glow]") : null;
    };

    const paint = () => {
      const zone = zoneAt(x, y);
      if (zone && zone !== lit) {
        lit?.classList.remove("is-lit");
        lit = zone;
        zone.classList.add("is-lit");
      }
      if (!zone && lit) {
        lit.classList.remove("is-lit");
        lit = null;
        return;
      }
      if (!lit) return;
      const box = lit.getBoundingClientRect();
      lit.style.setProperty("--glow-x", `${x - box.left}px`);
      lit.style.setProperty("--glow-y", `${y - box.top}px`);
    };

    const loop = () => {
      frame = requestAnimationFrame(loop);
      if (armed) paint();
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      armed = true;
      x = event.clientX;
      y = event.clientY;
    };

    const onScroll = () => {
      if (armed) paint();
    };

    const onLeave = () => {
      lit?.classList.remove("is-lit");
      lit = null;
      armed = false;
    };

    frame = requestAnimationFrame(loop);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("wheel", onScroll, { capture: true, passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      onLeave();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("wheel", onScroll, true);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
