"use client";
import React, { useEffect, useState } from "react";
import { getServices } from "../../api/module/service";
import Banner from "../components/banner";
import { banner } from "../components/bannerData";
import DetailFooter from "../components/detail_footer";
import { detailFooter } from "../components/detailFooterData";
import { ServicesGrid } from "./serviceCards";
import type { OurServiceType } from "./types";
import MagnifyText from "../components/MagnifyText";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function Page() {
  const [serviceData, setServicesData] = useState<OurServiceType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    handleGetServices();
  }, []);

  useEffect(() => {
    if (serviceData.length) {
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      if (hash) {
        const id = hash.replace("#", "");
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }
  }, [serviceData]);

  const handleGetServices = async () => {
    try {
      const response = await getServices();

      if (response.status === 200 || response.status === 201) {
        const services = Array.isArray(response?.data.data)
          ? (response.data.data as OurServiceType[])
          : [];
        const activeServices = services.filter((s: any) => !s.status || s.status.toLowerCase() === "active");
        setServicesData(activeServices);
      }
    } catch (error) {
      console.error("Error fetching Services data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Banner
        bgImage={banner[0].bgImage}
        heading={banner[0].heading}
        subheading={banner[0].subheading}
      />
      <div className="w-full h-auto py-10 md:py-20 relative">
        {!loading && serviceData.length === 0 && (
          <div className="max-w-[1500px] mx-auto px-4 md:px-6">
            <div className="border border-[#2c2c2c] rounded-xl p-6 bg-[#111111]">
              <h2 className="text-white text-2xl font-semibold mb-2">
                No services found
              </h2>
              <p className="text-[#B3B3B3] text-base">
                Services are not available right now. Please add services from
                the admin panel or verify backend database connection.
              </p>
            </div>
          </div>
        )}
        {serviceData.map((section) => (
          <React.Fragment key={section?._id}>
            <section
              id={slugify(section?.title || "")}
              className="pt-4 md:pt-6 pb-8 md:pb-10"
            >
              <div className="max-w-[1500px] mx-auto px-4 md:px-6">
                <div className="border-l-4 border-[#8CE600] pl-4 md:pl-6">
                  <h1 className="text-white text-4xl md:text-[56px] font-bold leading-none mb-4">
                    <MagnifyText text={section?.title ?? ""} />
                  </h1>
                  <p className="text-white text-base md:text-lg font-medium leading-snug mb-6 md:mb-10 max-w-full md:max-w-[1290px]">
                    {section?.description}
                  </p>
                  <div className="inline-block bg-[#333333] rounded-lg px-4 py-2 md:px-6 md:py-3 mt-2">
                    <span className="text-white text-lg md:text-2xl font-normal">
                      Our {section?.title} services include:
                    </span>
                  </div>
                </div>
              </div>
            </section>
            <ServicesGrid serviceData={[section]} />
          </React.Fragment>
        ))}
      </div>
      <DetailFooter data={detailFooter[1]} />
    </>
  );
}

export default Page;
