"use client";
import { useEffect, useState } from "react";
import { FaArrowUp } from "react-icons/fa";

export default function BackToTop() {
  const [show, setShow] = useState(false);
  const [scrollT, setScrollT] = useState(0);

  const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const mixRgb = (
    from: [number, number, number],
    to: [number, number, number],
    t: number,
  ) => {
    const r = Math.round(lerp(from[0], to[0], t));
    const g = Math.round(lerp(from[1], to[1], t));
    const b = Math.round(lerp(from[2], to[2], t));
    return `rgb(${r} ${g} ${b})`;
  };

  useEffect(() => {
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      setShow(y > 300);

      const doc = document.documentElement;
      const maxScrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
      setScrollT(clamp01(y / maxScrollable));
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fillPct = `${Math.round(scrollT * 1000) / 10}%`;

  return (
    <button
      aria-label="Back to top"
      onClick={scrollToTop}
      style={{
        filter: `brightness(${lerp(0.98, 1.16, scrollT)}) saturate(${lerp(
          1.05,
          1.4,
          scrollT,
        )})`,
        boxShadow: `0 0 ${lerp(10, 22, scrollT)}px rgba(158, 255, 0, ${lerp(
          0.2,
          1,
          scrollT,
        )}), 0 0 ${lerp(24, 92, scrollT)}px rgba(158, 255, 0, ${lerp(
          0.08,
          0.62,
          scrollT,
        )})`,
      }}
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 
                  z-50 rounded-full
                  text-black
                  transition-[transform,box-shadow,opacity,filter] duration-300
                  group
                  hover:scale-110
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9eff00]
                  ${show ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
    >
      <span className="relative grid place-items-center h-12 w-12 sm:h-14 sm:w-14 rounded-full overflow-hidden wg-btt-pot">
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 wg-btt-water"
          style={{
            height: fillPct,
            opacity: lerp(0.65, 0.95, scrollT),
          }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 wg-btt-pot-rim"
          style={{ opacity: lerp(0.55, 0.9, scrollT) }}
        />
        <FaArrowUp className="relative z-10 text-base sm:text-lg motion-safe:group-hover:animate-[wg-btt-bounce_1.05s_ease-in-out_infinite]" />
      </span>
    </button>
  );
}
