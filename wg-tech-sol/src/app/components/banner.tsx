"use client";
import Image from "next/image";
import MagnifyText from "./MagnifyText";

interface BannerProps {
  bgImage: string;
  heading: string;
  headingTwo?: string;
  subheading: string;
}

export default function Banner({
  bgImage,
  heading,
  headingTwo,
  subheading,
}: BannerProps) {
  return (
    <section className="w-full">
      <div className="relative w-full overflow-hidden">
        {/* Responsive padding for different screen sizes */}
        <div className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 lg:px-12">
          {/* Background image */}
          <div className="absolute inset-0 -z-10">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/30 z-10" />
            <Image
              src={bgImage}
              alt="Banner Background"
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          </div>

          {/* Content container */}
          {/* <div className="relative z-20 max-w-4xl mx-auto text-center space-y-4 sm:space-y-6 md:space-y-8">
            <h2 className="text-white font-bold leading-tight
              text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl
              px-4 sm:px-6 md:px-8">
              {heading}
            </h2>
            {headingTwo && (

              <h2 className="text-white font-bold leading-tight
              text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl
              px-4 sm:px-6 md:px-8">
              {headingTwo}
            </h2>
            )}
            <p className="text-gray-200 max-w-2xl mx-auto leading-relaxed
              text-sm sm:text-base md:text-lg lg:text-xl
              px-4 sm:px-6 md:px-8">
              {subheading}
            </p>
          </div> */}
          {/* Content container */}
          <div className="relative z-20 max-w-4xl mx-auto text-center">
            <div className="bg-black/50 backdrop-blur-sm rounded-lg py-6 px-4 sm:px-6 md:px-8 space-y-4 sm:space-y-6 md:space-y-8">
              <h2
                className="text-white font-bold leading-tight
      text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl"
              >
                <MagnifyText text={heading} />
              </h2>

              {headingTwo && (
                <h2
                  className="text-white font-bold leading-tight
        text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl"
                >
                  <MagnifyText text={headingTwo} />
                </h2>
              )}

              <p
                className="text-gray-200 max-w-2xl mx-auto leading-relaxed
      text-sm sm:text-base md:text-lg lg:text-xl"
              >
                {subheading}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
