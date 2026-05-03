"use client";

import { useEffect, useState } from "react";
import { OurServicesSection } from "./components/service";
import Components from "./components/companies";
import FAQ from "./components/faq";
import ThankYouSection from "./components/thankYouSection";
import TestimonialsCard from "./components/clientsCard";
import Hero from "./components/hero";
import HomeHighlightSections from "./components/homeHighlightSections";
import { getHomeData } from "@/api/module/home";
import { HomeData } from "./home/types";

export default function Home() {
  const [homeData, setHomeData] = useState<HomeData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    handleGetHomeData();
  }, []);

  const handleGetHomeData = async () => {
    try {
      const response = await getHomeData();
      if (response.status === 200 || response.status === 201) {
        const data = response?.data?.data || response?.data || {};
        
        // Filter out inactive services
        if (data.services && Array.isArray(data.services)) {
          data.services = data.services.filter((s: any) => !s.status || s.status.toLowerCase() === "active");
        }
        
        setHomeData(data);
      }
    } catch (error) {
      console.error("Error fetching Home data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Hero />
      <OurServicesSection services={homeData.services} />
      <Components advertisements={homeData.advertisements || []} />
      <HomeHighlightSections stats={homeData.homeStats} />
      <TestimonialsCard reviews={homeData.reviews} />
      <FAQ faqs={homeData.faqs} />
      <ThankYouSection />
    </>
  );
}
