"use client";
import { useEffect, useState } from "react";
import Banner from "../components/banner";
import { banner } from "../components/bannerData";
import DetailFooter from "../components/detail_footer";
import { detailFooter } from "../components/detailFooterData";
import WorkCard from "./WorkCard";
import { getAllWork } from "../../api/module/work";
import MagnifyText from "../components/MagnifyText";

// Types import karo from types file
import { WorkCategory } from "./types";

function Page() {
  const [workData, setWorkData] = useState<WorkCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWork();
  }, []);

  useEffect(() => {
    if (!loading && workData.length) {
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      if (hash) {
        const id = hash.replace("#", "");
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }

        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent("wg-hash-scroll", { detail: id }),
          );
        }, 120);
      }
    }
  }, [loading, workData]);

  const fetchWork = async () => {
    try {
      const response = await getAllWork();
      if (response.status === 200 || response.status === 201) {
        // API structure: response.data.data.works (array of categories)
        // Ya phir: response.data.works
        let workCategories: WorkCategory[] = [];

        // Pehle check karo response.data.data.works
        if (
          response.data?.data?.works &&
          Array.isArray(response.data.data.works)
        ) {
          workCategories = response.data.data.works;
        }
        // Phir check karo response.data.works
        else if (response.data?.works && Array.isArray(response.data.works)) {
          workCategories = response.data.works;
        }
        // Agar response.data.data directly array hai
        else if (Array.isArray(response.data?.data)) {
          workCategories = response.data.data;
        }
        // Agar response.data directly array hai
        else if (Array.isArray(response.data)) {
          workCategories = response.data;
        }

        // Ensure karo ke workCategories hamesha array hai
        if (!Array.isArray(workCategories)) {
          console.error("Work data is not an array:", workCategories);
          workCategories = [];
        }

        setWorkData(workCategories);
      }
    } catch (error) {
      console.error("Error fetching work categories:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Banner
        bgImage={banner[1].bgImage}
        heading={banner[1].heading}
        subheading={banner[1].subheading}
      />
      <div className="w-auto h-auto ">
        <section className="pt-4 md:pt-6 pb-8 md:pb-10">
          <div className="max-w-[1500px] mx-auto px-4 md:px-6">
            <h1 className="text-white text-4xl md:text-[56px] font-bold leading-none mb-4">
              <MagnifyText text="Our Work Portfolio" />
            </h1>
            <p className="text-white text-base md:text-lg font-medium leading-snug mb-6 md:mb-10 max-w-full md:max-w-[1290px]">
              Explore our delivered projects across multiple categories and industries.
            </p>
            <div className="inline-block bg-[#333333] rounded-lg px-4 py-2 md:px-6 md:py-3 mt-2">
              <span className="text-white text-lg md:text-2xl font-normal">
                {loading
                  ? "Loading portfolio categories..."
                  : `${workData.length} portfolio categories available`}
              </span>
            </div>
          </div>
        </section>
      </div>
      <WorkCard workData={workData} loading={loading} />

      <DetailFooter data={detailFooter[1]} />
    </>
  );
}

export default Page;
