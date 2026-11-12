"use client";

import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RatingStarsProps {
  rating: number; // e.g. 4.4 out of 5
  maxRating?: number;
  totalRatings?: number; // e.g. 14210
  totalReviews?: number; // e.g. 1150
  size?: "sm" | "md" | "lg";
  variant?: "badge" | "stars" | "compact";
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export function RatingStars({
  rating = 0,
  maxRating = 5,
  totalRatings,
  totalReviews,
  size = "md",
  variant = "badge",
  interactive = false,
  onRatingChange,
  className,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  // Sizing tokens
  const sizeMap = {
    sm: { star: 12, text: "text-xs", badge: "text-[11px] px-1.5 py-0.5 gap-1" },
    md: { star: 14, text: "text-sm", badge: "text-xs px-2 py-0.5 gap-1" },
    lg: { star: 18, text: "text-base", badge: "text-sm px-2.5 py-1 gap-1.5" },
  };

  const currentSize = sizeMap[size];
  const activeRating = hoverRating ?? rating;

  // Rating color helper (Flipkart style: >=4.0 green, >=3.0 yellow/amber, <3.0 red)
  const getRatingBgColor = (score: number) => {
    if (score >= 4.0) return "bg-[#388E3C]"; // Flipkart forest green
    if (score >= 3.0) return "bg-[#FF9F00]"; // Amber
    return "bg-[#D32F2F]"; // Red
  };

  // Format large counts in Indian number format (e.g., 38,450)
  const formatCount = (count?: number) => {
    if (count === undefined || count === null) return "";
    return new Intl.NumberFormat("en-IN").format(count);
  };

  // Badge Variant (Signature Flipkart green pill)
  if (variant === "badge") {
    return (
      <div className={cn("inline-flex items-center gap-1.5", className)}>
        <span
          className={cn(
            "inline-flex items-center font-bold text-white rounded-[3px]",
            getRatingBgColor(rating),
            currentSize.badge
          )}
        >
          <span>{rating.toFixed(1)}</span>
          <Star size={currentSize.star} className="fill-white text-white" />
        </span>
        {(totalRatings !== undefined || totalReviews !== undefined) && (
          <span className={cn("text-[#878787] font-medium", currentSize.text)}>
            ({formatCount(totalRatings)}
            {totalReviews !== undefined && ` Ratings & ${formatCount(totalReviews)} Reviews`})
          </span>
        )}
      </div>
    );
  }

  // Multi-Star or Interactive Variant
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={() => interactive && setHoverRating(null)}
      >
        {Array.from({ length: maxRating }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = activeRating >= starValue;
          const isHalf = !isFilled && activeRating >= starValue - 0.5;

          return (
            <button
              key={index}
              type={interactive ? "button" : undefined}
              disabled={!interactive}
              onClick={() => interactive && onRatingChange?.(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              className={cn(
                "transition-colors",
                interactive ? "cursor-pointer hover:scale-110 active:scale-95" : "cursor-default"
              )}
              aria-label={interactive ? `Rate ${starValue} star` : undefined}
            >
              <Star
                size={currentSize.star}
                className={cn(
                  isFilled
                    ? "fill-[#FF9F00] text-[#FF9F00]"
                    : isHalf
                    ? "fill-[#FF9F00]/50 text-[#FF9F00]"
                    : "fill-gray-200 text-gray-300"
                )}
              />
            </button>
          );
        })}
      </div>

      {variant !== "compact" && (
        <span className={cn("text-[#212121] font-medium", currentSize.text)}>
          {rating.toFixed(1)}
        </span>
      )}

      {totalRatings !== undefined && (
        <span className={cn("text-[#878787]", currentSize.text)}>
          ({formatCount(totalRatings)})
        </span>
      )}
    </div>
  );
}
