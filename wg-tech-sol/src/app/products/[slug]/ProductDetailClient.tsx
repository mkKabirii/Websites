"use client";
import { useCallback, useEffect, useState } from "react";
import { getProductById } from "../../../api/module/product";
import { ProductItem } from "../types";
import Image from "next/image";
import MagnifyText from "@/app/components/MagnifyText";

type ProductDetailClientProps = {
  slug: string;
};

export default function ProductDetailClient({
  slug,
}: ProductDetailClientProps) {
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleGetProduct = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProductById(slug);

      if (response.status === 200 || response.status === 201) {
        const productData =
          response?.data?.data?.product || response?.data?.data;
        if (productData) {
          const normalizedProduct: ProductItem = {
            ...productData,
            productImages: Array.isArray(productData.productImages)
              ? productData.productImages
              : [],
          };
          setProduct(normalizedProduct);
        } else {
          setError("Product not found");
        }
      } else {
        setError("Failed to fetch product");
      }
    } catch (error: unknown) {
      console.error("Product Fetch Error:", error);
      setError("Error loading product. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      void handleGetProduct();
    }
  }, [slug, handleGetProduct]);

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
          Loading product...
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto mt-20 py-10 px-4">
        <div className="flex items-center justify-center min-h-[400px] text-red-400">
          {error || "Product not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-20 py-10 px-4 space-y-8">
      <article id="product-detail">
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
          <div className="flex flex-col items-start justify-between mb-4 sm:mb-6 gap-2">
            <h1 className="text-2xl font-bold mb-4">
              <MagnifyText text={String(product.title ?? "")} />
            </h1>
            {product.subTitle && (
              <h2 className="text-2xl font-semibold text-gray-400 mb-4">
                {product.subTitle}
              </h2>
            )}
          </div>
          <p className="text-gray-300 text-sm sm:text-base md:text-lg font-normal leading-relaxed">
            {" "}
            {formatDate(product.postedOn)}
          </p>
        </div>
        {product.productImages?.[0] && (
          <Image
            alt={product.title}
            width={1000}
            height={300}
            className="w-full sm:h-[350px] md:h-[500px] lg:h-[550px] object-cover rounded mb-4"
            src={product.productImages[0]}
          />
        )}
        {product.longDescription && (
          <div
            className="mb-4 prose prose-invert max-w-none text-gray-300 [&_p]:mb-4 [&_p]:leading-relaxed [&_span]:text-gray-300 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4 [&_li]:mb-2 [&_a]:text-blue-400 [&_a]:underline [&_strong]:font-bold [&_em]:italic"
            dangerouslySetInnerHTML={{
              __html: decodeHTML(product.longDescription),
            }}
          />
        )}
        {!product.longDescription && product.shortDescription && (
          <p className="mb-4 whitespace-pre-line text-gray-300">
            {product.shortDescription}
          </p>
        )}
      </article>
    </div>
  );
}
