import React, { Suspense } from "react";
import { productService } from "@/services/productService";
import { Skeleton } from "@/components/common/Skeleton";
import { CategoryProductExplorer } from "@/components/category/CategoryProductExplorer";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export const metadata = {
  title: "Search Results | FlipStore India",
  description: "Browse search results with live filters and best prices.",
};

async function SearchResults({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  const response = query
    ? await productService.getProducts({ search: query, limit: 50 })
    : { data: [], total: 0 };

  const products = response.data;

  return (
    <CategoryProductExplorer
      products={products}
      title={query ? `Search Results for "${query}"` : "All Products"}
      subtitle={
        products.length > 0
          ? `${products.length} products found in FlipStore catalog`
          : "Try searching with broader terms or check spelling"
      }
    />
  );
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <div className="max-w-[1280px] mx-auto px-3 sm:px-4 py-6">
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-sm" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-sm" />
              ))}
            </div>
          </div>
        }
      >
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
