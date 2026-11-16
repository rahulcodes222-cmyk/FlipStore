import React, { Suspense } from "react";
import type { Metadata } from "next";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { ProductDetailsView } from "@/components/product/ProductDetailsView";
import { ProductListingClient } from "@/components/products";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  // Fallback slugs for build time when API is not available
  return [
    { slug: 'samsung-galaxy-s24-5g-256gb' },
    { slug: 'electronics' },
    { slug: 'fashion-apparel' },
    { slug: 'home-kitchen' },
    { slug: 'all-products' },
  ];
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await productService.getProductBySlug(slug);
  if (!product) return { title: "Product Not Found | FlipStore" };

  return {
    title: `${product.title} - Best Price Online | FlipStore`,
    description: product.shortDescription || product.description.slice(0, 160),
  };
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await productService.getProductBySlug(slug);

  if (!product) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-12">
        <EmptyState
          preset="search"
          title="Product Not Found"
          description="The product you are looking for is no longer available or the link may be invalid."
          actionText="Browse Categories"
          actionHref="/"
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-3 sm:px-4 py-6">
      <ProductDetailsView product={product} />
    </div>
  );
}
