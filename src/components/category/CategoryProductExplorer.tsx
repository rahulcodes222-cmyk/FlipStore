"use client";

import React, { useState, useMemo } from "react";
import { Product } from "@/types";
import { ProductCard } from "@/components/common/ProductCard";
import { EmptyState } from "@/components/common/EmptyState";
import { SlidersHorizontal, X, Star } from "lucide-react";

interface CategoryProductExplorerProps {
  products: Product[];
  title: string;
  subtitle?: string;
}

export function CategoryProductExplorer({
  products,
  title,
  subtitle,
}: CategoryProductExplorerProps) {
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string>("all");
  const [minRating, setMinRating] = useState<number>(0);
  const [assuredOnly, setAssuredOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("popularity");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Available brands in the product pool
  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    products.forEach((p) => {
      if (p.brandName) brandsSet.add(p.brandName);
    });
    return Array.from(brandsSet).sort();
  }, [products]);

  // Filtering
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Brand filter
      if (selectedBrands.length > 0 && !selectedBrands.includes(p.brandName)) {
        return false;
      }

      // Price range
      if (priceRange === "under_1000" && p.price >= 1000) return false;
      if (priceRange === "1000_10000" && (p.price < 1000 || p.price > 10000)) return false;
      if (priceRange === "10000_50000" && (p.price < 10000 || p.price > 50000)) return false;
      if (priceRange === "above_50000" && p.price <= 50000) return false;

      // Rating
      if (minRating > 0 && p.rating < minRating) return false;

      // Assured
      if (assuredOnly && !p.isAssured) return false;

      return true;
    });
  }, [products, selectedBrands, priceRange, minRating, assuredOnly]);

  // Sorting
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === "price_asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "discount") {
      list.sort((a, b) => b.discountPercentage - a.discountPercentage);
    }
    return list;
  }, [filteredProducts, sortBy]);

  const hasActiveFilters =
    selectedBrands.length > 0 || priceRange !== "all" || minRating > 0 || assuredOnly;

  const handleClearFilters = () => {
    setSelectedBrands([]);
    setPriceRange("all");
    setMinRating(0);
    setAssuredOnly(false);
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const renderFilterPanel = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#212121]">Filters</h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-xs font-bold text-[#2874F0] hover:underline cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {/* FlipStore Assured Filter */}
      <div className="pb-4 border-b border-[#F0F0F0]">
        <label className="flex items-center gap-2 cursor-pointer text-xs">
          <input
            type="checkbox"
            checked={assuredOnly}
            onChange={(e) => setAssuredOnly(e.target.checked)}
            className="rounded-xs accent-[#2874F0]"
          />
          <span className="font-semibold text-[#2874F0]">✦ FlipStore Assured</span>
        </label>
      </div>

      {/* Price Range */}
      <div className="pb-4 border-b border-[#F0F0F0]">
        <h4 className="text-xs font-bold text-[#212121] uppercase tracking-wider mb-2.5">Price</h4>
        <div className="space-y-1.5 text-xs">
          {[
            { id: "all", label: "All Prices" },
            { id: "under_1000", label: "Under ₹1,000" },
            { id: "1000_10000", label: "₹1,000 – ₹10,000" },
            { id: "10000_50000", label: "₹10,000 – ₹50,000" },
            { id: "above_50000", label: "Over ₹50,000" },
          ].map((opt) => (
            <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="price_filter"
                checked={priceRange === opt.id}
                onChange={() => setPriceRange(opt.id)}
                className="accent-[#2874F0]"
              />
              <span className={priceRange === opt.id ? "font-bold text-[#212121]" : "text-[#555]"}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Brands */}
      {availableBrands.length > 0 && (
        <div className="pb-4 border-b border-[#F0F0F0]">
          <h4 className="text-xs font-bold text-[#212121] uppercase tracking-wider mb-2.5">Brand</h4>
          <div className="space-y-1.5 text-xs max-h-48 overflow-y-auto pr-1">
            {availableBrands.map((brand) => (
              <label key={brand} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => toggleBrand(brand)}
                  className="rounded-xs accent-[#2874F0]"
                />
                <span
                  className={
                    selectedBrands.includes(brand) ? "font-bold text-[#212121]" : "text-[#555]"
                  }
                >
                  {brand}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Customer Rating */}
      <div>
        <h4 className="text-xs font-bold text-[#212121] uppercase tracking-wider mb-2.5">
          Customer Ratings
        </h4>
        <div className="space-y-1.5 text-xs">
          {[
            { rating: 4, label: "4★ & above" },
            { rating: 3, label: "3★ & above" },
            { rating: 0, label: "All Ratings" },
          ].map((item) => (
            <label key={item.rating} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rating_filter"
                checked={minRating === item.rating}
                onChange={() => setMinRating(item.rating)}
                className="accent-[#2874F0]"
              />
              <span className="flex items-center gap-1 text-[#555]">
                {item.label}
                {item.rating > 0 && <Star size={12} className="text-[#388E3C] fill-current" />}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white border border-[#E0E0E0] rounded-sm p-4 sm:p-5 shadow-2xs">
        <h1 className="text-lg sm:text-2xl font-bold text-[#212121]">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-[#878787] mt-0.5">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Desktop Left Sidebar Filters */}
        <aside className="hidden lg:block lg:col-span-1 bg-white border border-[#E0E0E0] rounded-sm p-4 h-fit shadow-2xs">
          {renderFilterPanel()}
        </aside>

        {/* Right Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Top Sort & Filter Bar */}
          <div className="bg-white border border-[#E0E0E0] rounded-sm p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            {/* Mobile Filter Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-xs text-xs font-semibold text-[#212121]"
            >
              <SlidersHorizontal size={14} />
              <span>Filters {hasActiveFilters && "(Active)"}</span>
            </button>

            <div className="text-xs text-[#878787]">
              Showing <span className="font-bold text-[#212121]">{sortedProducts.length}</span> of{" "}
              {products.length} products
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#878787] hidden sm:inline">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2.5 py-1.5 border border-[#E0E0E0] rounded-xs text-xs text-[#212121] font-medium bg-white focus:outline-none focus:border-[#2874F0] cursor-pointer"
              >
                <option value="popularity">Popularity / Relevance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="discount">Biggest Discount</option>
              </select>
            </div>
          </div>

          {/* Active Filter Pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 text-xs bg-white border border-[#E0E0E0] rounded-sm p-2.5 shadow-2xs">
              <span className="text-[#878787]">Active:</span>
              {assuredOnly && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-[#2874F0] rounded-xs font-semibold">
                  Assured
                  <button type="button" onClick={() => setAssuredOnly(false)} className="hover:text-red-500">
                    <X size={12} />
                  </button>
                </span>
              )}
              {priceRange !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-[#212121] rounded-xs font-semibold">
                  Price Filter
                  <button type="button" onClick={() => setPriceRange("all")} className="hover:text-red-500">
                    <X size={12} />
                  </button>
                </span>
              )}
              {selectedBrands.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-[#212121] rounded-xs font-semibold"
                >
                  {b}
                  <button type="button" onClick={() => toggleBrand(b)} className="hover:text-red-500">
                    <X size={12} />
                  </button>
                </span>
              ))}
              {minRating > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-[#212121] rounded-xs font-semibold">
                  {minRating}★ &amp; above
                  <button type="button" onClick={() => setMinRating(0)} className="hover:text-red-500">
                    <X size={12} />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-[#2874F0] hover:underline font-bold ml-auto cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Product Grid */}
          {sortedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {sortedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#E0E0E0] rounded-sm p-8 shadow-2xs">
              <EmptyState
                preset="search"
                title="No matching products found"
                description="Try loosening or clearing your filter criteria to see available products."
                actionText="Reset Filters"
                onAction={handleClearFilters}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Filter Dialog */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-5 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0] mb-4">
                <h3 className="text-sm font-bold text-[#212121]">Filters</h3>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 text-gray-500 hover:text-gray-800"
                >
                  <X size={18} />
                </button>
              </div>
              {renderFilterPanel()}
            </div>
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(false)}
              className="mt-6 w-full py-2.5 bg-[#2874F0] text-white font-bold text-xs rounded-xs"
            >
              Apply &amp; View {sortedProducts.length} Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
