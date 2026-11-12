import { Product, WishlistItem } from "@/types";

const WISHLIST_STORAGE_KEY = "my_ecommerce_wishlist_v1";

export const wishlistService = {
  /**
   * Get all wishlist items
   */
  async getWishlist(): Promise<WishlistItem[]> {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to read wishlist from localStorage", e);
      return [];
    }
  },

  /**
   * Save wishlist
   */
  async saveWishlist(items: WishlistItem[]): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save wishlist to localStorage", e);
    }
  },

  /**
   * Add a product to wishlist
   */
  async addToWishlist(product: Product): Promise<WishlistItem[]> {
    const items = await this.getWishlist();
    const exists = items.some((i) => i.productId === product.id);

    if (!exists) {
      items.push({
        id: `wish-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: product.id,
        product,
        addedAt: new Date().toISOString(),
      });
      await this.saveWishlist(items);
    }

    return items;
  },

  /**
   * Remove product from wishlist
   */
  async removeFromWishlist(productId: string): Promise<WishlistItem[]> {
    const items = await this.getWishlist();
    const filtered = items.filter((i) => i.productId !== productId);
    await this.saveWishlist(filtered);
    return filtered;
  },

  /**
   * Check if a product is currently in wishlist
   */
  async isInWishlist(productId: string): Promise<boolean> {
    const items = await this.getWishlist();
    return items.some((i) => i.productId === productId);
  },

  /**
   * Clear entire wishlist
   */
  async clearWishlist(): Promise<void> {
    if (typeof window === "undefined") return;
    localStorage.removeItem(WISHLIST_STORAGE_KEY);
  },
};
