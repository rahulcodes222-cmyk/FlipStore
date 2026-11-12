import React from "react";
import { categoryService } from "@/services/categoryService";
import { productService } from "@/services/productService";
import { EmptyState } from "@/components/common/EmptyState";
import { CategoryProductExplorer } from "@/components/category/CategoryProductExplorer";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const categories = await categoryService.getCategories();
  return categories.map((cat) => ({ slug: cat.slug }));
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

  const response = await productService.getProducts({ category: category.slug, limit: 50 });
  const products = response.data;

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
