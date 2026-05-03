"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import MagnifyText from "./MagnifyText";

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function Hero() {
  const [imgShattering, setImgShattering] = useState(false);
  const imgElRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const runImageShatter = () => {
    if (runningRef.current) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const imgEl = imgElRef.current;
    const canvas = canvasRef.current;
    if (!imgEl || !canvas) return;
    const wrapper = canvas.parentElement as HTMLElement | null;
    if (!wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;

    const dpr = 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${Math.round(rect.width)}px`;
    canvas.style.height = `${Math.round(rect.height)}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const off = document.createElement("canvas");
    off.width = Math.round(rect.width);
    off.height = Math.round(rect.height);
    const offCtx = off.getContext("2d", { willReadFrequently: true });
    if (!offCtx) return;

    offCtx.clearRect(0, 0, off.width, off.height);
    offCtx.drawImage(imgEl, 0, 0, off.width, off.height);
    const imgData = offCtx.getImageData(0, 0, off.width, off.height);
    const data = imgData.data;

    const particles: Array<{
      ox: number;
      oy: number;
      xNorm: number;
      dispX: number;
      dispY: number;
      smokeVX: number;
      smokeVY: number;
      noiseA: number;
      noiseB: number;
      startX: number;
      startY: number;
      phase1: number;
      phase2: number;
      r: number;
      g: number;
      b: number;
      a: number;
    }> = [];

    const cx = off.width / 2;
    const cy = off.height / 2;
    const maxR = Math.hypot(cx, cy);

    let step = Math.max(5, Math.round(Math.min(off.width, off.height) / 140));
    const maxParticles = 550;

    const sample = () => {
      particles.length = 0;
      for (let y = 0; y < off.height; y += step) {
        for (let x = 0; x < off.width; x += step) {
          const i = (y * off.width + x) * 4;
          const a = data[i + 3];
          if (a < 60) continue;

          const r = data[i + 0];
          const g = data[i + 1];
          const b = data[i + 2];

          const dx = x - cx;
          const dy = y - cy;
          const radius0 = Math.hypot(dx, dy);
          const rNorm = Math.min(1, radius0 / maxR);
          const xNorm = x / Math.max(1, off.width);

          // Disintegrate (slow smoke): mostly left drift + soft random motion.
          const len = Math.max(1, radius0);
          const nx = dx / len;
          const ny = dy / len;
          const strength =
            (18 + 55 * Math.pow(rNorm, 0.7)) * (0.7 + Math.random() * 0.8);
          const dispX = (-(0.95 + Math.random() * 0.85) + nx * 0.25) * strength;
          const dispY = (ny * 0.35 + (Math.random() - 0.5) * 0.9) * strength;

          const smokeVX =
            -(22 + 62 * Math.random()) * (0.55 + 0.6 * (1 - xNorm));
          const smokeVY = (Math.random() - 0.5) * (10 + 18 * (1 - rNorm));

          // Rebuild: particles come from the right side (off-canvas), while forming left-to-right.
          const startX = off.width + 30 + Math.random() * off.width * 0.55;
          const startY = y + (Math.random() - 0.5) * (60 + 45 * (1 - rNorm));

          particles.push({
            ox: x,
            oy: y,
            xNorm,
            dispX,
            dispY,
            smokeVX,
            smokeVY,
            noiseA: 0.8 + Math.random() * 1.8,
            noiseB: 0.8 + Math.random() * 2.2,
            startX,
            startY,
            phase1: Math.random() * Math.PI * 2,
            phase2: Math.random() * Math.PI * 2,
            r,
            g,
            b,
            a: a / 255,
          });

          if (particles.length >= maxParticles) return;
        }
      }
    };

    sample();
    if (particles.length < 120) return;

    runningRef.current = true;
    setImgShattering(true);

    const disintegrateMs = 4200;
    const gapMs = 220;
    // Match the separation feel: slow + smooth rebuild.
    const rebuildMs = 4200;
    // Small settle window so the last particles fully land before we end.
    const settleMs = 260;
    const totalMs = disintegrateMs + gapMs + rebuildMs + settleMs;
    const size = Math.max(1.1, Math.min(2.8, step * 0.65));

    const clamp = (v: number, min: number, max: number) =>
      v < min ? min : v > max ? max : v;

    const start = performance.now();
    let lastFrame = 0;
    const draw = (now: number) => {
      if (lastFrame && now - lastFrame < 33) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      lastFrame = now;

      const t = now - start;
      ctx.clearRect(0, 0, off.width, off.height);

      // Keep particles inside bounds so borders don't get clipped.
      const margin = size * 1.25 + 1;
      const minX = margin;
      const maxX = off.width - margin;
      const minY = margin;
      const maxY = off.height - margin;

      const inDisintegrate = t < disintegrateMs;
      const inGap = t >= disintegrateMs && t < disintegrateMs + gapMs;
      const rebuildStart = disintegrateMs + gapMs;
      const rebuildEnd = rebuildStart + rebuildMs;
      const inSettle = t >= rebuildEnd;
      const inRebuild = t >= rebuildStart;

      const rt = (t - rebuildStart) / rebuildMs;
      const rebuildP = Math.min(1, Math.max(0, rt));

      ctx.filter = "none";
      ctx.globalCompositeOperation = "source-over";

      if (inGap) {
        // Let it "vanish" for a brief beat.
        ctx.shadowBlur = 0;
      }

      for (const p of particles) {
        let x = p.ox;
        let y = p.oy;

        // Horizontal sweep width (how soft the edge is)
        const band = 0.28;

        if (inDisintegrate) {
          const sweep = easeInOutCubic(Math.min(1, t / disintegrateMs));

          // local: 0 intact, 1 fully dusted.
          const local = smoothstep((sweep - p.xNorm) / band);
          const timeSec = t / 1000;
          const n1 = Math.sin(timeSec * p.noiseA + p.phase1);
          const n2 = Math.cos(timeSec * p.noiseB + p.phase2);

          // Let smoke drift left and slightly upwards/downwards over time.
          x =
            p.ox +
            p.dispX * local +
            p.smokeVX * timeSec * local +
            n1 * (8 + 10 * (1 - p.xNorm)) * local;
          y =
            p.oy +
            p.dispY * local +
            p.smokeVY * timeSec * local +
            n2 * 10 * local;

          // Allow leaving to the left; keep vertical within view to avoid harsh top/bottom cuts.
          x = clamp(x, -off.width * 0.35, off.width + off.width * 0.15);
          y = clamp(y, -off.height * 0.15, off.height + off.height * 0.15);

          const overall = Math.min(1, t / disintegrateMs);
          const tailFade = 1 - smoothstep((overall - 0.72) / 0.28);
          const alpha =
            Math.min(1, p.a + 0.08) *
            (1 - 0.58 * local) *
            (0.35 + 0.65 * tailFade);
          if (alpha <= 0.02) continue;
          ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha})`;
          ctx.fillRect(x, y, size, size);
          continue;
        }

        if (inGap) {
          continue;
        }

        // Rebuild: particles come from the left, one-by-one (left -> right), then settle.
        const bandRebuild = 0.18;
        const sweep = easeInOutCubic(rebuildP);
        const xKey = p.xNorm; // left-most first
        // Ensure the last particles (xKey=1) can reach local=1 when sweep=1.
        const local = inSettle
          ? 1
          : smoothstep((sweep - (xKey - bandRebuild)) / bandRebuild);
        const timeSec = (t - rebuildStart) / 1000;

        const mix = inSettle ? 1 : easeInOutCubic(local);
        const n1 = Math.sin(timeSec * p.noiseA + p.phase1);
        const n2 = Math.cos(timeSec * p.noiseB + p.phase2);

        // Slightly lower jitter on rebuild for a cleaner, smoother settle.
        x = p.startX + (p.ox - p.startX) * mix + n1 * (1 - mix) * 5;
        y = p.startY + (p.oy - p.startY) * mix + n2 * (1 - mix) * 5;

        // Borders: clamp as it nears final to keep edges crisp.
        const clampK = smoothstep((mix - 0.42) / 0.58);
        if (clampK > 0) {
          x = x * (1 - clampK) + clamp(x, minX, maxX) * clampK;
          y = y * (1 - clampK) + clamp(y, minY, maxY) * clampK;
        }

        const alpha = Math.min(1, p.a + 0.2) * local;
        if (alpha <= 0.02) continue;
        ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha})`;
        ctx.fillRect(x, y, size, size);
      }

      // End: restore crisp image + shimmer
      ctx.filter = "none";

      if (t < totalMs) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, off.width, off.height);
      runningRef.current = false;
      setImgShattering(false);
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  };

  return (
    <main
      data-aos="fade-right"
      className="relative flex flex-col items-center w-full max-h-auto my-10 pt-[60px] sm:pt-20 md:pt-24 overflow-hidden bg-black"
    >
      <div aria-hidden="true" className="wg-hero-bg-glow" />
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg
          width="100%"
          height="100%"
          className="w-full h-full"
          style={{ opacity: 0.18 }}
        >
          <defs>
            <pattern
              id="grid"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 32 0 L 0 0 0 32"
                fill="none"
                stroke="#fff"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      <div className="relative z-10 min-h-[50vh] sm:h-[75vh] md:h-[70vh] lg:h-[75vh] w-auto max-w-screen-xl flex flex-col justify-center items-center gap-6 sm:gap-10 px-4 mb-10 text-center">
        <h1 className="text-white  font-barlow font-semibold leading-tight flex flex-col items-center text-center">
          <MagnifyText
            text="Innovate with"
            className="text-[36px] sm:text-[45px] md:text-[65px] lg:text-[65px] xl:text-[78px]"
          />
          <div
            onPointerEnter={runImageShatter}
            className="relative isolate w-full max-w-[220px] sm:max-w-[300px] md:max-w-[400px] lg:max-w-[450px] overflow-hidden animate-float"
          >
            <Image
              src="/images/WGTS.png"
              alt="WGTS"
              width={500}
              height={500}
              className={`w-full h-auto transition-opacity duration-300 ${imgShattering ? "opacity-0" : "opacity-100"}`}
              priority
              onLoadingComplete={(img) => {
                imgElRef.current = img;
              }}
            />

            <span
              aria-hidden="true"
              className={`wg-hero-image-glow transition-opacity duration-300 ${imgShattering ? "opacity-0" : "opacity-100"}`}
            />

            <canvas
              ref={canvasRef}
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 z-10 transition-opacity duration-300 ${imgShattering ? "opacity-100" : "opacity-0"}`}
            />
          </div>
          <MagnifyText
            text="In Tech Solutions"
            className="text-[28px] sm:text-[40px] md:text-[52px] lg:text-[55px] xl:text-[68px]"
          />
        </h1>
        <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 md:gap-4 w-auto max-w-md mx-auto sm:max-w-none lg:mb-8 xl:mb-12">
          <Link
            href="/work"
            className="text-white text-sm md:text-base lg:text-lg font-normal 
               bg-[rgba(211,211,211,0.12)] border border-white 
               hover:bg-[rgba(211,211,211,0.20)] 
               px-4 py-2 md:px-5 md:py-3 lg:px-7 lg:py-4 
               rounded-[10px] transition-colors text-center"
          >
            View Works
          </Link>

          <Link
            href="https://www.whatsapp.com/channel/0029VbBK7zwHLHQScBygVQ0u"
            target="_blank"
            className="text-neutral-800 text-sm md:text-base lg:text-lg font-normal 
               bg-[#8CE600] hover:bg-[#9eff00] active:bg-[#7acc00] 
               px-4 py-2 md:px-5 md:py-3 lg:px-7 lg:py-4 
               rounded-[10px] transition-colors text-center"
          >
            Updates
          </Link>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full z-0 pointer-events-none">
        <Image
          src="/images/Abstract-Design.png"
          alt="3D Graph"
          className="w-full object-cover"
          style={{ maxHeight: 450 }}
          width={1920}
          height={450}
          priority
        />
      </div>
    </main>
  );
}

export default Hero;
