"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Review } from "@/types";
import { productService } from "@/services/productService";
import { RatingStars } from "@/components/common/RatingStars";
import { ThumbsUp, CheckCircle } from "lucide-react";
import { formatDate } from "@/utils/formatters";

interface ProductReviewsProps {
  productId: string;
  rating: number;
  ratingCount: number;
  reviewCount: number;
}

export function ProductReviews({
  productId,
  rating,
  ratingCount,
  reviewCount,
}: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({ rating, ratingCount, reviewCount });

  useEffect(() => {
    setSummary({ rating, ratingCount, reviewCount });
  }, [rating, ratingCount, reviewCount]);

  useEffect(() => {
    let isMounted = true;
    async function loadReviews() {
      setIsLoading(true);
      try {
        const data = await productService.getProductReviews(productId);
        if (!isMounted) return;
        setReviews(data);
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadReviews();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  const breakdown = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0];
    for (const r of reviews) {
      const s = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 0)));
      counts[s] += 1;
    }
    const total = reviews.length || 0;
    return [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      percentage: total ? Math.round((counts[stars] / total) * 100) : 0,
    }));
  }, [reviews]);

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-sm p-4 sm:p-6 shadow-2xs">
      <div className="flex items-center justify-between pb-4 border-b border-[#F0F0F0] mb-6 gap-3">
        <h2 className="text-base sm:text-lg font-bold text-[#212121]">Ratings &amp; Reviews</h2>
        <span className="text-xs text-[#878787] text-right">
          {summary.ratingCount.toLocaleString("en-IN")} Ratings &amp; {summary.reviewCount.toLocaleString("en-IN")} Reviews
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-[#F0F0F0]">
        <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[#F0F0F0] pb-4 md:pb-0 md:pr-6">
          <div className="text-4xl sm:text-5xl font-extrabold text-[#212121] mb-2">
            {summary.rating.toFixed(1)}
            <span className="text-xl text-[#878787] font-normal"> / 5</span>
          </div>
          <RatingStars rating={summary.rating} size="lg" />
          <p className="text-xs text-[#878787] mt-2 text-center">
            Based on {summary.ratingCount.toLocaleString("en-IN")} verified buyers
          </p>
        </div>

        <div className="md:col-span-2 space-y-2 flex flex-col justify-center">
          {breakdown.map((item) => (
            <div key={item.stars} className="flex items-center gap-3 text-xs">
              <span className="w-8 font-medium text-[#212121]">{item.stars} ★</span>
              <div className="flex-1 h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
                <div className="h-full bg-[#388E3C] rounded-full" style={{ width: `${item.percentage}%` }} />
              </div>
              <span className="w-10 text-right text-[#878787]">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {isLoading ? (
          <div className="py-6 text-center text-xs text-[#878787]">Loading verified customer reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#878787]">
            No detailed reviews written yet.
          </div>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="pb-5 border-b border-[#F0F0F0] last:border-b-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-[#388E3C] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-xs flex items-center gap-0.5">
                  {rev.rating} ★
                </span>
                <h4 className="text-sm font-bold text-[#212121]">{rev.title}</h4>
              </div>

              <p className="text-xs sm:text-sm text-[#212121] leading-relaxed my-2">{rev.comment}</p>

              <div className="flex flex-wrap items-center justify-between text-xs text-[#878787] pt-1 gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[#212121]">{rev.userName}</span>
                  {rev.userLocation ? <span>({rev.userLocation})</span> : null}
                  {rev.isVerifiedPurchase && (
                    <span className="flex items-center gap-1 text-[#388E3C] font-medium text-[11px]">
                      <CheckCircle size={12} /> Certified Buyer
                    </span>
                  )}
                  <span>·</span>
                  <span>{formatDate(rev.createdAt)}</span>
                </div>

                <div className="flex items-center gap-1 text-[#878787]">
                  <ThumbsUp size={12} />
                  <span>{rev.helpfulCount || 0}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
