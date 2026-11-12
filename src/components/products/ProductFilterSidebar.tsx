"use client";

import React, { useState } from "react";
import { Category } from "@/types";
import { Star, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterState {
  category?: string;
  brands: string[];
  priceRange?: string; // e.g. "under_1000", "1000_5000", "5000_20000", "20000_50000", "above_50000", "custom"
  minPrice?: number;
  maxPrice?: number;
  minRating?: number; // 4, 3, 2, 1
  minDiscount?: number; // 10, 20, 30, 50
  inStockOnly: boolean;
}

interface ProductFilterSidebarProps {
  categories: Category[];
  availableBrands: { name: string; count: number }[];
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  categoryItemCounts?: Record<string, number>;
  isCategoryFixed?: boolean; // when on /products/[category], category can be locked or unlocked
  className?: string;
}

export function ProductFilterSidebar({
  categories,
  availableBrands,
  filters,
  onFilterChange,
  onClearAll,
  hasActiveFilters,
  categoryItemCounts = {},
  isCategoryFixed = false,
  className,
}: ProductFilterSidebarProps) {
  // Collapsible sections
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [customMin, setCustomMin] = useState(filters.minPrice?.toString() || "");
  const [customMax, setCustomMax] = useState(filters.maxPrice?.toString() || "");
  const [brandSearch, setBrandSearch] = useState("");

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCategorySelect = (slug: string) => {
    onFilterChange({
      ...filters,
      category: filters.category === slug ? undefined : slug,
    });
  };

  const handleBrandToggle = (brandName: string) => {
    const isSelected = filters.brands.includes(brandName);
    const updatedBrands = isSelected
      ? filters.brands.filter((b) => b !== brandName)
      : [...filters.brands, brandName];

    onFilterChange({
      ...filters,
      brands: updatedBrands,
    });
  };

  const handlePricePreset = (presetId: string, min?: number, max?: number) => {
    if (filters.priceRange === presetId) {
      onFilterChange({
        ...filters,
        priceRange: undefined,
        minPrice: undefined,
        maxPrice: undefined,
      });
      setCustomMin("");
      setCustomMax("");
    } else {
      onFilterChange({
        ...filters,
        priceRange: presetId,
        minPrice: min,
        maxPrice: max,
      });
      if (min !== undefined) setCustomMin(min.toString());
      else setCustomMin("");
      if (max !== undefined) setCustomMax(max.toString());
      else setCustomMax("");
    }
  };

  const handleApplyCustomPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const min = customMin ? parseInt(customMin, 10) : undefined;
    const max = customMax ? parseInt(customMax, 10) : undefined;

    onFilterChange({
      ...filters,
      priceRange: "custom",
      minPrice: isNaN(min as number) ? undefined : min,
      maxPrice: isNaN(max as number) ? undefined : max,
    });
  };

  const handleRatingSelect = (rating: number) => {
    onFilterChange({
      ...filters,
      minRating: filters.minRating === rating ? undefined : rating,
    });
  };

  const handleDiscountSelect = (discount: number) => {
    onFilterChange({
      ...filters,
      minDiscount: filters.minDiscount === discount ? undefined : discount,
    });
  };

  const handleStockToggle = () => {
    onFilterChange({
      ...filters,
      inStockOnly: !filters.inStockOnly,
    });
  };

  const filteredBrands = availableBrands.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase().trim())
  );

  return (
    <aside className={cn("bg-white border border-[#E0E0E0] rounded-sm shadow-2xs divide-y divide-[#F0F0F0]", className)}>
      {/* Header with Clear All */}
      <div className="p-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#212121]">
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-bold text-[#2874F0] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw size={12} /> Clear All
          </button>
        )}
      </div>

      {/* 1. CATEGORIES */}
      <div className="p-4">
        <button
          type="button"
          onClick={() => toggleSection("category")}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#212121] mb-2.5"
        >
          <span>Category</span>
          {collapsedSections["category"] ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        {!collapsedSections["category"] && (
          <div className="space-y-1.5 text-xs max-h-56 overflow-y-auto pr-1">
            {!isCategoryFixed && (
              <label
                onClick={() => handleCategorySelect("")}
                className={cn(
                  "flex items-center justify-between p-1 rounded-xs cursor-pointer transition-colors",
                  !filters.category ? "text-[#2874F0] font-bold bg-blue-50/50" : "text-[#555] hover:text-[#212121]"
                )}
              >
                <span>All Categories</span>
              </label>
            )}

            {categories.map((cat) => {
              const isSelected = filters.category === cat.slug;
              const count = categoryItemCounts[cat.slug];
              return (
                <label
                  key={cat.id}
                  onClick={() => !isCategoryFixed && handleCategorySelect(cat.slug)}
                  className={cn(
                    "flex items-center justify-between p-1 rounded-xs transition-colors",
                    isCategoryFixed ? "cursor-default font-bold text-[#212121]" : "cursor-pointer",
                    isSelected ? "text-[#2874F0] font-bold bg-blue-50/50" : "text-[#555] hover:text-[#212121]"
                  )}
                >
                  <span className="truncate pr-2">{cat.name}</span>
                  {count !== undefined && (
                    <span className="text-[10px] text-[#878787] font-normal">({count})</span>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. BRANDS */}
      {availableBrands.length > 0 && (
        <div className="p-4">
          <button
            type="button"
            onClick={() => toggleSection("brand")}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#212121] mb-2.5"
          >
            <span>Brand {filters.brands.length > 0 && `(${filters.brands.length})`}</span>
            {collapsedSections["brand"] ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>

          {!collapsedSections["brand"] && (
            <div className="space-y-2">
              {availableBrands.length > 6 && (
                <input
                  type="text"
                  placeholder="Search Brand..."
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  className="w-full px-2 py-1 text-[11px] border border-gray-200 rounded-xs focus:outline-none focus:border-[#2874F0]"
                />
              )}

              <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1">
                {filteredBrands.map((b) => {
                  const isChecked = filters.brands.includes(b.name);
                  return (
                    <label
                      key={b.name}
                      className="flex items-center justify-between cursor-pointer text-[#424242] hover:text-[#212121]"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleBrandToggle(b.name)}
                          className="rounded-xs accent-[#2874F0]"
                        />
                        <span className={cn("truncate", isChecked && "font-bold text-[#212121]")}>
                          {b.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#878787]">({b.count})</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. PRICE RANGE */}
      <div className="p-4">
        <button
          type="button"
          onClick={() => toggleSection("price")}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#212121] mb-2.5"
        >
          <span>Price</span>
          {collapsedSections["price"] ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        {!collapsedSections["price"] && (
          <div className="space-y-2.5 text-xs">
            <div className="space-y-1.5">
              {[
                { id: "under_1000", label: "Under ₹1,000", min: 0, max: 999 },
                { id: "1000_5000", label: "₹1,000 – ₹5,000", min: 1000, max: 5000 },
                { id: "5000_20000", label: "₹5,000 – ₹20,000", min: 5000, max: 20000 },
                { id: "20000_50000", label: "₹20,000 – ₹50,000", min: 20000, max: 50000 },
                { id: "above_50000", label: "Above ₹50,000", min: 50000, max: undefined },
              ].map((p) => {
                const isSelected = filters.priceRange === p.id;
                return (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer text-[#424242]">
                    <input
                      type="radio"
                      name="price_preset"
                      checked={isSelected}
                      onChange={() => handlePricePreset(p.id, p.min, p.max)}
                      className="accent-[#2874F0]"
                    />
                    <span className={cn(isSelected && "font-bold text-[#212121]")}>{p.label}</span>
                  </label>
                );
              })}
            </div>

            {/* Custom Min/Max Inputs */}
            <form onSubmit={handleApplyCustomPrice} className="pt-2 border-t border-gray-100 flex items-center gap-1.5">
              <input
                type="number"
                placeholder="Min ₹"
                value={customMin}
                onChange={(e) => setCustomMin(e.target.value)}
                className="w-16 px-1.5 py-1 text-xs border border-gray-200 rounded-xs focus:outline-none focus:border-[#2874F0]"
              />
              <span className="text-gray-400 text-xs">to</span>
              <input
                type="number"
                placeholder="Max ₹"
                value={customMax}
                onChange={(e) => setCustomMax(e.target.value)}
                className="w-16 px-1.5 py-1 text-xs border border-gray-200 rounded-xs focus:outline-none focus:border-[#2874F0]"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-[#2874F0] text-white text-[11px] font-bold rounded-xs cursor-pointer hover:bg-blue-600"
              >
                Go
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 4. CUSTOMER RATING */}
      <div className="p-4">
        <button
          type="button"
          onClick={() => toggleSection("rating")}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#212121] mb-2.5"
        >
          <span>Customer Ratings</span>
          {collapsedSections["rating"] ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        {!collapsedSections["rating"] && (
          <div className="space-y-1.5 text-xs">
            {[4, 3, 2, 1].map((r) => {
              const isSelected = filters.minRating === r;
              return (
                <label key={r} className="flex items-center gap-2 cursor-pointer text-[#424242]">
                  <input
                    type="radio"
                    name="min_rating"
                    checked={isSelected}
                    onChange={() => handleRatingSelect(r)}
                    className="accent-[#2874F0]"
                  />
                  <span className={cn("flex items-center gap-1", isSelected && "font-bold text-[#212121]")}>
                    <span>{r}★ &amp; above</span>
                    <Star size={12} className="text-[#388E3C] fill-current" />
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. DISCOUNT */}
      <div className="p-4">
        <button
          type="button"
          onClick={() => toggleSection("discount")}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#212121] mb-2.5"
        >
          <span>Discount</span>
          {collapsedSections["discount"] ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        {!collapsedSections["discount"] && (
          <div className="space-y-1.5 text-xs">
            {[50, 30, 20, 10].map((d) => {
              const isSelected = filters.minDiscount === d;
              return (
                <label key={d} className="flex items-center gap-2 cursor-pointer text-[#424242]">
                  <input
                    type="radio"
                    name="discount_percent"
                    checked={isSelected}
                    onChange={() => handleDiscountSelect(d)}
                    className="accent-[#2874F0]"
                  />
                  <span className={cn(isSelected && "font-bold text-[#212121]")}>
                    {d}% or more
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. AVAILABILITY */}
      <div className="p-4">
        <button
          type="button"
          onClick={() => toggleSection("availability")}
          className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#212121] mb-2.5"
        >
          <span>Availability</span>
          {collapsedSections["availability"] ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        {!collapsedSections["availability"] && (
          <div className="text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-[#424242]">
              <input
                type="checkbox"
                checked={filters.inStockOnly}
                onChange={handleStockToggle}
                className="rounded-xs accent-[#2874F0]"
              />
              <span className={cn(filters.inStockOnly && "font-bold text-[#212121]")}>
                In Stock Only
              </span>
            </label>
          </div>
        )}
      </div>
    </aside>
  );
}
