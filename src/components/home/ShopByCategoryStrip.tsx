"use client";

import React, { useState } from "react";
import { Category } from "@/types";
import { CategoryCard } from "@/components/common/CategoryCard";

export function ShopByCategoryStrip({ categories }: { categories: Category[] }) {
  const [paused, setPaused] = useState(false);
  if (!categories?.length) return null;
  const duration = Math.max(22, categories.length * 3);

  return (
    <div
      className="overflow-hidden"
      aria-label="Shop by category"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex w-max items-stretch will-change-transform"
        style={{
          animation: `flipstore-marquee ${duration}s linear infinite`,
          animationPlayState: paused ? "paused" : "running",
        }}
      >
        <div className="flex shrink-0 items-stretch gap-3 pr-3">
          {categories.map((cat) => (
            <div key={cat.id} className="shrink-0 w-[160px] sm:w-[180px] md:w-[190px] lg:w-[200px]">
              <CategoryCard category={cat} variant="card" className="h-full" />
            </div>
          ))}
        </div>
        <div className="flex shrink-0 items-stretch gap-3 pr-3" aria-hidden>
          {categories.map((cat) => (
            <div key={`dup-${cat.id}`} className="shrink-0 w-[160px] sm:w-[180px] md:w-[190px] lg:w-[200px]">
              <CategoryCard category={cat} variant="card" className="h-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
