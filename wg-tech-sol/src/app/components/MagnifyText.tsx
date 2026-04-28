"use client";

import React, { useEffect, useRef } from "react";

export default function MagnifyText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const radiusPx = 90;
    const strength = 0.38;
    const colorStrength = 0.85;
    let rafId = 0;

    const applyMagnify = (clientX: number) => {
      const chars = container.querySelectorAll<HTMLElement>(".wg-hero-char");
      chars.forEach((ch) => {
        const rect = ch.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const dist = Math.abs(clientX - centerX);
        const t = Math.max(0, (radiusPx - dist) / radiusPx);
        const scale = 1 + t * strength;
        ch.style.transform = `scale(${scale})`;

        const k = t * colorStrength;
        if (k <= 0) {
          ch.style.color = "";
          ch.style.textShadow = "";
          return;
        }

        const r = Math.round(255 - k * (255 - 158));
        const g = Math.round(255 - k * (255 - 255));
        const b = Math.round(255 - k * (255 - 0));
        ch.style.color = `rgb(${r}, ${g}, ${b})`;
        ch.style.textShadow = `0 0 ${Math.round(10 * k)}px rgba(158, 255, 0, ${0.35 * k})`;
      });
    };

    const resetMagnify = () => {
      const chars = container.querySelectorAll<HTMLElement>(".wg-hero-char");
      chars.forEach((ch) => {
        ch.style.transform = "scale(1)";
        ch.style.color = "";
        ch.style.textShadow = "";
      });
    };

    const onPointerMove = (e: PointerEvent) => {
      cancelAnimationFrame(rafId);
      const x = e.clientX;
      rafId = requestAnimationFrame(() => applyMagnify(x));
    };

    const onPointerLeave = () => {
      cancelAnimationFrame(rafId);
      resetMagnify();
    };

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);

    return () => {
      cancelAnimationFrame(rafId);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      resetMagnify();
    };
  }, []);

  return (
    <span
      ref={containerRef}
      className={`wg-hero-magnify ${className ?? ""}`}
      aria-label={text}
    >
      {Array.from(text).map((ch, idx) => (
        <span key={`${ch}-${idx}`} className="wg-hero-char" aria-hidden="true">
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </span>
  );
}
