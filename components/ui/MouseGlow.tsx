"use client";

import { useEffect } from "react";

export function MouseGlow() {
  useEffect(() => {
    if (window.matchMedia("(hover: none), (max-width: 767px)").matches) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 3;
    let lit: HTMLElement | null = null;
    let spot: HTMLElement | null = null;
    let frame = 0;
    let armed = false;
    let dirty = false;

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

    document.querySelectorAll<HTMLElement>("[data-glow]").forEach((zone) => {
      zone.style.removeProperty("--glow-x");
      zone.style.removeProperty("--glow-y");
    });

    const spotFor = (zone: HTMLElement) => {
      zone.style.removeProperty("--glow-x");
      zone.style.removeProperty("--glow-y");
      const existing = zone.querySelector<HTMLElement>(":scope > .glow-spot");
      if (existing) return existing;
      const next = document.createElement("div");
      next.className = "glow-spot";
      next.dataset.glow = zone.dataset.glow ?? "";
      next.setAttribute("aria-hidden", "true");
      zone.prepend(next);
      return next;
    };

    const paint = () => {
      const zone = zoneAt(x, y);
      if (zone && zone !== lit) {
        lit?.classList.remove("is-lit");
        lit = zone;
        spot = spotFor(zone);
        zone.classList.add("is-lit");
      }
      if (!zone && lit) {
        lit.classList.remove("is-lit");
        lit = null;
        spot = null;
        return;
      }
      if (!lit || !spot) return;
      const box = lit.getBoundingClientRect();
      spot.style.transform = `translate3d(${x - box.left}px, ${y - box.top}px, 0)`;
    };

    const loop = () => {
      frame = 0;
      if (!dirty) return;
      dirty = false;
      if (armed) paint();
    };

    const kick = () => {
      dirty = true;
      if (!frame) frame = requestAnimationFrame(loop);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      armed = true;
      x = event.clientX;
      y = event.clientY;
      kick();
    };

    const onScroll = () => {
      if (armed) kick();
    };

    const onLeave = () => {
      lit?.classList.remove("is-lit");
      lit = null;
      spot = null;
      armed = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("wheel", onScroll, { capture: true, passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      onLeave();
      document.querySelectorAll(".glow-spot").forEach((node) => node.remove());
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("wheel", onScroll, true);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
