"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, ArrowRight, Tag, Sparkles } from "lucide-react";
import { Product } from "@/types";
import { productService } from "@/services/productService";
import { formatPrice } from "@/utils/formatters";
import { cn } from "@/lib/utils";

export interface SearchBarProps {
  placeholder?: string;
  isMobileExpanded?: boolean;
  onMobileClose?: () => void;
  className?: string;
}

export function SearchBar({
  placeholder = "Search for Products, Brands and More",
  isMobileExpanded = false,
  onMobileClose,
  className,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    products: Product[];
    categories: { name: string; slug: string }[];
    brands: { name: string; slug: string }[];
  }>({ products: [], categories: [], brands: [] });
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch live suggestions debounced
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      const clearTimer = setTimeout(() => {
        setSuggestions({ products: [], categories: [], brands: [] });
        setIsOpen(false);
      }, 0);
      return () => clearTimeout(clearTimer);
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await productService.getLiveSuggestions(trimmed, 5);
        setSuggestions(results);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (err) {
        console.error("Failed to fetch suggestions", err);
      } finally {
        setIsLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle form submission / navigation
  const executeSearch = useCallback(
    (searchQuery: string) => {
      const q = searchQuery.trim();
      if (!q) return;
      setIsOpen(false);
      inputRef.current?.blur();
      onMobileClose?.();
      router.push(`/search?q=${encodeURIComponent(q)}`);
    },
    [router, onMobileClose]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions.products[selectedIndex]) {
      const target = suggestions.products[selectedIndex];
      router.push(`/product/${target.slug}`);
      setIsOpen(false);
      onMobileClose?.();
      return;
    }
    executeSearch(query);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions({ products: [], categories: [], brands: [] });
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Keyboard navigation for suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (!isOpen || suggestions.products.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.products.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.products.length - 1
      );
    }
  };

  const totalResults =
    suggestions.products.length +
    suggestions.categories.length +
    suggestions.brands.length;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Search Input Box */}
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex items-center w-full bg-white rounded-xs shadow-xs border border-transparent transition-all duration-150 focus-within:ring-2 focus-within:ring-[#172337]/30",
          isMobileExpanded ? "h-11 shadow-md" : "h-9 sm:h-10"
        )}
      >
        {/* Search Icon button */}
        <button
          type="submit"
          className="pl-3 pr-2 text-gray-500 hover:text-[#2874F0] flex items-center justify-center shrink-0"
          aria-label="Search submit"
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin text-[#2874F0]" />
          ) : (
            <Search size={18} className="text-[#2874F0]" />
          )}
        </button>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim().length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-2 py-1 text-sm text-[#212121] placeholder:text-[#878787] outline-none"
          autoComplete="off"
          aria-label="Search products, brands and categories"
        />

        {/* Clear Button (X) */}
        {query.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors shrink-0"
            aria-label="Clear search input"
          >
            <X size={16} />
          </button>
        )}

        {/* Mobile Close Button when in expanded overlay */}
        {isMobileExpanded && onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            className="px-3 text-xs font-semibold text-[#2874F0] shrink-0 border-l border-gray-200 h-full flex items-center"
          >
            Cancel
          </button>
        )}
      </form>

      {/* Live Suggestions Overlay */}
      {isOpen && query.trim().length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E0E0E0] rounded-xs shadow-2xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 max-h-[75vh] overflow-y-auto"
          role="listbox"
        >
          {totalResults > 0 ? (
            <div>
              {/* Category & Brand Pills Strip */}
              {(suggestions.categories.length > 0 || suggestions.brands.length > 0) && (
                <div className="p-2.5 bg-[#F9FAFB] border-b border-[#F0F0F0] flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[#878787] font-medium flex items-center gap-1 mr-1">
                    <Tag size={12} /> Filter:
                  </span>
                  {suggestions.categories.map((cat) => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => {
                        router.push(`/category/${cat.slug}`);
                        setIsOpen(false);
                        onMobileClose?.();
                      }}
                      className="px-2.5 py-1 bg-white border border-[#E0E0E0] rounded-full text-xs font-medium text-[#212121] hover:border-[#2874F0] hover:text-[#2874F0] transition-colors"
                    >
                      in <span className="font-semibold">{cat.name}</span>
                    </button>
                  ))}
                  {suggestions.brands.map((brand) => (
                    <button
                      key={brand.slug}
                      type="button"
                      onClick={() => {
                        executeSearch(brand.name);
                      }}
                      className="px-2.5 py-1 bg-white border border-[#E0E0E0] rounded-full text-xs font-medium text-[#212121] hover:border-[#2874F0] hover:text-[#2874F0] transition-colors"
                    >
                      Brand: <span className="font-semibold">{brand.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Product Matches */}
              {suggestions.products.length > 0 && (
                <div className="py-1">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#878787]">
                    Products ({suggestions.products.length})
                  </div>
                  <ul>
                    {suggestions.products.map((product, index) => {
                      const isSelected = index === selectedIndex;
                      return (
                        <li key={product.id}>
                          <button
                            type="button"
                            onClick={() => {
                              router.push(`/product/${product.slug}`);
                              setIsOpen(false);
                              onMobileClose?.();
                            }}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={cn(
                              "flex items-center gap-3 w-full px-3 py-2 text-left transition-colors cursor-pointer",
                              isSelected ? "bg-[#eaf2ff]" : "hover:bg-[#F1F3F6]"
                            )}
                            role="option"
                            aria-selected={isSelected}
                          >
                            {/* Product Thumbnail */}
                            <div className="relative w-11 h-11 bg-white rounded-xs border border-[#F0F0F0] shrink-0 overflow-hidden flex items-center justify-center p-1">
                              <Image
                                src={product.thumbnail || product.images[0] || "/placeholder-product.svg"}
                                alt={product.title}
                                fill
                                sizes="44px"
                                className="object-contain p-0.5"
                              />
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs sm:text-sm font-medium text-[#212121] truncate leading-tight">
                                {product.title}
                              </h4>
                              <p className="text-[11px] text-[#878787] truncate">
                                in <span className="text-[#2874F0]">{product.categoryName}</span> · {product.brandName}
                              </p>
                            </div>

                            {/* Price */}
                            <div className="text-right shrink-0">
                              <div className="text-xs sm:text-sm font-bold text-[#212121]">
                                {formatPrice(product.price)}
                              </div>
                              {product.discountPercentage > 0 && (
                                <div className="text-[10px] font-semibold text-[#388E3C]">
                                  {product.discountPercentage}% off
                                </div>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* View All Results Button */}
              <button
                type="button"
                onClick={() => executeSearch(query)}
                className="flex items-center justify-between w-full px-4 py-2.5 bg-[#F9FAFB] hover:bg-[#eaf2ff] border-t border-[#F0F0F0] text-xs font-semibold text-[#2874F0] transition-colors"
              >
                <span>View all search results for &quot;{query}&quot;</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            /* No Results Found State */
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[#FFF3ED] text-[#FB641B] flex items-center justify-center mx-auto mb-2">
                <Search size={22} />
              </div>
              <p className="text-sm font-bold text-[#212121]">
                No products found for &quot;{query}&quot;
              </p>
              <p className="text-xs text-[#878787] mt-1 max-w-xs mx-auto">
                Check your spelling or try popular categories below:
              </p>

              {/* Popular Search Suggestions */}
              <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                {["iPhone 15", "Sony Headphones", "boAt", "Puma Shoes", "Smart TV"].map(
                  (popular) => (
                    <button
                      key={popular}
                      type="button"
                      onClick={() => {
                        setQuery(popular);
                        executeSearch(popular);
                      }}
                      className="px-2.5 py-1 bg-[#F1F3F6] hover:bg-[#2874F0] hover:text-white rounded-full text-xs font-medium text-[#212121] transition-colors flex items-center gap-1"
                    >
                      <Sparkles size={11} className="text-[#FF9F00]" />
                      {popular}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
