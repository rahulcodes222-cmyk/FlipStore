import React, { Suspense } from "react";
import type { Metadata } from "next";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { ProductDetailsView } from "@/components/product/ProductDetailsView";
import { ProductListingClient } from "@/components/products";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";

interface ProductOrCategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const [{ data: products }, categories] = await Promise.all([
    productService.getProducts({ limit: 100 }),
    categoryService.getCategories(),
  ]);

  return [
    ...products.map((p) => ({ slug: p.slug })),
    ...categories.map((c) => ({ slug: c.slug })),
  ];
}

export async function generateMetadata({
  params,
}: ProductOrCategoryPageProps): Promise<Metadata> {
  const { slug } = await params;

  // Check product first
  const product = await productService.getProductBySlug(slug);
  if (product) {
    return {
      title: `${product.title} - Best Price Online | FlipStore India`,
      description: product.shortDescription || product.description.slice(0, 160),
    };
  }

  // Check category
  const category = await categoryService.getCategoryBySlug(slug);
  if (category) {
    return {
      title: `${category.name} - Buy ${category.name} Online at Best Prices | FlipStore`,
      description: category.description,
    };
  }

  return {
    title: "Item Not Found | FlipStore India",
  };
}

function ProductPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E0E0E0] rounded-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full rounded-sm" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-3/4 rounded-xs" />
            <Skeleton className="h-5 w-1/4 rounded-xs" />
            <Skeleton className="h-10 w-1/2 rounded-xs" />
            <Skeleton className="h-24 w-full rounded-xs" />
            <Skeleton className="h-12 w-full rounded-xs" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function ProductsSlugPage({
  params,
}: ProductOrCategoryPageProps) {
  const { slug } = await params;

  // 1. Try to find Product matching the slug (e.g. /products/boat-airdopes-141...)
  const product = await productService.getProductBySlug(slug);
  if (product) {
    return (
      <div className="max-w-[1280px] mx-auto px-3 sm:px-4 py-6">
        <ProductDetailsView product={product} />
      </div>
    );
  }

  // 2. Try to find Category matching the slug (e.g. /products/electronics)
  const category = await categoryService.getCategoryBySlug(slug);
  if (category) {
    const [{ data: allProducts }, categories] = await Promise.all([
      productService.getProducts({ limit: 100 }),
      categoryService.getCategories(),
    ]);

    return (
      <div className="max-w-[1280px] mx-auto px-3 sm:px-4 py-6">
        <Suspense fallback={<ProductPageSkeleton />}>
          <ProductListingClient
            initialProducts={allProducts}
            categories={categories}
            currentCategorySlug={category.slug}
            pageTitle={category.name}
            pageDescription={category.description}
          />
        </Suspense>
      </div>
    );
  }

  // 3. Neither product nor category found
  return (
    <div className="max-w-[1280px] mx-auto px-4 py-12">
      <EmptyState
        preset="search"
        title="Product Not Found"
        description="The product you are looking for is no longer available or the URL may be invalid."
        actionText="Browse All Products"
        actionHref="/products"
        secondaryActionText="Go to Homepage"
        secondaryActionHref="/"
      />
    </div>
  );
}
