"use client";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { FaMapMarkerAlt } from "react-icons/fa";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { BlogItem } from "../blogs/types";
import { ProductItem } from "../products/types";
import { TransformedProject } from "../work/types";
import CarouselModal from "./CarouselModal";

type CardDataItem = (BlogItem | ProductItem | TransformedProject) & {
  eventDate?: string;
  location?: string;
  images?: string[];
  productImages?: string[];
  productLink?: string;
  postedOn?: string;
  slug?: string;
};

interface CardsProps {
  blogData: CardDataItem[];
  basePath?: string;
  onImageClick?: (images: string[], title: string) => void;
}

export default function Cards({
  blogData,
  basePath,
  onImageClick,
}: CardsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalTitle, setModalTitle] = useState("");
  console.log(blogData, "blogDatablogData");
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    slidesToScroll: 1,
    containScroll: "trimSnaps",
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollToHash = useCallback(
    (hash: string) => {
      if (!emblaApi || !blogData?.length || !hash) return;
      const targetIndex = blogData.findIndex(
        (item) => "anchorId" in item && item.anchorId === hash,
      );
      if (targetIndex >= 0) {
        emblaApi.scrollTo(targetIndex);
      }
    },
    [emblaApi, blogData],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "");
    scrollToHash(hash);

    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as string;
      scrollToHash(detail);
    };

    const onHashChange = () => {
      const nextHash = window.location.hash.replace("#", "");
      scrollToHash(nextHash);
    };

    window.addEventListener("wg-hash-scroll", handler as EventListener);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("wg-hash-scroll", handler as EventListener);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [scrollToHash]);

  const getImage = (item: CardDataItem): string => {
    if (Array.isArray(item.images) && item.images[0]) return item.images[0];
    if (Array.isArray(item.productImages) && item.productImages[0])
      return item.productImages[0];
    if ("image" in item && typeof item.image === "string" && item.image)
      return item.image;
    return "/images/Icon.png";
  };

  const getImages = (item: CardDataItem): string[] => {
    if (Array.isArray(item.images) && item.images.length > 0)
      return item.images;
    if (Array.isArray(item.productImages) && item.productImages.length > 0)
      return item.productImages;
    const singleImage = getImage(item);
    return singleImage ? [singleImage] : [];
  };

  const handleImageClick = (e: MouseEvent, item: CardDataItem) => {
    e.preventDefault();
    e.stopPropagation();
    const images = getImages(item);
    if (images.length > 0) {
      if (onImageClick) {
        onImageClick(images, item?.title || item?.subTitle || "Gallery");
      } else {
        setModalImages(images);
        setModalTitle(item?.title || item?.subTitle || "Gallery");
        setIsModalOpen(true);
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (!blogData?.length) {
    return (
      <div className="w-full min-h-[200px] flex items-center justify-center text-gray-400">
        No data found.
      </div>
    );
  }

  return (
    <div className="w-full min-h-[300px] py-8 sm:py-12">
      <div className="relative px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20">
        <button
          onClick={scrollPrev}
          className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 bg-[#8CE600] opacity-60 hover:bg-[#9eff00] rounded-full p-2 sm:p-3 shadow-lg transition-all duration-300 hover:scale-110"
          aria-label="Previous"
        >
          <ChevronLeftIcon className="h-4 w-4 sm:h-6 sm:w-6 text-black" />
        </button>

        <button
          onClick={scrollNext}
          className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 bg-[#8CE600] opacity-60 hover:bg-[#9eff00] rounded-full p-2 sm:p-3 shadow-lg transition-all duration-300 hover:scale-110"
          aria-label="Next"
        >
          <ChevronRightIcon className="h-4 w-4 sm:h-6 sm:w-6 text-black" />
        </button>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-2 sm:gap-4 md:gap-6">
            {blogData.map((item, index) => {
              const itemId = item?._id || index.toString();
              const title = item?.title || "";
              const subTitle = item?.subTitle || "";
              const shortDescription = item?.shortDescription || "";
              const imageSrc = getImage(item);
              const hasImages = getImages(item).length > 0;
              const formattedDate = formatDate(
                item?.eventDate || item?.postedOn,
              );
              const location = item?.location;
              const productLink = item?.productLink || item?.slug;

              const CardContent = (
                <div
                  data-aos="fade-up"
                  data-aos-anchor-placement="top-bottom"
                  className="wg-card flex-shrink-0 w-[250px] sm:w-[280px] md:w-[300px] lg:w-[320px] xl:w-[340px] border border-[#232323] rounded-lg flex flex-col p-3 sm:p-4 md:p-5 hover:bg-[#111] transition"
                >
                  <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 sm:mb-3 gap-1 sm:gap-2">
                    <h2 className="text-[#bfbfbf] text-xs sm:text-sm md:text-base lg:text-lg font-semibold line-clamp-1 flex-1">
                      {subTitle || title}
                    </h2>
                    {formattedDate && (
                      <span className="text-gray-400 text-[10px] sm:text-xs md:text-sm whitespace-nowrap">
                        {formattedDate}
                      </span>
                    )}
                  </div>

                  <div className="w-full rounded-lg overflow-hidden mb-3 sm:mb-4">
                    <Image
                      src={imageSrc}
                      alt={title || "Image"}
                      width={400}
                      height={220}
                      className={`w-full h-[140px] sm:h-[160px] md:h-[180px] lg:h-[200px] object-contain ${
                        hasImages
                          ? "cursor-pointer hover:opacity-90 transition-opacity"
                          : ""
                      }`}
                      priority
                      onClick={
                        hasImages ? (e) => handleImageClick(e, item) : undefined
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between mb-2 sm:mb-3 gap-1 sm:gap-2">
                    <h3 className="text-white text-sm sm:text-base md:text-lg lg:text-xl font-bold line-clamp-1 flex-1">
                      {title}
                    </h3>
                    {basePath && (
                      <div className="group rounded-lg p-2 bg-[#232323] hover:bg-[#9eff00] transition">
                        <Image
                          src="/images/Icon.png"
                          alt="Open Details"
                          width={20}
                          height={20}
                          className="transition group-hover:brightness-0"
                        />
                      </div>
                    )}
                  </div>

                  {location && (
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(location)}`}
                      onClick={(e) => e.stopPropagation()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#232323] flex items-center gap-1 sm:gap-2 text-gray-400 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium hover:bg-[#333] hover:text-white transition-colors cursor-pointer mb-2 sm:mb-3 w-fit"
                      title="Click to open in Google Maps"
                    >
                      <FaMapMarkerAlt className="text-gray-400 text-[10px] sm:text-xs shrink-0" />
                      <span className="text-gray-400 line-clamp-1 text-[10px] sm:text-xs">
                        {location}
                      </span>
                    </a>
                  )}

                  {productLink && (
                    <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                      <a
                        target="_blank"
                        href={productLink}
                        onClick={(e) => e.stopPropagation()}
                        rel="noopener noreferrer"
                        className="bg-[#232323] text-gray-400 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium select-all break-all flex-1 line-clamp-1 w-fit hover:bg-[#333] hover:text-white transition-colors"
                      >
                        {productLink}
                      </a>
                    </div>
                  )}

                  {shortDescription && (
                    <p className="text-gray-300 text-[10px] sm:text-xs md:text-sm font-normal leading-relaxed line-clamp-2">
                      {shortDescription.split(" ").slice(0, 15).join(" ")}
                      {shortDescription.split(" ").length > 15 ? "..." : ""}
                    </p>
                  )}
                </div>
              );

              return basePath ? (
                <div
                  key={itemId}
                  id={"anchorId" in item ? item.anchorId : undefined}
                  className="flex-shrink-0"
                >
                  <Link href={`${basePath}/${itemId}`}>{CardContent}</Link>
                </div>
              ) : (
                <div
                  key={itemId}
                  id={"anchorId" in item ? item.anchorId : undefined}
                  className="flex-shrink-0"
                >
                  {CardContent}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {!onImageClick && (
        <CarouselModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          images={modalImages}
          title={modalTitle}
        />
      )}
    </div>
  );
}
