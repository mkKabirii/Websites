import Image from "next/image";
import Link from "next/link";
import React from "react";
import { ServiceItem } from "@/app/home/types";

interface ServiceCardProps {
  services?: ServiceItem[];
}

// Fallback data agar API se data na aaye
const defaultServices = [
  {
    image: "/images/app-development.png",
    alt: "App Development",
    title: "App Development",
    description: `At WGTECSOL (Pvt.) Ltd., our design team is passionate about creating
      stunning, user-centric designs that captivate your audience and
      elevate your brand. We believe that great design is not just
      about aesthetics; it's about creating seamless and intuitive
      user experiences.`,
    link: "/services",
  },
  {
    image: "/images/uiux.png",
    alt: "UIUX",
    title: "UIUX",
    description: `Our engineering team combines technical expertise with a passion
      for innovation to build robust and scalable digital solutions.
      We leverage the latest technologies and best practices to
      deliver high-performance applications tailored to your specific
      needs.`,
    link: "/services",
  },
  {
    image: "/images/web-development.png",
    alt: "Web Development",
    title: "Web Development",
    description: `Our experienced project management team ensures that your
      projects are delivered on time, within budget, and according to
      your specifications. We follow industry-standard methodologies
      and employ effective communication and collaboration tools to
      keep you informed throughout the development process.`,
    link: "/services",
  },
];

function ServiceCard({ services }: ServiceCardProps) {
  // API se aaye data ko use karna ya fallback data
  const servicesData =
    services && services.length > 0 ? services : defaultServices;
  console.log(servicesData, "servicesDataservicesData");
  return (
    <div className="my-6 sm:my-8 md:my-10 lg:my-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
      {servicesData.map((service, idx) => (
        <div
          key={idx}
          data-aos="zoom-in"
          className="wg-card no-glow group flex flex-col justify-between p-6 bg-[#1f1f1f] rounded-xl h-full"
        >
          <div className="space-y-6">
            <div className="relative w-[88px] h-[88px] rounded-lg overflow-hidden">
              <Image
                src={service.image || "/images/app-development.png"}
                alt={service.alt || service.title}
                width={88}
                height={88}
                className="relative z-0"
              />
            </div>
            <div>
              <h3 className="text-white text-2xl font-semibold mb-2">
                {service.title}
              </h3>
              <p className="text-gray-400 text-base">{service.description}</p>
            </div>
          </div>

          <Link
            href={service.link || "/services"}
            className="mt-6 text-center text-white font-semibold py-3 rounded-lg w-full bg-[#8CE600] hover:bg-[#9eff00] active:bg-[#9eff00] transition"
          >
            Learn More
          </Link>
        </div>
      ))}
    </div>
  );
}

export default ServiceCard;
