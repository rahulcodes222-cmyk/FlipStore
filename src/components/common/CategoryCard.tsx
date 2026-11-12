import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Category } from "@/types";
import { cn } from "@/lib/utils";

export interface CategoryCardProps {
  category: Category;
  variant?: "circle" | "card" | "pill";
  className?: string;
}

export function CategoryCard({
  category,
  variant = "circle",
  className,
}: CategoryCardProps) {
  // Circle Variant (Flipkart top navigation icon bar style)
  if (variant === "circle") {
    return (
      <Link
        href={`/category/${category.slug}`}
        className={cn(
          "group flex flex-col items-center text-center p-2 rounded-sm transition-transform duration-200 hover:-translate-y-1 focus:outline-none focus:ring-1 focus:ring-[#2874F0]",
          className
        )}
      >
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white p-2 shadow-xs border border-[#E0E0E0] group-hover:border-[#2874F0] group-hover:shadow-md transition-all overflow-hidden flex items-center justify-center">
          <Image
            src={category.image}
            alt={category.name}
            fill
            sizes="80px"
            className="object-cover rounded-full p-1 transition-transform duration-300 group-hover:scale-110"
          />
        </div>
        <span className="mt-2 text-xs font-semibold text-[#212121] group-hover:text-[#2874F0] line-clamp-1 max-w-[90px] transition-colors">
          {category.name}
        </span>
      </Link>
    );
  }

  // Pill Variant (compact chip for filters and quick links)
  if (variant === "pill") {
    return (
      <Link
        href={`/category/${category.slug}`}
        className={cn(
          "inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E0E0E0] rounded-full text-xs font-medium text-[#212121] hover:border-[#2874F0] hover:text-[#2874F0] hover:bg-[#eaf2ff] transition-all shadow-2xs whitespace-nowrap",
          className
        )}
      >
        <div className="relative w-5 h-5 rounded-full overflow-hidden shrink-0">
          <Image src={category.image} alt={category.name} fill sizes="20px" className="object-cover" />
        </div>
        <span>{category.name}</span>
      </Link>
    );
  }

  // Boxed Card Variant (for category browse grids)
  return (
    <Link
      href={`/category/${category.slug}`}
      className={cn(
        "group relative flex flex-col bg-white border border-[#E0E0E0] rounded-sm p-4 overflow-hidden hover:shadow-md hover:border-[#2874F0] transition-all duration-200",
        className
      )}
    >
      <div className="relative w-full aspect-4/3 mb-3 bg-gray-50 rounded-xs overflow-hidden flex items-center justify-center">
        <Image
          src={category.image}
          alt={category.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <h4 className="text-sm font-semibold text-[#212121] group-hover:text-[#2874F0] transition-colors line-clamp-1">
        {category.name}
      </h4>

      {category.itemCount !== undefined && (
        <span className="text-xs text-[#878787] mt-0.5">
          {category.itemCount.toLocaleString("en-IN")}+ Products
        </span>
      )}
    </Link>
  );
}
