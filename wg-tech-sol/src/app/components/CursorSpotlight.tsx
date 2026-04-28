"use client";

import React, { useEffect, useRef, useState } from "react";

export default function CursorSpotlight() {
  const elRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastPosRef = useRef<{ x: number; y: number }>({ x: -9999, y: -9999 });
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

    if (prefersReducedMotion || isCoarsePointer) {
      setEnabled(false);
      return;
    }

    setEnabled(true);

    const schedule = () => {
      if (rafRef.current != null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        const el = elRef.current;
        if (!el) return;
        const { x, y } = lastPosRef.current;
        el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      });
    };

    const onPointerMove = (e: PointerEvent) => {
      // center the spotlight on cursor
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      schedule();
    };

    const onPointerLeave = () => {
      const el = elRef.current;
      if (!el) return;
      el.style.opacity = "0";
    };

    const onPointerEnter = () => {
      const el = elRef.current;
      if (!el) return;
      el.style.opacity = "1";
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("blur", onPointerLeave);
    window.addEventListener("focus", onPointerEnter);
    document.addEventListener("mouseleave", onPointerLeave);
    document.addEventListener("mouseenter", onPointerEnter);

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", onPointerLeave);
      window.removeEventListener("focus", onPointerEnter);
      document.removeEventListener("mouseleave", onPointerLeave);
      document.removeEventListener("mouseenter", onPointerEnter);
    };
  }, []);

  if (!enabled) return null;

  return <div ref={elRef} aria-hidden="true" className="wg-cursor-spotlight" />;
}
