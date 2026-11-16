/**
 * Category Service
 * Provides access to categories and navigation taxonomy.
 * Connects to backend APIs under /api/v1/categories.
 */

import { Category } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function getApiBase(): string {
  if (API_BASE) return API_BASE.replace(/\/$/, "");
  if (typeof window !== "undefined") return "";
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

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
    const fallback: Category[] = [
      { id: "1", name: "Electronics", slug: "electronics", description: "Electronic devices and accessories", image: "", icon: "", parentId: null, itemCount: 0, isFeatured: true },
      { id: "2", name: "Fashion & Apparel", slug: "fashion-apparel", description: "Clothing and fashion accessories", image: "", icon: "", parentId: null, itemCount: 0, isFeatured: true },
      { id: "3", name: "Home & Kitchen", slug: "home-kitchen", description: "Home appliances and kitchen essentials", image: "", icon: "", parentId: null, itemCount: 0, isFeatured: false },
    ];
    try {
      const res = await fetch(`${getApiBase()}/api/v1/categories`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({} as any));
        const list = (data?.data || []).map(mapBackendCategoryToFrontend);
        if (list.length) return list;
      }
    } catch {}

    // Server-side fallback: direct DB read
    if (typeof window === "undefined") {
      try {
        const { connectDB } = await import("@/backend/config/db");
        await connectDB();
        const { CategoryModel } = await import("@/backend/models");
        const docs = await CategoryModel.find({}).sort({ name: 1 }).lean().exec();
        const list = (docs || []).map((c: any) => ({
          id: String(c._id || c.id),
          name: c.name,
          slug: c.slug,
          description: c.description || "",
          image: c.image || "",
          icon: c.icon || "",
          parentId: c.parentId ? String(c.parentId) : null,
          itemCount: c.itemCount || 0,
          isFeatured: !!c.isFeatured,
        })) as Category[];
        if (list.length) return list;
      } catch {}
    }
    return fallback;
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
