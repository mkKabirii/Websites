import Image from "next/image";
import Link from "next/link";

import type { OurServiceType } from "./types";

type ServiceCardProps = {
  image: string;
  title: string;
  description: string;
  serviceId: string;
  subServiceId: string;
  anchorId?: string;
};

function ServiceCard({
  image,
  title,
  description,
  serviceId,
  subServiceId,
  anchorId,
}: ServiceCardProps) {
  const contactUrl = `/contact?serviceId=${serviceId}&subServiceId=${subServiceId}`;

  return (
    <Link href={contactUrl}>
      <div
        data-aos="fade-up"
        data-aos-anchor-placement="top-bottom"
        id={anchorId}
        className="wg-card group relative block mx-auto w-full sm:w-auto scroll-mt-28
    min-h-[160px] p-6 flex flex-col items-start
    overflow-hidden rounded-2xl
    border border-gray-500 bg-transparent
    text-xl font-bold sm:text-2xl cursor-pointer
    transition-colors duration-300
    hover:border-[#B7FF4A]
    focus:border-[#B7FF4A]
    active:border-[#B7FF4A]
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B7FF4A]
    focus-visible:ring-offset-2 focus-visible:ring-offset-black

    before:absolute before:inset-y-0 before:left-0 before:w-0
    before:bg-[#B7FF4A] before:content-['']
    before:transition-all before:duration-300 before:ease-out
    hover:before:w-full
    focus:before:w-full
    active:before:w-full"
      >
        {/* ICON */}
        <div className="relative w-14 h-14 mb-4 z-[99999]">
          <Image
            src={image}
            alt={title}
            width={56}
            height={56}
            className="transition-all duration-300
        group-hover:brightness-0"
          />
        </div>

        {/* TEXT */}

        <span
          className="relative z-[99999] block
  max-w-full
  text-base font-medium text-white
  transition-colors duration-300
  group-hover:text-black
  whitespace-nowrap overflow-hidden text-ellipsis"
        >
          {title}
        </span>

        <span
          className="relative z-[99999]
  text-xs font-medium text-white
  transition-colors duration-300
  group-hover:text-black"
        >
          {description}
        </span>
      </div>
    </Link>
  );
}

interface OurServiceProps {
  serviceData: OurServiceType[];
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function ServicesGrid({ serviceData }: OurServiceProps) {
  console.log(serviceData, "serviceDataserviceDataAAAAAAAAAAAAA");
  return (
    <section className="w-full py-8 px-2 md:px-8">
      <div className="max-w-[1500px] mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {serviceData.map((service) =>
            service?.subServices?.map((sub) =>
              (() => {
                const serviceSlug = slugify(service.title || "");
                const subSlug = slugify(sub.title || "");
                const anchorId =
                  serviceSlug && subSlug
                    ? `${serviceSlug}-${subSlug}`
                    : subSlug || serviceSlug;

                return (
                  <ServiceCard
                    key={sub._id}
                    image={sub.image ?? "/images/Icon.png"}
                    title={sub.title}
                    description={sub.description ?? ""}
                    serviceId={service._id}
                    subServiceId={sub._id}
                    anchorId={anchorId}
                  />
                );
              })(),
            ),
          )}
        </div>
      </div>
    </section>
  );
}
