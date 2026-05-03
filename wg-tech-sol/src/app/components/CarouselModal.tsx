"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { EffectCoverflow, Navigation, Pagination } from "swiper/modules";
import { IoMdClose } from "react-icons/io";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

// Import Swiper styles
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Import custom styles
import "./CarouselModal.css";

interface CarouselModalProps {
  isOpen: boolean;
  onClose: () => void;
  images?: string[];
  videos?: string[];
  title: string;
}

const CarouselModal: React.FC<CarouselModalProps> = ({
  isOpen,
  onClose,
  images = [],
  videos = [],
  title,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullScreenItem, setFullScreenItem] = useState<number | null>(null);
  const swiperRef = useRef<SwiperType | null>(null);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Combine images and videos for carousel
  const allItems = [
    ...images.map((img, index) => ({
      type: "image",
      src: img,
      alt: `${title} - Image ${index + 1}`,
      index,
    })),
    ...videos.map((vid, index) => ({
      type: "video",
      src: vid,
      alt: `${title} - Video ${index + 1}`,
      index: images.length + index,
    })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      if (fullScreenItem !== null) {
        setFullScreenItem(null);
      } else {
        onClose();
      }
    }
  };

  const handleItemClick = (index: number) => {
    setFullScreenItem(index);
  };

  const handleCloseFullScreen = () => {
    setFullScreenItem(null);
  };

  // Full Screen View Component
  const FullScreenView = () => {
    if (fullScreenItem === null) return null;

    const item = allItems[fullScreenItem];

    return (
      <div className="fixed inset-0 z-[10000] bg-black flex items-center justify-center">
        {/* Close Button */}
        <button
          onClick={handleCloseFullScreen}
          className="absolute top-4 right-4 z-[10001] bg-black/70 hover:bg-black/90 text-white rounded-full p-3 transition-all duration-300"
        >
          <IoMdClose className="w-6 h-6" />
        </button>

        {/* Title */}
        <div className="absolute top-4 left-4 z-[10001]">
          <h2 className="text-white text-sm sm:text-2xl md:text-2xl  font-bold bg-black/70 px-4 py-2 rounded-lg">
            {title} - Item {fullScreenItem + 1}
          </h2>
        </div>

        {/* Full Screen Content */}
        <div className="w-full h-full flex items-center justify-center p-8">
          {item.type === "image" ? (
            <Image
              src={item.src}
              alt={item.alt}
              width={1200}
              height={800}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {item.src.includes("youtube.com") ? (
                <iframe
                  src={
                    item.src.includes("watch?v=")
                      ? item.src.replace("watch?v=", "embed/")
                      : item.src.startsWith("https://www.youtube.com/embed/")
                      ? item.src
                      : `https://www.youtube.com/embed/${
                          item.src.split("v=")[1]?.split("&")[0]
                        }`
                  }
                  title={item.alt}
                  className="w-full h-full max-w-6xl max-h-[80vh] rounded-xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={item.src}
                  controls
                  className="max-w-full max-h-full rounded-xl"
                  autoPlay
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          )}
        </div>

        {/* Navigation for Full Screen */}
        {allItems.length > 1 && (
          <>
            <button
              className="absolute left-8 top-1/2 -translate-y-1/2 z-[10001] bg-black/70 hover:bg-black/90 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300"
              onClick={() => {
                const prevIndex =
                  fullScreenItem === 0
                    ? allItems.length - 1
                    : fullScreenItem - 1;
                setFullScreenItem(prevIndex);
              }}
            >
              <IoChevronBack className="w-6 h-6 text-[#9eff00]" />
            </button>

            <button
              className="absolute right-8 top-1/2 -translate-y-1/2 z-[10001] bg-black/70 hover:bg-black/90 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300"
              onClick={() => {
                const nextIndex =
                  fullScreenItem === allItems.length - 1
                    ? 0
                    : fullScreenItem + 1;
                setFullScreenItem(nextIndex);
              }}
            >
              <IoChevronForward className="w-6 h-6 text-[#9eff00]" />
            </button>
          </>
        )}

        {/* Counter for Full Screen */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[10001]">
          <div className="bg-black/70 text-white px-4 py-2 rounded-lg">
            {fullScreenItem + 1} / {allItems.length}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Full Screen View */}
      <FullScreenView />

      {/* Main Modal */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        onClick={onClose}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        style={{ display: fullScreenItem !== null ? "none" : "flex" }}
      >
        {/* Blurred Background */}
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm blur-xs"
          style={{
            backgroundImage: `url(/images/web-pics-2.png)`,
            backgroundSize: "contain",
            backgroundPosition: "center",
          }}
        />

        {/* Modal Content */}
        <div
          className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all duration-300"
          >
            <IoMdClose className="w-4 h-4" />
          </button>

          {/* Title */}
          <div className="absolute top-4 left-4 z-20">
            <h2 className="text-white text-sm sm:text-2xl md:text-2xl  font-bold bg-black/50 px-4 py-2 rounded-lg">
              {title}
            </h2>
          </div>

          {/* 3D Coverflow Carousel Container */}
          <div className="w-full max-w-7xl mx-auto relative h-[70vh] flex items-center justify-center px-4 overflow-hidden">
            <Swiper
              effect={"coverflow"}
              grabCursor={true}
              centeredSlides={true}
              slidesPerView={"auto"}
              spaceBetween={-50}
              coverflowEffect={{
                rotate: 30,
                stretch: 0,
                depth: 150,
                modifier: 1.5,
                slideShadows: false,
              }}
              pagination={{
                clickable: true,
                dynamicBullets: true,
              }}
              modules={[EffectCoverflow, Pagination]}
              className="mySwiper"
              onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              style={
                {
                  "--swiper-pagination-color": "#fff",
                } as React.CSSProperties
              }
            >
              {allItems.map((item, index) => (
                <SwiperSlide key={index}>
                  <div
                    className={`rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
                      activeIndex === index
                        ? "w-96 h-72 scale-105"
                        : "w-80 h-60 scale-100"
                    }`}
                    style={{ boxShadow: "none" }}
                    onClick={() => handleItemClick(index)}
                  >
                    {item.type === "image" ? (
                      <Image
                        src={item.src}
                        alt={item.alt}
                        width={activeIndex === index ? 400 : 320}
                        height={activeIndex === index ? 300 : 240}
                        className="w-auto h-auto object-contain transition-all duration-300"
                      />
                    ) : (
                      <div
                        className="relative"
                        style={{
                          width: activeIndex === index ? 384 : 320,
                          height: activeIndex === index ? 288 : 240,
                        }}
                      >
                        {item.src.includes("youtube.com") ? (
                          <iframe
                            src={
                              item.src.includes("watch?v=")
                                ? item.src.replace("watch?v=", "embed/")
                                : item.src.startsWith(
                                    "https://www.youtube.com/embed/"
                                  )
                                ? item.src
                                : `https://www.youtube.com/embed/${
                                    item.src.split("v=")[1]?.split("&")[0]
                                  }`
                            }
                            title={item.alt}
                            width={activeIndex === index ? 384 : 320}
                            height={activeIndex === index ? 288 : 240}
                            className="rounded-xl"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            src={item.src}
                            controls
                            preload="metadata"
                            width={activeIndex === index ? 384 : 320}
                            height={activeIndex === index ? 288 : 240}
                            className="rounded-xl object-contain bg-black"
                            style={{ display: "block" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Your browser does not support the video tag.
                          </video>
                        )}
                      </div>
                    )}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Custom Navigation Buttons */}
            <button
              className="swiper-button-prev absolute left-8 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all duration-300"
              onClick={() => {
                if (swiperRef.current) {
                  swiperRef.current.slidePrev();
                }
              }}
            >
              <IoChevronBack className="w-4 h-4 text-[#9eff00]" />
            </button>

            <button
              className="swiper-button-next absolute right-8 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all duration-300"
              onClick={() => {
                if (swiperRef.current) {
                  swiperRef.current.slideNext();
                }
              }}
            >
              <IoChevronForward className="w-4 h-4 text-[#9eff00] " />
            </button>

            {/* Custom Pagination */}
            <div className="swiper-pagination !bottom-[-60px] !relative !z-10"></div>
          </div>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
            <div className="bg-black/50 text-white px-4 py-2 rounded-lg">
              {activeIndex + 1} / {allItems.length}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CarouselModal;
