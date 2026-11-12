import { MOCK_CATEGORIES } from "@/data";
import { Category } from "@/types";

/**
 * Category Service
 * Provides access to categories and navigation taxonomy
 */
export const categoryService = {
  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    return [...MOCK_CATEGORIES];
  },

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const category = MOCK_CATEGORIES.find((c) => c.slug.toLowerCase() === slug.toLowerCase());
    return category || null;
  },

  /**
   * Get featured categories (for header navigation and homepage circles)
   */
  async getFeaturedCategories(): Promise<Category[]> {
    return MOCK_CATEGORIES.filter((c) => c.isFeatured);
  },
};
