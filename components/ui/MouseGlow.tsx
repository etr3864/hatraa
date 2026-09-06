"use client";

import { useEffect } from "react";

interface ZoneBox {
  el: HTMLElement;
  top: number;
  left: number;
  width: number;
  height: number;
}

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
    let boxes: ZoneBox[] = [];

    const measure = () => {
      boxes = [...document.querySelectorAll<HTMLElement>("[data-glow]")].map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          el,
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        };
      });
    };

    const boxOf = (el: HTMLElement) => boxes.find((box) => box.el === el);

    const zoneAt = (px: number, py: number) => {
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      for (const box of boxes) {
        const left = box.left - scrollX;
        const top = box.top - scrollY;
        if (px >= left && px <= left + box.width && py >= top && py <= top + box.height) {
          return box.el;
        }
      }
      return null;
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
      const box = boxOf(lit);
      if (!box) return;
      spot.style.transform = `translate3d(${x - (box.left - window.scrollX)}px, ${y - (box.top - window.scrollY)}px, 0)`;
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

    measure();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      onLeave();
      document.querySelectorAll(".glow-spot").forEach((node) => node.remove());
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
