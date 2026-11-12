"use client";

import React from "react";
import { History, Sparkles, Trash2 } from "lucide-react";
import { Product } from "@/types";
import { useRecentlyViewedStore } from "@/store/useRecentlyViewedStore";
import { useHydration } from "@/hooks/useHydration";
import { ProductCard } from "@/components/common/ProductCard";

export interface RecentlyViewedSectionProps {
  fallbackProducts: Product[];
}

export function RecentlyViewedSection({ fallbackProducts }: RecentlyViewedSectionProps) {
  const isHydrated = useHydration();
  const recentlyViewed = useRecentlyViewedStore((s) => s.products);
  const clearRecentlyViewed = useRecentlyViewedStore((s) => s.clearRecentlyViewed);

  // Use recently viewed products if present, otherwise use curated recommended products
  const hasHistory = isHydrated && recentlyViewed.length > 0;
  const displayProducts = hasHistory ? recentlyViewed.slice(0, 5) : fallbackProducts.slice(0, 5);

  if (displayProducts.length === 0) return null;

  return (
    <section className="w-full bg-white border border-[#E0E0E0] rounded-sm p-4 sm:p-5 shadow-2xs mb-6">
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#F0F0F0]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-full bg-blue-50 text-[#2874F0]">
            {hasHistory ? <History size={20} /> : <Sparkles size={20} />}
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-[#212121] tracking-tight">
              {hasHistory ? "Recently Viewed Products" : "Recommended For You"}
            </h2>
            <p className="text-xs text-[#878787] mt-0.5">
              {hasHistory
                ? "Pick up right where you left off"
                : "Curated best picks tailored to popular Indian shopping trends"}
            </p>
          </div>
        </div>

        {hasHistory && (
          <button
            type="button"
            onClick={clearRecentlyViewed}
            className="flex items-center gap-1 text-xs text-[#878787] hover:text-red-600 transition-colors cursor-pointer"
            aria-label="Clear recently viewed history"
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">Clear History</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {displayProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
