"use client";

import React from "react";
import { X } from "lucide-react";
import { FilterState } from "./ProductFilterSidebar";
import { Category } from "@/types";

interface ActiveFilterChipsProps {
  filters: FilterState;
  categories: Category[];
  searchQuery?: string;
  onRemoveCategory: () => void;
  onRemoveBrand: (brand: string) => void;
  onRemovePrice: () => void;
  onRemoveRating: () => void;
  onRemoveDiscount: () => void;
  onRemoveStock: () => void;
  onRemoveSearch?: () => void;
  onClearAll: () => void;
  isCategoryFixed?: boolean;
}

export function ActiveFilterChips({
  filters,
  categories,
  searchQuery,
  onRemoveCategory,
  onRemoveBrand,
  onRemovePrice,
  onRemoveRating,
  onRemoveDiscount,
  onRemoveStock,
  onRemoveSearch,
  onClearAll,
  isCategoryFixed = false,
}: ActiveFilterChipsProps) {
  const activeChips: { id: string; label: string; onRemove: () => void }[] = [];

  // Search chip
  if (searchQuery) {
    activeChips.push({
      id: "search",
      label: `Search: "${searchQuery}"`,
      onRemove: onRemoveSearch || (() => {}),
    });
  }

  // Category chip (only if not fixed by route)
  if (!isCategoryFixed && filters.category) {
    const catName = categories.find((c) => c.slug === filters.category)?.name || filters.category;
    activeChips.push({
      id: "category",
      label: `Category: ${catName}`,
      onRemove: onRemoveCategory,
    });
  }

  // Brands chips
  filters.brands.forEach((brand) => {
    activeChips.push({
      id: `brand-${brand}`,
      label: `Brand: ${brand}`,
      onRemove: () => onRemoveBrand(brand),
    });
  });

  // Price Range chip
  if (filters.priceRange) {
    let priceLabel = "Price Filter";
    if (filters.priceRange === "under_1000") priceLabel = "Under ₹1,000";
    else if (filters.priceRange === "1000_5000") priceLabel = "₹1,000 – ₹5,000";
    else if (filters.priceRange === "5000_20000") priceLabel = "₹5,000 – ₹20,000";
    else if (filters.priceRange === "20000_50000") priceLabel = "₹20,000 – ₹50,000";
    else if (filters.priceRange === "above_50000") priceLabel = "Above ₹50,000";
    else if (filters.priceRange === "custom") {
      if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
        priceLabel = `₹${filters.minPrice} – ₹${filters.maxPrice}`;
      } else if (filters.minPrice !== undefined) {
        priceLabel = `Min ₹${filters.minPrice}`;
      } else if (filters.maxPrice !== undefined) {
        priceLabel = `Max ₹${filters.maxPrice}`;
      }
    }

    activeChips.push({
      id: "price",
      label: priceLabel,
      onRemove: onRemovePrice,
    });
  }

  // Rating chip
  if (filters.minRating && filters.minRating > 0) {
    activeChips.push({
      id: "rating",
      label: `${filters.minRating}★ & above`,
      onRemove: onRemoveRating,
    });
  }

  // Discount chip
  if (filters.minDiscount && filters.minDiscount > 0) {
    activeChips.push({
      id: "discount",
      label: `${filters.minDiscount}% Off or more`,
      onRemove: onRemoveDiscount,
    });
  }

  // In Stock chip
  if (filters.inStockOnly) {
    activeChips.push({
      id: "stock",
      label: "In Stock Only",
      onRemove: onRemoveStock,
    });
  }

  if (activeChips.length === 0) return null;

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-sm p-3 shadow-2xs flex flex-wrap items-center gap-2 text-xs">
      <span className="text-[#878787] font-medium shrink-0">Applied Filters:</span>

      {activeChips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-[#212121] rounded-xs font-semibold transition-colors"
        >
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            className="text-gray-500 hover:text-red-600 cursor-pointer"
            aria-label={`Remove filter ${chip.label}`}
          >
            <X size={12} />
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={onClearAll}
        className="text-[#2874F0] font-bold hover:underline cursor-pointer ml-auto text-xs"
      >
        Clear All
      </button>
    </div>
  );
}
