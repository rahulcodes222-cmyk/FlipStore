import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Base animated skeleton primitive
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-xs bg-gray-200", className)}
      {...props}
    />
  );
}

/**
 * Product Card Loading Skeleton
 * Matches the layout of ProductCard.tsx
 */
export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col bg-white border border-[#E0E0E0] rounded-sm p-3 space-y-3",
        className
      )}
    >
      {/* Top Tag & Heart */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>

      {/* Image Skeleton */}
      <div className="w-full aspect-square flex items-center justify-center p-2">
        <Skeleton className="w-full h-full rounded-xs" />
      </div>

      {/* Content Skeletons */}
      <div className="space-y-2 pt-2">
        {/* Title (2 lines) */}
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />

        {/* Rating Pill */}
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-4 w-12 rounded-[3px]" />
          <Skeleton className="h-3 w-16" />
        </div>

        {/* Price Row */}
        <div className="pt-2 border-t border-[#F0F0F0] flex justify-between items-center">
          <div className="space-y-1">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-7 w-7 rounded-xs" />
        </div>
      </div>
    </div>
  );
}

/**
 * Grid of Product Card Skeletons
 */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Category Card Skeleton
 */
export function CategoryCardSkeleton() {
  return (
    <div className="flex flex-col items-center p-2 space-y-2">
      <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-full" />
      <Skeleton className="h-3 w-14" />
    </div>
  );
}
