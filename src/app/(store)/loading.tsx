import React from "react";
import { Skeleton } from "@/components/common/Skeleton";

export default function StoreLoading() {
  return (
    <div className="max-w-[1280px] mx-auto px-3 sm:px-4 py-6 space-y-6">
      {/* Top banner skeleton */}
      <Skeleton className="h-44 sm:h-64 w-full rounded-sm" />

      {/* Grid skeleton */}
      <div className="bg-white border border-[#E0E0E0] rounded-sm p-4 space-y-4">
        <Skeleton className="h-6 w-48 rounded-xs" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3 p-3 border border-gray-100 rounded-sm">
              <Skeleton className="aspect-square w-full rounded-xs" />
              <Skeleton className="h-4 w-3/4 rounded-xs" />
              <Skeleton className="h-4 w-1/2 rounded-xs" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
