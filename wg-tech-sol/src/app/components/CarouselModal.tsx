"use client";

import React, { useEffect } from "react";
import { IoMdClose } from "react-icons/io";

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
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Combine images and videos
  const allItems = [
    ...images.map((img, index) => ({
      type: "image",
      src: img,
      alt: `${title} - Image ${index + 1}`,
    })),
    ...videos.map((vid, index) => ({
      type: "video",
      src: vid,
      alt: `${title} - Video ${index + 1}`,
    })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/95 flex flex-col items-center p-4 overflow-y-auto"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[10001] bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-all duration-300"
      >
        <IoMdClose className="w-6 h-6" />
      </button>

      {/* Title */}
      <div className="w-full max-w-5xl mt-8 mb-6">
        <h2 className="text-white text-xl md:text-2xl font-bold text-center">
          {title}
        </h2>
      </div>

      {/* Content */}
      <div 
        className="w-full max-w-5xl flex flex-col items-center gap-8 pb-12 outline-none" 
        onClick={(e) => e.stopPropagation()}
      >
        {allItems.map((item, index) => (
          <div key={index} className="w-full flex justify-center bg-[#111] p-2 rounded-xl border border-[#333]">
            {item.type === "image" ? (
              <img
                src={item.src}
                alt={item.alt}
                className="max-w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
            ) : (
              <div className="w-full flex justify-center">
                {item.src.includes("youtube.com") ? (
                  <iframe
                    src={
                      item.src.includes("watch?v=")
                        ? item.src.replace("watch?v=", "embed/")
                        : item.src.startsWith("https://www.youtube.com/embed/")
                        ? item.src
                        : `https://www.youtube.com/embed/${item.src.split("v=")[1]?.split("&")[0]}`
                    }
                    title={item.alt}
                    className="w-full max-w-4xl aspect-video rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={item.src}
                    controls
                    playsInline
                    className="max-w-full h-auto max-h-[85vh] rounded-lg shadow-2xl"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            )}
          </div>
        ))}
        {allItems.length === 0 && (
          <div className="text-gray-400 mt-10">No media available.</div>
        )}
      </div>
    </div>
  );
};

export default CarouselModal;
