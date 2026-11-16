import React from "react";
import { categoryService } from "@/services/categoryService";
import { productService } from "@/services/productService";
import { EmptyState } from "@/components/common/EmptyState";
import { CategoryProductExplorer } from "@/components/category/CategoryProductExplorer";

export const instant = false;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await categoryService.getCategoryBySlug(slug);
  if (!category) return { title: "Category Not Found | FlipStore" };

  return {
    title: `${category.name} - Buy ${category.name} Online at Best Prices | FlipStore`,
    description: category.description,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await categoryService.getCategoryBySlug(slug);

  if (!category) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-8">
        <EmptyState
          preset="search"
          title={`Category "${slug}" not found`}
          description="The category you're looking for might have been moved or updated."
          actionText="Back to Home"
          actionHref="/"
        />
      </div>
    );
  }

  let products: any[] = [];
  const keys = Array.from(
    new Set([category.slug, category.name, (category as any).id].filter(Boolean).map((v) => String(v).trim()))
  );
  for (const key of keys) {
    if (products.length) break;
    const res = await productService.getProducts({ category: key, limit: 50 } as any);
    products = res.data || [];
  }
  if (!products.length) {
    // final fallback: broad fetch and client-side filter by category name/slug
    const all = await productService.getProducts({ limit: 200, sortBy: "newest" } as any);
    const norm = (s: any) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const catNorm = norm(`${category.slug || ""} ${category.name || ""}`);
    const catTokens = catNorm.split(/\s+/).filter((t) => t.length > 2);
    products = (all.data || []).filter((p: any) => {
      const pNorm = norm(`${p.categorySlug || ""} ${p.categoryName || ""} ${p.category || ""} ${p.categoryId || ""}`);
      if (!pNorm || !catNorm) return false;
      if (pNorm === catNorm || pNorm.includes(catNorm) || catNorm.includes(pNorm)) return true;
      return catTokens.some((t) => pNorm.includes(t));
    });
  }

  return (
    <div className="max-w-[1280px] mx-auto px-3 sm:px-4 py-6">
      <CategoryProductExplorer
        products={products}
        title={category.name}
        subtitle={category.description}
      />
    </div>
  );
}
