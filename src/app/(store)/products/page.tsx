import React, { Suspense } from "react";
import type { Metadata } from "next";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
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

export default async function ProductsPage() {
  const [{ data: products }, categories] = await Promise.all([
    productService.getProducts({ limit: 100 }),
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
