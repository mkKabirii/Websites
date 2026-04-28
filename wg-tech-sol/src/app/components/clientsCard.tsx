"use client";
import Image from "next/image";
import React, { useState } from "react";
import Banner from "./banner";
import { banner } from "./bannerData";
import { client } from "@/data/clientsData";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/16/solid";
import { StarIcon } from "@heroicons/react/24/solid";
import { ReviewItem } from "@/app/home/types";

interface ClientsCardProps {
  reviews?: ReviewItem[];
}

// Star Rating Component - displays rating from 1 to 5 as stars
const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  // Clamp rating between 1 and 5
  const clampedRating = Math.max(1, Math.min(5, Math.round(rating)));
  const fullStars = clampedRating;
  const emptyStars = 5 - fullStars;

  return (
    <div className="flex items-center gap-1">
      {[...Array(fullStars)].map((_, i) => (
        <StarIcon key={i} className="w-3 h-3 text-yellow-400 fill-current" />
      ))}
      {[...Array(emptyStars)].map((_, i) => (
        <StarIcon
          key={`empty-${i}`}
          className="w-3 h-3 text-gray-400 fill-current"
        />
      ))}
    </div>
  );
};

const ClientsCard: React.FC<ClientsCardProps> = ({ reviews }) => {
  const [showAll, setShowAll] = useState(false);
  console.log("ClientsCard - Reviews received:", reviews);
  const testimonialsData =
    reviews && reviews.length > 0
      ? reviews
          .filter((review) => review.status === "active")
          .map((review) => {
            const reviewText = review.review || "";
            return {
              title:
                reviewText.length > 60
                  ? reviewText.substring(0, 60) + "..."
                  : reviewText, // Review ka first part title ke liye
              description: reviewText,
              author: review.userInfo?.name || "Anonymous",
              company: review.userInfo?.email
                ? review.userInfo.email.split("@")[0]
                : "", // Email se company name extract
              image: review.userInfo?.image || "",
              rating: review.rating || null,
            };
          })
      : client.map((item) => ({
          ...item,
          rating: null,
        }));

  console.log("ClientsCard - Processed testimonials:", testimonialsData);

  const displayedTestimonials = showAll
    ? testimonialsData
    : testimonialsData.slice(0, 4);

  return (
    <>
      <Banner
        bgImage={banner[5].bgImage}
        heading={banner[5].heading}
        subheading={banner[5].subheading}
      />
      <div className="grid grid-cols-1 my-10 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        {displayedTestimonials.map((testimonial, index) => (
          <div
            key={index}
            data-aos="zoom-in-up"
            className="wg-card rounded-lg p-6 sm:p-8 md:p-10 lg:p-12 xl:p-16 shadow-lg hover:shadow-xl transition-all border border-[#262626] flex flex-col h-full"
          >
            <h3 className="text-[#c0e289] text-lg sm:text-xl lg:text-2xl font-bold mb-3">
              {testimonial.title}
            </h3>
            <p className="mb-4 sm:mb-6 text-sm sm:text-base lg:text-lg text-gray-300 leading-relaxed flex-grow">
              {testimonial.description}
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-auto">
              <div className="flex items-center gap-3 sm:gap-4">
                {testimonial.image ? (
                  <Image
                    src={testimonial.image}
                    alt={`${testimonial.author} avatar`}
                    width={50}
                    height={50}
                    className="rounded-full object-cover w-10 h-10 sm:w-12 sm:h-12 lg:w-[50px] lg:h-[50px]"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-[50px] lg:h-[50px] bg-gray-400 rounded-full"></div>
                )}
                <div>
                  <p className="font-medium text-sm sm:text-base lg:text-lg mb-1">
                    {testimonial.author}
                  </p>
                  {testimonial.rating &&
                    typeof testimonial.rating === "number" && (
                      <StarRating rating={testimonial.rating} />
                    )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {testimonialsData.length > 4 && (
        <div className="flex justify-center relative mt-8 sm:mt-10 lg:mt-12 mb-8">
          <button
            onClick={() => setShowAll(!showAll)}
            className="bg-[#9eff00] rounded-full text-black px-4 sm:px-6 py-2 sm:py-3 flex items-center gap-2 transition-all duration-300 hover:bg-[#8CE600] active:bg-[#8CE600] group text-sm sm:text-base"
          >
            {showAll ? "View Less" : "View More"}
            <span className="group-hover:animate-bounceArrow inline-block">
              {showAll ? (
                <ChevronUpIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <ChevronDownIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </span>
          </button>
        </div>
      )}
    </>
  );
};

export default ClientsCard;
