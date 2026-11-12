import React from "react";
import { Category } from "@/types";
import { CategoryCard } from "@/components/common/CategoryCard";

export interface QuickCategoryBarProps {
  categories: Category[];
}

export function QuickCategoryBar({ categories }: QuickCategoryBarProps) {
  return (
    <div className="w-full bg-white border-b border-[#E0E0E0] shadow-2xs py-4 mb-4">
      <div className="max-w-[1280px] mx-auto px-2 sm:px-4">
        {/* Horizontal Scroll on Mobile / Centered flex on Desktop */}
        <div className="flex items-center justify-between sm:justify-around overflow-x-auto scrollbar-none gap-2 sm:gap-4 px-1">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              variant="circle"
              className="shrink-0"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
