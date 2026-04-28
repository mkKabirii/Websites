"use client";
import React, { useEffect, useState, Suspense } from "react";
import Banner from "../components/banner";
import { banner } from "../components/bannerData";
import DetailFooter from "../components/detail_footer";
import { detailFooter } from "../components/detailFooterData";
import ContactForm from "../components/ContactForm";
import Process from "./process";
import processData from "./processData";
import MagnifyText from "../components/MagnifyText";

const sections = [
  {
    heading: "At WGTECSOL (Pvt.) Ltd.",
    description:
      "We follow a structured and collaborative process to ensure the successful delivery of exceptional digital products. Our process combines industry best practices, creative thinking, and a client-centric approach.",
    boxText: "Here's an overview of our typical process:",
  },
];

type OurStoryType = {
  _id: string;
  title?: string;
  description?: string;
};

function Page() {
  const [ourStory, setOurStory] = useState<OurStoryType[]>([]);

  useEffect(() => {
    // Keep process page content isolated from About/OurStory API.
    const normalizedData: OurStoryType[] = processData.map((item, index) => ({
      _id: `${item.number}-${index}`,
      title: item.title,
      description: item.description,
    }));
    setOurStory(normalizedData);
  }, []);

  return (
    <>
      <Banner
        bgImage={banner[2].bgImage}
        heading={banner[2].heading}
        subheading={banner[2].subheading}
      />
      <div className="w-auto h-auto ">
        {sections.map((section) => (
          <section key={section.heading} className="pt-4 md:pt-6 pb-8 md:pb-10">
            <div className="max-w-[1500px] mx-auto px-4 md:px-6">
              <h1 className="text-white text-4xl md:text-[56px] font-bold leading-none mb-4">
                <MagnifyText text={section.heading} />
              </h1>
              <p className="text-white text-base md:text-lg font-medium leading-snug mb-6 md:mb-10 max-w-full md:max-w-[1290px]">
                {section.description}
              </p>
              <div className="inline-block bg-[#333333] rounded-lg px-4 py-2 md:px-6 md:py-3 mt-2">
                <span className="text-white text-lg md:text-2xl font-normal">
                  {section.boxText}
                </span>
              </div>
            </div>
          </section>
        ))}
      </div>
      <Process ourStory={ourStory} />
      <DetailFooter data={detailFooter[0]} />
      <Suspense
        fallback={<div className="text-white">Loading contact form...</div>}
      >
        <ContactForm />
      </Suspense>
    </>
  );
}

export default Page;
