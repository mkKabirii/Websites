"use client";

import React, { useEffect, useRef, useState } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Position of the mouse
  const mouse = useRef({ x: 0, y: 0 });
  // Trailing position of the circle
  const circlePos = useRef({ x: 0, y: 0 });
  
  const rafId = useRef<number>(null);

  useEffect(() => {
    // Disable on touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      // Move dot immediately
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
    };

    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    const animate = () => {
      // Smoothly interpolate circle position
      circlePos.current.x += (mouse.current.x - circlePos.current.x) * 0.15;
      circlePos.current.y += (mouse.current.y - circlePos.current.y) * 0.15;

      if (circleRef.current) {
        circleRef.current.style.transform = `translate3d(${circlePos.current.x}px, ${circlePos.current.y}px, 0) translate(-50%, -50%)`;
      }

      rafId.current = requestAnimationFrame(animate);
    };

    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isVisible]);

  return (
    <>
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-2 h-2 bg-[#9EFF00] rounded-full pointer-events-none z-[9999]"
        style={{
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.2s ease-in-out",
        }}
      />
      <div
        ref={circleRef}
        className="fixed top-0 left-0 w-8 h-8 border border-[#9EFF00] rounded-full pointer-events-none z-[9999]"
        style={{
          opacity: isVisible ? 0.6 : 0,
          transition: "opacity 0.2s ease-in-out",
        }}
      />
    </>
  );
}
