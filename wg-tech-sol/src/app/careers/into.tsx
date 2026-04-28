import React from "react";
import MagnifyText from "../components/MagnifyText";

type Section = {
  heading: string;
  description: string;
  boxText?: string;
};

type IntoProps = {
  section: Section;
};

function Into({ section }: IntoProps) {
  return (
    <div className="w-auto h-auto mt-4">
      <section className="py-2 md:py-4 mt-12">
        <div className="mx-auto px-6 md:px-8">
          <h1 className="text-4xl md:text-[50px] mb-5">
            <MagnifyText text={section.heading} />
          </h1>
          <p className="text-[#E6E6E6] text-base md:text-lg leading-snug mb-6 ">
            {section.description}
          </p>
          {section.boxText && (
            <div className="inline-block bg-[#333333] rounded-lg px-4 py-2 md:px-6 md:py-3 mt-2">
              <span className="text-white text-lg md:text-2xl font-normal">
                {section.boxText}
              </span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Into;
