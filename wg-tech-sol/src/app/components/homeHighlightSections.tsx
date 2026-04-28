"use client";

import Image from "next/image";
import Link from "next/link";
import AOS from "aos";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { HomeStatItem } from "../home/types";
import MagnifyText from "./MagnifyText";

const chooseItems = [
  {
    icon: "/images/Icon1.png",
    title: "Scalable & Secure Solutions",
    description:
      "Future-proof systems designed for reliability, speed, and growth.",
  },
  {
    icon: "/images/Icon4.png",
    title: "Expert Full-Stack Development",
    description:
      "Complete web and mobile builds tailored to your business goals.",
  },
  {
    icon: "/images/Icon7.png",
    title: "Cutting-Edge Technology",
    description:
      "Modern stacks, clean UX, and automation that keeps you ahead.",
  },
];

const fallbackStats: HomeStatItem[] = [
  { value: 2654, label: "Happy Clients", suffix: "+" },
  { value: 1520, label: "Projects Completed", suffix: "+" },
  { value: 120, label: "Awards Won", suffix: "+" },
  { value: 50, label: "Positive Reviews", suffix: "+" },
];

const CountUp = ({
  value,
  suffix,
  durationMs,
  animate,
}: {
  value: number;
  suffix?: string;
  durationMs: number;
  animate: boolean;
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!animate) {
      setDisplayValue(0);
      return undefined;
    }

    let start: number | null = null;
    const target = Number.isFinite(value) ? value : 0;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / durationMs, 1);
      const nextValue = Math.round(target * progress);
      setDisplayValue(nextValue);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animate, durationMs, value]);

  return (
    <span>
      {displayValue.toLocaleString()}
      {suffix ?? "+"}
    </span>
  );
};

export default function HomeHighlightSections({
  stats,
}: {
  stats?: HomeStatItem[];
}) {
  const statsRef = useRef<HTMLDivElement | null>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    const target = statsRef.current;
    if (!target) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setStatsVisible(entry.isIntersecting);
      },
      { threshold: 0.35 },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, []);

  const resolvedStats = useMemo(() => {
    const source = stats && stats.length ? stats : fallbackStats;
    return source.map((stat, index) => {
      const fallback = fallbackStats[index];
      return {
        label: stat.label || fallback?.label || "",
        value: Number(stat.value) || 0,
        suffix: typeof stat.suffix === "string" ? stat.suffix : "+",
      };
    });
  }, [stats]);

  useEffect(() => {
    AOS.refreshHard();
  }, []);

  return (
    <section className="w-full bg-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 space-y-16 sm:space-y-20 lg:space-y-24">
        <div
          data-aos="fade-up"
          className="relative min-h-screen overflow-hidden rounded-2xl border border-white/10 bg-black bg-no-repeat flex items-center"
          style={{
            backgroundImage:
              "url('/images/Enhance_the_provided_202604171543 (1).png')",
            backgroundPosition: "right center",
            backgroundSize: "contain",
          }}
        >
          <div className="absolute inset-0 z-0 bg-black/60" />
          <div className="relative z-10 p-8 sm:p-12 lg:p-16 w-full">
            <div className="max-w-3xl space-y-4 sm:space-y-6">
              <p className="text-sm uppercase tracking-widest text-white/70">
                Ready to scale fast?
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                <MagnifyText text="Ready to take your business to the  next level?" />
              </h2>
              <p className="text-base sm:text-lg text-white/80 max-w-2xl">
                Partner with WG Tech Sol to unlock scalable, secure, and
                future-ready digital solutions. We bring strategy, design, and
                engineering together to help you move faster and smarter.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full bg-[#9EFF00] px-6 py-3 text-base font-semibold text-black transition-transform duration-200 hover:scale-105 hover:bg-[#8CE600]"
              >
                Transform Your Business Now
              </Link>
            </div>
          </div>
        </div>

        <div
          data-aos="fade-up"
          className="relative overflow-hidden rounded-3xl border border-white/10 min-h-[560px] lg:min-h-[640px]"
          style={{
            backgroundImage:
              "url('/images/Enhance_the_provided_202604172036.png')",
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative z-10 p-6 lg:p-12">
            <div className="flex items-stretch">
              {/* Left: visual-only area to keep girl image unobstructed */}
              <div className="hidden lg:block flex-1" />

              {/* Right: all text and icons */}
              <div className="w-full lg:w-1/2 z-20 p-6 lg:p-12 flex flex-col justify-center text-right wg-hero-professional">
                <h3 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white">
                  <MagnifyText text="Why Choose WG Tech Sol?" />
                </h3>

                <h4 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                  A partner built for ambitious teams
                </h4>

                <p className="mt-4 text-base sm:text-lg text-gray-200">
                  We blend strategy, experience design, and engineering to
                  deliver measurable growth.
                  <br />
                  Every project is built with performance, security, and clarity
                  in mind.
                </p>

                <div className="mt-8 space-y-6">
                  {chooseItems.map((item) => (
                    <div
                      key={item.title}
                      className="flex items-start gap-4 justify-end"
                    >
                      <div className="h-14 w-14 flex items-center justify-center rounded-full bg-[#9EFF00]/20 border-2 border-[#9EFF00] shadow-[0_0_24px_rgba(158,255,0,0.28)]">
                        <Image
                          src={item.icon}
                          alt=""
                          width={30}
                          height={30}
                          className="h-7 w-7 object-contain drop-shadow-[0_0_8px_rgba(158,255,0,0.6)]"
                        />
                      </div>
                      <div className="max-w-[360px]">
                        <h4 className="text-lg sm:text-xl font-semibold text-white text-right">
                          {item.title}
                        </h4>
                        <p className="mt-1 text-sm sm:text-base text-gray-200 text-right">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          data-aos="fade-up"
          className="grid min-h-screen gap-8 lg:grid-cols-[1fr_1.1fr] items-center"
        >
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-widest text-[#9EFF00]">
              Our achievements
            </p>
            <h3 className="text-3xl sm:text-4xl font-bold text-white">
              Results that speak for themselves
            </h3>
            <p className="text-base sm:text-lg text-gray-300">
              Our clients trust us to deliver outcomes that move the needle.
              From startups to enterprise teams, we ship fast and keep quality
              high.
            </p>
            <Link
              href="/wgAuthForm"
              className="inline-flex items-center justify-center rounded-full border border-[#9EFF00] px-6 py-3 text-base font-semibold text-[#9EFF00] transition-all duration-200 hover:bg-[#9EFF00] hover:text-black"
            >
              Explore Our Solutions
            </Link>
          </div>
          <div ref={statsRef} className="grid gap-6 sm:grid-cols-2">
            {resolvedStats.map((stat) => (
              <div
                key={stat.label}
                className="wg-card rounded-2xl border border-[#9EFF00]/30 bg-gradient-to-br from-[#9EFF00]/20 via-white/5 to-transparent p-6 text-center shadow-lg shadow-[#9EFF00]/10"
              >
                <p className="text-3xl sm:text-4xl font-bold text-white">
                  <CountUp
                    value={stat.value}
                    suffix={stat.suffix}
                    durationMs={1400}
                    animate={statsVisible}
                  />
                </p>
                <p className="mt-2 text-xs sm:text-sm text-gray-300">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
