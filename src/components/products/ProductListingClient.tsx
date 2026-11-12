"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Product, Category } from "@/types";
import { ProductCard } from "@/components/common/ProductCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ProductFilterSidebar, FilterState } from "./ProductFilterSidebar";
import { ProductSortBar, SortOption } from "./ProductSortBar";
import { ActiveFilterChips } from "./ActiveFilterChips";
import { ProductPagination } from "./ProductPagination";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 8; // 8 items per page to nicely demonstrate pagination with 15+ products

interface ProductListingClientProps {
  initialProducts: Product[];
  categories: Category[];
  pageTitle: string;
  pageDescription?: string;
  currentCategorySlug?: string;
}

export function ProductListingClient({
  initialProducts,
  categories,
  pageTitle,
  pageDescription,
  currentCategorySlug,
}: ProductListingClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Derive state directly from URL search parameters (Single Source of Truth)
  const filters: FilterState = useMemo(() => {
    const categoryParam = currentCategorySlug || searchParams.get("category") || undefined;
    const brandsParam = searchParams.get("brand");
    const brands = brandsParam ? brandsParam.split(",").filter(Boolean) : [];

    const priceRangeParam = searchParams.get("priceRange") || undefined;
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const ratingParam = searchParams.get("rating");
    const discountParam = searchParams.get("discount");
    const inStockParam = searchParams.get("inStock");

    return {
      category: categoryParam,
      brands,
      priceRange: priceRangeParam,
      minPrice: minPriceParam ? parseInt(minPriceParam, 10) : undefined,
      maxPrice: maxPriceParam ? parseInt(maxPriceParam, 10) : undefined,
      minRating: ratingParam ? parseInt(ratingParam, 10) : undefined,
      minDiscount: discountParam ? parseInt(discountParam, 10) : undefined,
      inStockOnly: inStockParam === "true",
    };
  }, [searchParams, currentCategorySlug]);

  const currentSort: SortOption =
    (searchParams.get("sort") as SortOption) || "popularity";
  const currentPage: number =
    parseInt(searchParams.get("page") || "1", 10) || 1;
  const urlSearchQuery: string = searchParams.get("q") || "";

  // State for typing in search input, synchronized with URL query
  const [prevQuery, setPrevQuery] = useState<string>(urlSearchQuery);
  const [searchInput, setSearchInput] = useState<string>(urlSearchQuery);

  if (prevQuery !== urlSearchQuery) {
    setPrevQuery(urlSearchQuery);
    setSearchInput(urlSearchQuery);
  }

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Update URL search parameters when filters, sort, search, or page changes
  const updateUrl = useCallback(
    (
      newFilters: FilterState,
      newSort: SortOption,
      newPage: number,
      newSearch: string
    ) => {
      const params = new URLSearchParams();

      if (!currentCategorySlug && newFilters.category) {
        params.set("category", newFilters.category);
      }
      if (newFilters.brands.length > 0) {
        params.set("brand", newFilters.brands.join(","));
      }
      if (newFilters.priceRange) {
        params.set("priceRange", newFilters.priceRange);
      }
      if (newFilters.minPrice !== undefined) {
        params.set("minPrice", newFilters.minPrice.toString());
      }
      if (newFilters.maxPrice !== undefined) {
        params.set("maxPrice", newFilters.maxPrice.toString());
      }
      if (newFilters.minRating !== undefined) {
        params.set("rating", newFilters.minRating.toString());
      }
      if (newFilters.minDiscount !== undefined) {
        params.set("discount", newFilters.minDiscount.toString());
      }
      if (newFilters.inStockOnly) {
        params.set("inStock", "true");
      }
      if (newSort !== "popularity") {
        params.set("sort", newSort);
      }
      if (newPage > 1) {
        params.set("page", newPage.toString());
      }
      if (newSearch.trim()) {
        params.set("q", newSearch.trim());
      }

      const queryString = params.toString();
      const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(targetUrl, { scroll: false });
    },
    [router, pathname, currentCategorySlug]
  );

  // Handlers
  const handleFilterChange = (newFilters: FilterState) => {
    updateUrl(newFilters, currentSort, 1, urlSearchQuery);
  };

  const handleSortChange = (newSort: SortOption) => {
    updateUrl(filters, newSort, 1, urlSearchQuery);
  };

  const handlePageChange = (newPage: number) => {
    updateUrl(filters, currentSort, newPage, urlSearchQuery);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchSubmit = (query: string) => {
    setSearchInput(query);
    updateUrl(filters, currentSort, 1, query);
  };

  const handleClearAll = () => {
    const cleared: FilterState = {
      category: currentCategorySlug || undefined,
      brands: [],
      priceRange: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
      minDiscount: undefined,
      inStockOnly: false,
    };
    setSearchInput("");
    updateUrl(cleared, currentSort, 1, "");
  };

  // Compute available brands with counts based on current category
  const availableBrands = useMemo(() => {
    const brandMap = new Map<string, number>();
    initialProducts.forEach((p) => {
      // If category filter is active, only tally brands in that category
      if (filters.category && p.categorySlug !== filters.category) return;
      brandMap.set(p.brandName, (brandMap.get(p.brandName) || 0) + 1);
    });

    return Array.from(brandMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [initialProducts, filters.category]);

  // Compute category item counts
  const categoryItemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    initialProducts.forEach((p) => {
      counts[p.categorySlug] = (counts[p.categorySlug] || 0) + 1;
    });
    return counts;
  }, [initialProducts]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      // 1. Category
      if (filters.category && product.categorySlug !== filters.category) {
        return false;
      }

      // 2. Search Query
      if (urlSearchQuery.trim()) {
        const q = urlSearchQuery.toLowerCase().trim();
        const matchesTitle = product.title.toLowerCase().includes(q);
        const matchesBrand = product.brandName.toLowerCase().includes(q);
        const matchesCategory = product.categoryName.toLowerCase().includes(q);
        const matchesDesc = product.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesBrand && !matchesCategory && !matchesDesc) {
          return false;
        }
      }

      // 3. Brand
      if (filters.brands.length > 0 && !filters.brands.includes(product.brandName)) {
        return false;
      }

      // 4. Price
      if (filters.minPrice !== undefined && product.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice !== undefined && product.price > filters.maxPrice) {
        return false;
      }

      // 5. Rating
      if (filters.minRating !== undefined && product.rating < filters.minRating) {
        return false;
      }

      // 6. Discount
      if (
        filters.minDiscount !== undefined &&
        product.discountPercentage < filters.minDiscount
      ) {
        return false;
      }

      // 7. In Stock
      if (filters.inStockOnly && !product.inStock) {
        return false;
      }

      return true;
    });
  }, [initialProducts, filters, urlSearchQuery]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    switch (currentSort) {
      case "price_asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "discount":
        list.sort((a, b) => b.discountPercentage - a.discountPercentage);
        break;
      case "newest":
        list.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "popularity":
      default:
        list.sort((a, b) => b.ratingCount - a.ratingCount);
        break;
    }
    return list;
  }, [filteredProducts, currentSort]);

  // Pagination slice
  const totalProducts = sortedProducts.length;
  const totalPages = Math.ceil(totalProducts / PAGE_SIZE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedProducts.slice(start, start + PAGE_SIZE);
  }, [sortedProducts, currentPage]);

  // Count active filters (for badge)
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (!currentCategorySlug && filters.category) count++;
    count += filters.brands.length;
    if (filters.priceRange) count++;
    if (filters.minRating) count++;
    if (filters.minDiscount) count++;
    if (filters.inStockOnly) count++;
    if (urlSearchQuery.trim()) count++;
    return count;
  }, [filters, currentCategorySlug, urlSearchQuery]);

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className="space-y-4">
      {/* Page Title & Search Header */}
      <div className="bg-white border border-[#E0E0E0] rounded-sm p-4 sm:p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#212121]">
            {pageTitle}
          </h1>
          {pageDescription && (
            <p className="text-xs sm:text-sm text-[#878787] mt-0.5">
              {pageDescription}
            </p>
          )}
        </div>

        {/* Inline Filter Search Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearchSubmit(searchInput);
          }}
          className="relative w-full sm:w-72"
        >
          <input
            type="text"
            placeholder="Search within results..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 text-xs border border-[#E0E0E0] rounded-xs focus:outline-none focus:border-[#2874F0]"
          />
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                handleSearchSubmit("");
              }}
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left Sidebar Filter (Desktop) */}
        <div className="hidden lg:block lg:col-span-1">
          <ProductFilterSidebar
            categories={categories}
            availableBrands={availableBrands}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAll}
            hasActiveFilters={hasActiveFilters}
            categoryItemCounts={categoryItemCounts}
            isCategoryFixed={Boolean(currentCategorySlug)}
          />
        </div>

        {/* Right Product Grid Column */}
        <div className="lg:col-span-3 space-y-4">
          {/* Top Sort & Summary Bar */}
          <ProductSortBar
            currentSort={currentSort}
            onSortChange={handleSortChange}
            totalProducts={totalProducts}
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            onOpenMobileFilters={() => setIsMobileDrawerOpen(true)}
            activeFiltersCount={activeFiltersCount}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* Active Filter Chips */}
          <ActiveFilterChips
            filters={filters}
            categories={categories}
            searchQuery={urlSearchQuery}
            onRemoveCategory={() => handleFilterChange({ ...filters, category: undefined })}
            onRemoveBrand={(brand) =>
              handleFilterChange({
                ...filters,
                brands: filters.brands.filter((b) => b !== brand),
              })
            }
            onRemovePrice={() =>
              handleFilterChange({
                ...filters,
                priceRange: undefined,
                minPrice: undefined,
                maxPrice: undefined,
              })
            }
            onRemoveRating={() => handleFilterChange({ ...filters, minRating: undefined })}
            onRemoveDiscount={() => handleFilterChange({ ...filters, minDiscount: undefined })}
            onRemoveStock={() => handleFilterChange({ ...filters, inStockOnly: false })}
            onRemoveSearch={() => {
              setSearchInput("");
              handleSearchSubmit("");
            }}
            onClearAll={handleClearAll}
            isCategoryFixed={Boolean(currentCategorySlug)}
          />

          {/* Product Items Grid */}
          {paginatedProducts.length > 0 ? (
            <div
              className={cn(
                "grid gap-3 sm:gap-4",
                viewMode === "grid"
                  ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1"
              )}
            >
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant={viewMode === "grid" ? "vertical" : "horizontal"}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#E0E0E0] rounded-sm p-8 shadow-2xs">
              <EmptyState
                preset="search"
                title="No matching products found"
                description="We couldn't find any products matching your selected filter criteria. Try clearing some filters or searching with different keywords."
                actionText="Reset All Filters"
                onAction={handleClearAll}
              />
            </div>
          )}

          {/* Pagination */}
          <ProductPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Mobile Filters Drawer Modal */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b border-[#F0F0F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#212121]">Filters</h3>
                {activeFiltersCount > 0 && (
                  <span className="text-[11px] bg-blue-100 text-[#2874F0] px-1.5 py-0.2 rounded-full font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1 text-gray-500 hover:text-gray-800"
                aria-label="Close filters"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Filters */}
            <div className="flex-1 overflow-y-auto">
              <ProductFilterSidebar
                categories={categories}
                availableBrands={availableBrands}
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearAll={handleClearAll}
                hasActiveFilters={hasActiveFilters}
                categoryItemCounts={categoryItemCounts}
                isCategoryFixed={Boolean(currentCategorySlug)}
                className="border-none shadow-none rounded-none"
              />
            </div>

            {/* Bottom Apply CTA */}
            <div className="p-4 border-t border-[#F0F0F0] bg-white flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="flex-1 py-2 border border-gray-300 text-[#212121] text-xs font-bold rounded-xs hover:bg-gray-50 cursor-pointer"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="flex-2 py-2 bg-[#2874F0] text-white text-xs font-bold rounded-xs hover:bg-blue-600 cursor-pointer shadow-xs"
              >
                Apply ({totalProducts} Products)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
