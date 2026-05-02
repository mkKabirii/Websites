"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getBlogById } from "../../../api/module/blog";
import { BlogItem } from "../types";
import Image from "next/image";
import MagnifyText from "@/app/components/MagnifyText";

export default function BlogDetailClient() {
  const params = useParams();
  const id = params?.id as string;
  const [blog, setBlog] = useState<BlogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const decodeHTML = (html: string) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  useEffect(() => {
    if (id) {
      handleGetBlog();
    }
  }, [id]);

  const handleGetBlog = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getBlogById(id);

      if (response.status === 200 || response.status === 201) {
        const blogData = response?.data?.data?.blog || response?.data?.data;
        if (blogData) {
          setBlog(blogData);
        } else {
          setError("Blog not found");
        }
      } else {
        setError("Failed to fetch blog");
      }
    } catch (error) {
      console.error("Blog Fetch Error:", error);
      setError("Error loading blog. Please try again later.");
    } finally {
      setLoading(false);
    }
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
          Loading blog...
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="max-w-4xl mx-auto mt-20 py-10 px-4">
        <div className="flex items-center justify-center min-h-[400px] text-red-400">
          {error || "Blog not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-20 py-10 px-4 space-y-8">
      <article id="blog-detail">
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
          <div className="flex flex-col items-start justify-between mb-4 sm:mb-6 gap-2">
            <h1 className="text-4xl font-bold mb-4">
              <MagnifyText text={String(blog.title ?? "")} />
            </h1>
            {blog.subTitle && (
              <h2 className="text-xl font-semibold text-gray-400 mb-4">
                {blog.subTitle}
              </h2>
            )}
          </div>
          <p className="text-gray-300 text-xs sm:text-xs md:text-sm font-normal leading-relaxed">
            {" "}
            {formatDate(blog.postedOn)}
          </p>
        </div>
        {blog.image && (
          <Image
            alt={blog.title}
            width={1000}
            height={300}
            className="w-full sm:h-[350px] md:h-[500px] lg:h-[550px] object-cover rounded mb-4"
            src={blog.image}
          />
        )}
        {blog.longDescription && (
          <div
            className="mb-4 prose prose-invert max-w-none text-gray-300 [&_p]:mb-4 [&_p]:leading-relaxed [&_span]:text-gray-300 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4 [&_li]:mb-2 [&_a]:text-blue-400 [&_a]:underline [&_strong]:font-bold [&_em]:italic"
            dangerouslySetInnerHTML={{
              __html: decodeHTML(blog.longDescription),
            }}
          />
        )}
        {!blog.longDescription && blog.shortDescription && (
          <p className="mb-4 whitespace-pre-line text-gray-300">
            {blog.shortDescription}
          </p>
        )}
      </article>
    </div>
  );
}
