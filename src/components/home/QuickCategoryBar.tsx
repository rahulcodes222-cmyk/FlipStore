"use client";

import React from "react";
import { Category } from "@/types";
import { CategoryCard } from "@/components/common/CategoryCard";

export interface QuickCategoryBarProps {
  categories: Category[];
}

export function QuickCategoryBar({ categories }: QuickCategoryBarProps) {
  if (!categories?.length) return null;

  // Duplicate list for seamless right-to-left marquee
  const items = [...categories, ...categories];
  const duration = Math.max(18, categories.length * 2.5);

  return (
    <div className="w-full bg-white border-b border-[#E0E0E0] shadow-2xs py-3 sm:py-4 mb-4 overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-2 sm:px-4 overflow-hidden">
        <div className="overflow-hidden" aria-label="Browse categories">
          <div
            className="flex w-max items-center will-change-transform"
            style={{ animation: `flipstore-marquee ${duration}s linear infinite` }}
          >
            <div className="flex shrink-0 items-center gap-3 sm:gap-5 pr-3 sm:pr-5">
              {categories.map((category) => (
                <div key={category.id} className="shrink-0">
                  <CategoryCard category={category} variant="circle" className="shrink-0" />
                </div>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-3 sm:gap-5 pr-3 sm:pr-5" aria-hidden="true">
              {categories.map((category, idx) => (
                <div key={`${category.id}-dup-${idx}`} className="shrink-0">
                  <CategoryCard category={category} variant="circle" className="shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
