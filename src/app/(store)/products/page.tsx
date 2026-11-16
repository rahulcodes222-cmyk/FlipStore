import React, { Suspense } from "react";
import type { Metadata } from "next";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import type { ProductFilterParams } from "@/types";
import { ProductListingClient } from "@/components/products";
import { Skeleton } from "@/components/common/Skeleton";

export const metadata: Metadata = {
  title: "All Products - Buy Online at Best Prices | FlipStore India",
  description:
    "Explore our complete catalog of electronics, mobiles, fashion, home essentials, and more. Filter by brand, price, rating, and discount.",
};

function ProductsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-full rounded-sm" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <Skeleton className="hidden lg:block h-[500px] w-full rounded-sm" />
        <div className="lg:col-span-3 space-y-4">
          <Skeleton className="h-12 w-full rounded-sm" />
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-72 w-full rounded-sm" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProductsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const sp = (await searchParams) as Record<string, string>;
  const filters: ProductFilterParams = {};
  if (sp.search) filters.search = sp.search;
  if (sp.category) filters.category = sp.category;
  if (sp.brand) filters.brand = sp.brand;
  if (sp.minPrice) filters.minPrice = Number(sp.minPrice);
  if (sp.maxPrice) filters.maxPrice = Number(sp.maxPrice);
  if (sp.minRating !== undefined) filters.minRating = Number(sp.minRating);
  if (sp.inStock !== undefined) filters.inStock = sp.inStock === 'true';
  if (sp.sortBy) filters.sortBy = sp.sortBy as ProductFilterParams['sortBy'];
  if (sp.page) filters.page = Number(sp.page);
  if (sp.limit) filters.limit = Number(sp.limit);

  const [{ data: products }, categories] = await Promise.all([
    productService.getProducts(filters),
    categoryService.getCategories(),
  ]);

  return (
    <div className="max-w-[1280px] mx-auto px-3 sm:px-4 py-6">
      <Suspense fallback={<ProductsLoadingSkeleton />}>
        <ProductListingClient
          initialProducts={products}
          categories={categories}
          pageTitle="All Products"
          pageDescription="Browse authentic products from top brands with assured quality and fast delivery."
        />
      </Suspense>
    </div>
  );
}
