"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getArticleById } from "../../../api/module/articles";
import { ArticleItem } from "../types";
import Image from "next/image";
import MagnifyText from "@/app/components/MagnifyText";

export default function ArticleDetailClient() {
  const params = useParams();
  const id = params?.slug as string;
  const [article, setArticle] = useState<ArticleItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      handleGetArticle();
    }
  }, [id]);

  const handleGetArticle = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getArticleById(id);

      if (response.status === 200 || response.status === 201) {
        const articleData =
          response?.data?.data?.article || response?.data?.data;
        if (articleData) {
          setArticle(articleData);
        } else {
          setError("Article not found");
        }
      } else {
        setError("Failed to fetch article");
      }
    } catch (error) {
      console.error("Article Fetch Error:", error);
      setError("Error loading article. Please try again later.");
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
          Loading article...
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto mt-20 py-10 px-4">
        <div className="flex items-center justify-center min-h-[400px] text-red-400">
          {error || "Article not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-20 py-10 px-4 space-y-8">
      <article id="article-detail">
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
          <div className="flex flex-col items-start justify-between mb-4 sm:mb-6 gap-2">
            <h1 className="text-4xl font-bold mb-4">
              <MagnifyText text={String(article.title ?? "")} />
            </h1>
            {article.subTitle && (
              <h2 className="text-xl font-semibold text-gray-400 mb-4">
                {article.subTitle}
              </h2>
            )}
          </div>
          <p className="text-gray-300 text-sm sm:text-base md:text-lg font-normal leading-relaxed">
            {" "}
            {formatDate(article.postedOn)}
          </p>
        </div>
        {article.image && (
          <Image
            alt={article.title}
            width={1000}
            height={300}
            className="w-full sm:h-[350px] md:h-[500px] lg:h-[550px] object-contain rounded mb-4"
            src={article.image}
          />
        )}
        {article.longDescription && (
          <div
            className="mb-4 prose prose-invert max-w-none text-gray-300 [&_p]:mb-4 [&_p]:leading-relaxed [&_span]:text-gray-300 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4 [&_li]:mb-2 [&_a]:text-blue-400 [&_a]:underline [&_strong]:font-bold [&_em]:italic"
            dangerouslySetInnerHTML={{
              __html: decodeHTML(article.longDescription),
            }}
          />
        )}
        {!article.longDescription && article.shortDescription && (
          <p className="mb-4 whitespace-pre-line text-gray-300">
            {article.shortDescription}
          </p>
        )}
      </article>
    </div>
  );
}
