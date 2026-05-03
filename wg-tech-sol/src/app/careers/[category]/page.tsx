"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Banner from "../../components/banner";
import { banner } from "../../components/bannerData";
import SquareUpHero from "../../about/squareUpHero";
import { getOpportunitiesData } from "@/api/module/carear";
import {
  jobOpenings,
  JobSection,
  Job,
  OpportunityGroup,
} from "../openings";

export default function CareerCategoryPage() {
  const params = useParams();
  // Decode the category from the URL (handles "IoT & Advanced Technology" etc.)
  const rawCategory = decodeURIComponent(
    Array.isArray(params?.category) ? params.category[0] : params?.category ?? ""
  );

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryLabel, setCategoryLabel] = useState(rawCategory);

  useEffect(() => {
    if (!rawCategory) return;
    fetchCategoryJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawCategory]);

  const fetchCategoryJobs = async () => {
    setLoading(true);
    try {
      const response = await getOpportunitiesData();

      if (response.status === 200 || response.status === 201) {
        const data = response?.data?.data || response?.data;
        const opportunities: OpportunityGroup[] = data?.opportunities || [];

        // Find the group whose name matches the category param (case-insensitive)
        const matched = opportunities
          .filter((g) => g.status === "Active")
          .find(
            (g) => g.name.toLowerCase() === rawCategory.toLowerCase()
          );

        if (matched) {
          setCategoryLabel(matched.name);
          setJobs(
            matched.opportunity.map((opp) => ({
              title: opp.title,
              description: opp.description,
              image: opp.image,
            }))
          );
          return;
        }
      }

      // No API match — fall back to static data
      const fallbackSection = jobOpenings.find((s) =>
        s.section.toLowerCase().includes(rawCategory.toLowerCase())
      );
      setJobs(fallbackSection?.jobs ?? []);
    } catch (error) {
      console.error("Error fetching category jobs:", error);
      // Fallback: filter static jobOpenings by section name
      const fallbackSection = jobOpenings.find((s) =>
        s.section.toLowerCase().includes(rawCategory.toLowerCase())
      );
      setJobs(fallbackSection?.jobs ?? []);
    } finally {
      setLoading(false);
    }
  };

  // ---------- render ----------
  return (
    <>
      <Banner
        bgImage={banner[4].bgImage}
        heading={banner[4].heading}
        headingTwo={banner[4].headingTwo}
        subheading={banner[4].subheading}
      />

      {/* Category heading */}
      <section className="py-10 px-6 md:px-10 mt-10">
        <div className="max-w-[1500px] mx-auto">
          <div className="border-l-4 border-[#8CE600] pl-4 md:pl-6 mb-2">
            <h1 className="text-white text-3xl md:text-5xl font-bold capitalize">
              {categoryLabel}
            </h1>
          </div>
          <p className="text-[#98989A] mt-4 text-base md:text-lg">
            Explore active roles in{" "}
            <span className="text-[#8CE600] font-medium">{categoryLabel}</span>.
            Select a position that matches your strengths and apply directly
            through our application form.
          </p>
        </div>
      </section>

      {/* Jobs grid */}
      <div className="w-auto min-h-[40vh] py-6 px-4 md:px-10 mb-16">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px] text-gray-400 text-xl">
            Loading openings…
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
            <p className="text-gray-400 text-xl text-center">
              No openings found for{" "}
              <span className="text-[#8CE600]">{categoryLabel}</span> at the
              moment.
            </p>
            <Link
              href="/careers"
              className="mt-4 inline-block bg-[#8CE600] hover:bg-[#9eff00] text-black font-semibold py-3 px-8 rounded-md transition"
            >
              View All Openings
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[30px] place-items-center md:place-items-start max-w-[1500px] mx-auto">
            {jobs.map((job, index) => (
              <div
                key={`${job.title}-${index}`}
                data-aos="fade-up"
                className="py-6 px-6 flex flex-col gap-6 w-full max-w-[431px] h-full overflow-hidden"
              >
                <div className="flex flex-col gap-6 flex-grow">
                  <div className="w-[88px] h-[88px] relative">
                    <Image
                      src={job.image}
                      alt={job.title}
                      fill
                      className="object-contain rounded"
                      sizes="88px"
                    />
                  </div>
                  <span className="text-[24px] font-medium break-words">
                    {job.title}
                  </span>
                  <p className="text-[#E6E6E6] text-[18px] md:text-base break-words">
                    {job.description}
                  </p>
                </div>
                <Link
                  href="/wgContactForm"
                  className="text-center text-white rounded-md py-4 font-semibold bg-[#8CE600] hover:bg-[#9eff00] active:bg-[#9eff00] transition cursor-pointer"
                >
                  Apply Now
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <SquareUpHero />
    </>
  );
}
