"use client";
import React, { useState, useEffect } from "react";
import { getSettings } from "@/api/module/settings";
import { toast } from "react-toastify";
import MagnifyText from "@/app/components/MagnifyText";

const PrivacyPolicyPage: React.FC = () => {
  const [privacyContent, setPrivacyContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Function to decode HTML entities
  const decodeHtmlEntities = (html: string): string => {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = html;
    return textarea.value;
  };

  useEffect(() => {
    fetchPrivacyPolicy();
  }, []);

  const fetchPrivacyPolicy = async () => {
    try {
      setLoading(true);
      const response = await getSettings();
      if (response.status === 200 || response.status === 201) {
        const rawContent = response.data.data.privacyPolicy || "";
        // Decode HTML entities before setting
        const decodedContent = decodeHtmlEntities(rawContent);
        setPrivacyContent(decodedContent);
      } else {
        toast.error("Failed to load privacy policy");
        setPrivacyContent("Privacy policy not available.");
      }
    } catch (error) {
      console.error("Error fetching privacy policy:", error);
      toast.error("Error loading privacy policy");
      setPrivacyContent("Error loading privacy policy.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto mt-30">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            <MagnifyText text="Privacy Policy" />
          </h1>
          <div className="h-1 w-24 bg-[#9EFF00]"></div>
        </div>

        {/* Content */}
        <div className="bg-[#00000] rounded-xl shadow-2xl border border-[#323845] p-6 sm:p-8 md:p-10">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#9EFF00]"></div>
              <p className="ml-4 text-[#9aa3ad]">Loading privacy policy...</p>
            </div>
          ) : (
            <div
              className="text-[#cfd6df] prose prose-invert max-w-none 
                                prose-headings:text-white prose-p:text-[#cfd6df] 
                                prose-strong:text-white prose-ul:text-[#cfd6df] 
                                prose-ol:text-[#cfd6df] prose-li:text-[#cfd6df] 
                                prose-a:text-[#9EFF00] prose-a:hover:text-[#9EFF00]/80
                                prose-h1:text-white prose-h2:text-white prose-h3:text-white
                                prose-h4:text-white prose-h5:text-white prose-h6:text-white"
              dangerouslySetInnerHTML={{
                __html: privacyContent || "No privacy policy available.",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
