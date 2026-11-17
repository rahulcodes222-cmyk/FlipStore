import React from "react";
import { categoryService } from "@/services/categoryService";
import { productService } from "@/services/productService";
import { EmptyState } from "@/components/common/EmptyState";
import { CategoryProductExplorer } from "@/components/category/CategoryProductExplorer";

export const instant = false;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

function normCat(v: any) {
  return String(v || "").toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function matchesCategory(product: any, category: { id?: string; slug?: string; name?: string } | null | undefined) {
  if (!category) return false;
  const catId = String((category as any).id || "").trim();
  const catSlug = normCat((category as any).slug);
  const catName = normCat((category as any).name);
  const pId = String(product?.categoryId || "").trim();
  const pSlug = normCat(product?.categorySlug);
  const pName = normCat(product?.categoryName || product?.category);
  if (catId && pId && catId === pId) return true;
  if (catSlug && pSlug && catSlug === pSlug) return true;
  if (catName && pName && catName === pName) return true;
  // strict fallback: category token/name containment both ways only when meaningful
  if (catSlug && pSlug && (pSlug === catSlug || pSlug.startsWith(`${catSlug}-`) || catSlug.startsWith(`${pSlug}-`))) return true;
  if (catName && pName && (pName === catName || pName.includes(catName) || catName.includes(pName))) return true;
  return false;
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
    products = (res.data || []).filter((p: any) => matchesCategory(p, category));
  }
  if (!products.length) {
    // final fallback: broad fetch and strict client-side category match
    const all = await productService.getProducts({ limit: 200, sortBy: "newest" } as any);
    products = (all.data || []).filter((p: any) => matchesCategory(p, category));
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
