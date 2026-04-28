"use client";
import { useState } from "react";
import Cards from "../components/cards";
import CarouselModal from "../components/CarouselModal";
import { WorkCategory, WorkCardProps, TransformedProject } from "./types";

export default function WorkCard({ workData, loading }: WorkCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  console.log(workData, "workDataworkData");
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalTitle, setModalTitle] = useState("");

  // Function to handle modal open from Cards component
  const handleOpenModal = (images: string[], title: string) => {
    setModalImages(images);
    setModalTitle(title);
    setIsModalOpen(true);
  };
  // Loading state handle karo
  if (loading) {
    return (
      <div className="w-full min-h-[300px] flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  // Ensure karo ke workData array hai
  if (!workData || !Array.isArray(workData) || workData.length === 0) {
    return (
      <div className="w-full min-h-[300px] flex items-center justify-center text-gray-400">
        No work data found.
      </div>
    );
  }

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  return (
    <div className="w-full">
      {
        workData
          .map((category, categoryIndex) => {
            if (
              !category ||
              !category.works ||
              !Array.isArray(category.works) ||
              category.works.length === 0
            ) {
              return null;
            }

            const transformedProjects: TransformedProject[] =
              category.works.map((item) => {
                // Handle images array - ensure it's always an array
                let imagesArray: string[] = [];
                if (
                  item.image &&
                  Array.isArray(item.image) &&
                  item.image.length > 0
                ) {
                  imagesArray = item.image;
                } else if (typeof item.image === "string" && item.image) {
                  imagesArray = [item.image];
                } else {
                  imagesArray = ["/images/w1.png"];
                }

                const categorySlug = slugify(category.workCategory || "");
                const titleSlug = slugify(item.title || "");
                const anchorId =
                  categorySlug && titleSlug
                    ? `${categorySlug}-${titleSlug}`
                    : titleSlug || categorySlug || `work-${categoryIndex}`;

                return {
                  _id: item._id || `work-${categoryIndex}-${Math.random()}`,
                  slug: item.url || "#",
                  anchorId,
                  title: item.title || "Untitled",
                  subTitle: item.purpose || "Untitled",
                  image: imagesArray[0],
                  images: imagesArray,
                  description: item.description || "",
                  shortDescription: item.description || "",
                  longDescription: item.description || "",
                };
              });

            console.log(transformedProjects, "transformedProjects");

            if (!transformedProjects || transformedProjects.length === 0) {
              return null;
            }

            return (
              <section
                key={category._id || categoryIndex}
                id={slugify(category.workCategory || "")}
                className="py-8 md:py-12"
                data-aos="fade-up"
              >
                <div className="max-w-[1500px] mx-auto px-4 md:px-6 mb-6">
                  <div className="border-l-4 border-[#8CE600] pl-4 md:pl-6">
                    <h2 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-3">
                      {category.workCategory || "Work Category"}
                    </h2>

                    <p className="text-gray-400 text-sm md:text-base lg:text-lg font-normal">
                      {category.categoryDescription || ""}
                    </p>
                  </div>
                </div>

                <Cards
                  blogData={transformedProjects}
                  onImageClick={handleOpenModal}
                />

                {categoryIndex < workData.length - 1 && (
                  <div className="max-w-[1500px] mx-auto px-4 md:px-6 mt-8">
                    <div className="h-px bg-gradient-to-r from-transparent via-[#333333] to-transparent"></div>
                  </div>
                )}
              </section>
            );
          })
          .filter(Boolean) // Null values ko remove karo
      }

      {/* Single Modal for all work items */}
      <CarouselModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        images={modalImages}
        title={modalTitle}
      />
    </div>
  );
}
