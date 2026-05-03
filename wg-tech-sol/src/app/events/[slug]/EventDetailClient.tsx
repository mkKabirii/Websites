"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getEventById } from "../../../api/module/events";
import { EventItem } from "../types";
import Image from "next/image";
import CarouselModal from "@/app/components/CarouselModal";
import MagnifyText from "@/app/components/MagnifyText";

export default function EventDetailClient() {
  const params = useParams();
  const id = params?.slug as string;
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"images" | "videos">("images");

  useEffect(() => {
    if (id) {
      handleGetEvent();
    }
  }, [id]);

  const handleGetEvent = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getEventById(id);

      if (response.status === 200 || response.status === 201) {
        const eventData = response?.data?.data?.event || response?.data?.data;
        if (eventData) {
          setEvent(eventData);
        } else {
          setError("Event not found");
        }
      } else {
        setError("Failed to fetch event");
      }
    } catch (error) {
      console.error("Event Fetch Error:", error);
      setError("Error loading event. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const decodeHTML = (html: string) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-20 py-10 px-4">
        <div className="flex items-center justify-center min-h-[400px] text-gray-400">
          Loading event...
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto mt-20 py-10 px-4">
        <div className="flex items-center justify-center min-h-[400px] text-red-400">
          {error || "Event not found"}
        </div>
      </div>
    );
  }

  const eventImages =
    event.image && Array.isArray(event.image)
      ? event.image.map((img) => img.url)
      : [];
  const eventVideos =
    event.video && Array.isArray(event.video)
      ? event.video.map((vid) => vid.url)
      : [];
  const firstImage = eventImages.length > 0 ? eventImages[0] : "";
  // Show the media panel whenever there are images OR videos
  const hasMedia = eventImages.length > 0 || eventVideos.length > 0;

  return (
    <div className="max-w-6xl mx-auto mt-20 py-10 px-4 space-y-8">
      <article id="event-detail">
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
          <div className="flex flex-col items-start justify-between mb-4 sm:mb-6 gap-2">
            <h1 className="text-4xl font-bold mb-4">
              <MagnifyText text={String(event.title ?? "")} />
            </h1>
            {event.subTitle && (
              <h2 className="text-xl font-semibold text-gray-400 mb-4">
                {event.subTitle}
              </h2>
            )}
          </div>
          <p className="text-gray-300 text-xs sm:text-xs md:text-sm font-normal leading-relaxed">
            {" "}
            {formatDate(event.eventDate)}
          </p>
        </div>

        {/* Media panel — visible whenever images OR videos are present */}
        {hasMedia && (
          <div
            className="w-full sm:h-[350px] md:h-[500px] lg:h-[550px] rounded gap-4 mb-6 bg-cover bg-center flex flex-col sm:flex-row sm:flex-wrap justify-center sm:justify-between p-2 sm:p-6 md:p-10 items-center"
            style={
              firstImage
                ? { backgroundImage: `url(${firstImage})` }
                : { backgroundColor: "#0d0d0d" }
            }
          >
            {/* Images card */}
            {eventImages.length > 0 && (
              <div
                className="bg-black/80 p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer relative w-full sm:w-64 rounded-lg"
                onClick={() => {
                  setModalType("images");
                  setIsModalOpen(true);
                }}
              >
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                    <Image
                      src={eventImages[0]}
                      alt="Images thumbnail"
                      width={80}
                      height={80}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                    Images
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {eventImages.length} files
                  </p>
                </div>
              </div>
            )}

            {/* Videos card — renders regardless of whether images exist */}
            {eventVideos.length > 0 && (
              <div
                className="bg-black/80 p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer relative w-full sm:w-64 rounded-lg"
                onClick={() => {
                  setModalType("videos");
                  setIsModalOpen(true);
                }}
              >
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center relative">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17,10.5V7c0-0.55-0.45-1-1-1H4c-0.55,0-1,0.45-1,1v10c0,0.55,0.45,1,1,1h12c0.55,0,1-0.45,1-1v-3.5l4,4v-11L17,10.5z" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white ml-0.5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                    Videos
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {eventVideos.length} files
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {event.longDescription && (
          <div
            className="mb-4 prose prose-invert max-w-none text-gray-300 [&_p]:mb-4 [&_p]:leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4 [&_li]:mb-2 [&_a]:text-blue-400 [&_a]:underline [&_strong]:font-bold [&_em]:italic"
            dangerouslySetInnerHTML={{
              __html: decodeHTML(event.longDescription),
            }}
          />
        )}
        {!event.longDescription && event.shortDescription && (
          <p className="mb-4 whitespace-pre-line text-gray-300">
            {event.shortDescription}
          </p>
        )}
      </article>

      <CarouselModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        images={modalType === "images" ? eventImages : []}
        videos={modalType === "videos" ? eventVideos : []}
        title={`${event.title} - ${
          modalType === "images" ? "Images" : "Videos"
        }`}
      />
    </div>
  );
}
