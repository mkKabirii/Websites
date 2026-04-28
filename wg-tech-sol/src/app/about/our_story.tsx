"use client";

import MagnifyText from "../components/MagnifyText";

type OurStoryType = {
  _id: string;
  title?: string;
  description?: string;
};

interface OurStoryProps {
  ourStoryData: OurStoryType[];
}
export default function Our_Story({ ourStoryData }: OurStoryProps) {
  return (
    <section className="w-full min-h-screen px-2 sm:px-4 md:px-8">
      <h1 className=" text-[58px] ml-2 font-semibold sm:text-left text-center">
        <MagnifyText text="Our Story" />
      </h1>
      <div className="mx-auto grid grid-cols-1 md:grid-cols-2 gap-0 border-t border-l border-[#232323]">
        {ourStoryData.map((step, index) => (
          <div
            data-aos="fade-zoom-in"
            data-aos-easing="ease-in-back"
            data-aos-delay={50 + index * 150}
            data-aos-offset="0"
            key={step._id}
            className="border-b border-r border-[#232323] flex flex-col p-4 sm:p-6 md:p-10"
          >
            <div className="flex items-center gap-4 sm:gap-8 md:gap-12">
              <span
                className="text-[#d8ff99] font-semibold text-[48px] sm:text-[56px] md:text-[100px] lg:text-[159px] flex items-center mr-4"
                style={{ minWidth: 80, minHeight: 60 }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                className="relative inline-block text-white font-semibold
  text-[clamp(1rem,3.2vw,1.5rem)]
  mt-[clamp(1.5rem,5vw,2.5rem)]
  pb-[clamp(0.25rem,0.6vw,0.5rem)]
  after:content-[''] after:absolute after:left-0 after:bottom-0
  after:h-[2px] after:w-full after:bg-[#232323]
"
              >
                {step.title}
              </span>
            </div>
            <div className="h-[1px] w-full  mb-4 sm:mb-6" />
            <p className="text-gray-300 text-sm sm:text-base md:text-lg font-normal leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
