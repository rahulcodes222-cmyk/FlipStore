"use client";

import React from "react";
import { SlidersHorizontal, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortOption =
  | "popularity"
  | "price_asc"
  | "price_desc"
  | "newest"
  | "rating"
  | "discount";

interface ProductSortBarProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalProducts: number;
  currentPage: number;
  pageSize: number;
  onOpenMobileFilters: () => void;
  activeFiltersCount: number;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
}

export function ProductSortBar({
  currentSort,
  onSortChange,
  totalProducts,
  currentPage,
  pageSize,
  onOpenMobileFilters,
  activeFiltersCount,
  viewMode,
  onViewModeChange,
}: ProductSortBarProps) {
  const startItem = totalProducts === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalProducts);

  const sortTabs: { id: SortOption; label: string }[] = [
    { id: "popularity", label: "Popularity" },
    { id: "price_asc", label: "Price -- Low to High" },
    { id: "price_desc", label: "Price -- High to Low" },
    { id: "newest", label: "Newest First" },
    { id: "rating", label: "Highest Rated" },
    { id: "discount", label: "Biggest Discount" },
  ];

  return (
    <div className="bg-white border border-[#E0E0E0] rounded-sm p-3 sm:p-4 shadow-2xs space-y-3">
      {/* Top row: Count, Mobile filter button & View mode toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Count summary */}
        <div className="text-xs sm:text-sm text-[#212121]">
          {totalProducts > 0 ? (
            <span>
              Showing <span className="font-bold">{startItem}–{endItem}</span> of{" "}
              <span className="font-bold">{totalProducts}</span> products
            </span>
          ) : (
            <span className="text-[#878787]">0 products found</span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mobile Filter Button */}
          <button
            type="button"
            onClick={onOpenMobileFilters}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2874F0] text-white text-xs font-bold rounded-xs cursor-pointer shadow-xs"
          >
            <SlidersHorizontal size={13} />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-[#2874F0] text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* View mode toggle (Grid / List) */}
          <div className="hidden sm:flex items-center border border-[#E0E0E0] rounded-xs overflow-hidden">
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={cn(
                "p-1.5 transition-colors cursor-pointer",
                viewMode === "grid" ? "bg-gray-100 text-[#2874F0]" : "text-gray-400 hover:text-gray-600"
              )}
              title="Grid View"
              aria-label="Grid view"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              className={cn(
                "p-1.5 transition-colors cursor-pointer",
                viewMode === "list" ? "bg-gray-100 text-[#2874F0]" : "text-gray-400 hover:text-gray-600"
              )}
              title="List View"
              aria-label="List view"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom row: Sort Tabs on Desktop / Dropdown on Mobile */}
      <div className="pt-2 border-t border-[#F0F0F0] flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-[#878787] shrink-0 uppercase tracking-wider hidden sm:inline">
          Sort By:
        </span>

        {/* Desktop inline sort tabs */}
        <div className="hidden md:flex items-center gap-4 text-xs font-medium overflow-x-auto scrollbar-none">
          {sortTabs.map((tab) => {
            const isActive = currentSort === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSortChange(tab.id)}
                className={cn(
                  "pb-1 cursor-pointer transition-colors whitespace-nowrap",
                  isActive
                    ? "text-[#2874F0] font-bold border-b-2 border-[#2874F0]"
                    : "text-[#555] hover:text-[#212121]"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Mobile dropdown selector */}
        <div className="md:hidden w-full flex items-center justify-between gap-2">
          <span className="text-xs text-[#878787] font-medium">Sort By:</span>
          <select
            value={currentSort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="flex-1 max-w-xs px-2.5 py-1 text-xs border border-[#E0E0E0] rounded-xs text-[#212121] font-semibold bg-white focus:outline-none focus:border-[#2874F0]"
          >
            {sortTabs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
