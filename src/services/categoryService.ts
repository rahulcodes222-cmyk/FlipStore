/**
 * Category Service
 * Provides access to categories and navigation taxonomy.
 * Connects to backend APIs under /api/v1/categories.
 */

import { Category } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Map backend category document to frontend Category type.
 */
function mapBackendCategoryToFrontend(item: any): Category { // eslint-disable-line @typescript-eslint/no-explicit-any
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description || "",
    image: item.image || "",
    icon: item.icon,
    parentId: item.parentId || null,
    itemCount: item.itemCount || 0,
    isFeatured: item.isFeatured ?? false,
  };
}

/**
 * Category Service
 */
export const categoryService = {
  /**
   * Get all categories.
   */
  async getCategories(): Promise<Category[]> {
    if (!API_BASE) {
      // Fallback categories for build time / development without backend
      return [
        {
          id: "1",
          name: "Electronics",
          slug: "electronics",
          description: "Electronic devices and accessories",
          image: "",
          icon: "",
          parentId: null,
          itemCount: 0,
          isFeatured: true,
        },
        {
          id: "2",
          name: "Fashion & Apparel",
          slug: "fashion-apparel",
          description: "Clothing and fashion accessories",
          image: "",
          icon: "",
          parentId: null,
          itemCount: 0,
          isFeatured: true,
        },
        {
          id: "3",
          name: "Home & Kitchen",
          slug: "home-kitchen",
          description: "Home appliances and kitchen essentials",
          image: "",
          icon: "",
          parentId: null,
          itemCount: 0,
          isFeatured: false,
        },
      ];
    }
    try {
      const res = await fetch(`${API_BASE}/api/v1/categories`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        return [];
      }

      const data = await res.json();
      return (data.data || []).map(mapBackendCategoryToFrontend);
    } catch {
      return [];
    }
  },

  /**
   * Get category by slug.
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const categories = await this.getCategories();
    return categories.find((c) => c.slug === slug) || null;
  },

  /**
   * Get featured categories.
   */
  async getFeaturedCategories(): Promise<Category[]> {
    const categories = await this.getCategories();
    return categories.filter((c) => c.isFeatured);
  },
};
