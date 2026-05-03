"use client";
import Image from "next/image";
import Link from "next/link";
import MagnifyText from "./MagnifyText";

interface SectionData {
  bgImage: string;
  logo: string;
  heading: string;
  subtext: string;
  buttonText: string;
  buttonLink?: string;
}

export default function DetailFooter({ data }: { data?: SectionData }) {
  const sectionsToRender = data ? [data] : [];

  if (sectionsToRender.length === 0) {
    return null;
  }

  return (
    <>
      {sectionsToRender.map((section, idx) => (
        <div
          key={idx}
          className="relative w-full h-auto md:h-[597px] flex items-center justify-center overflow-hidden"
        >
          {/* Background Image */}
          <Image
            src={section.bgImage}
            alt="Background"
            fill
            className="object-cover opacity-20"
            sizes="100vw"
          />

          <div className="relative z-20 flex flex-col items-center justify-center w-full px-2 md:px-4">
            <div className="flex items-center justify-center mb-2">
              <Image
                src={section.logo}
                alt="Logo"
                width={900}
                height={900}
                className="rounded-xl w-full max-w-[320px] sm:max-w-[480px] md:max-w-[760px] h-auto object-contain"
                priority
              />
            </div>

            <h1 className="text-xl sm:text-2xl md:text-4xl font-semibold text-center mb-3 md:my-8 text-white">
              <MagnifyText text={section.heading} />
            </h1>

            <p className="w-full text-gray-200 text-sm sm:text-base md:text-lg text-center mb-5 md:mb-10 max-w-full md:max-w-3xl">
              {section.subtext}
            </p>

            {section.buttonLink ? (
              <Link
                href={section.buttonLink}
                className="bg-[#8CE600] hover:bg-[#9eff00] active:bg-[#9eff00] transition font-semibold text-black text-lg md:text-xl font-medium rounded-lg px-8 md:px-12 py-3 md:py-4 shadow-lg transition"
              >
                {section.buttonText}
              </Link>
            ) : (
              <button className="bg-[#8CE600] hover:bg-[#9eff00] active:bg-[#9eff00] transition text-black text-lg md:text-xl font-medium rounded-lg px-8 md:px-12 py-3 md:py-4 shadow-lg transition">
                {section.buttonText}
              </button>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
