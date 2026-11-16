/**
 * Product Service
 * Encapsulates all product operations with a Promise-based API.
 * Connects to backend APIs under /api/v1/products.
 */

import { Product, ProductFilterParams, PaginatedResponse, Review } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Map backend product document to frontend Product type.
 */
function mapBackendProductToFrontend(item: any): Product { // eslint-disable-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const primaryImage = item.images?.find((img: Record<string, unknown>) => img.isPrimary) || item.images?.[0];
  return {
    id: item.id,
    title: item.name,
    slug: item.slug,
    brandId: item.brandId || "",
    brandName: item.brand || "",
    categoryId: item.categoryId || "",
    categoryName: item.category,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    categorySlug: item.categorySlug || item.category.toLowerCase().replace(/\s+/g, "-"),
    description: item.description,
    shortDescription: item.shortDescription || "",
    highlights: item.highlights || [],
    specifications: item.specifications || {},
    price: item.price,
    mrp: item.mrp,
    discountPercentage: item.discountPercentage,
    rating: item.rating || 0,
    ratingCount: item.reviewCount || 0,
    reviewCount: item.reviewCount || 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    images: item.images?.map((img: Record<string, unknown>) => img.url) || [],
    thumbnail: primaryImage?.url || "",
    stock: item.stock,
    inStock: item.inStock ?? item.stock > 0,
    isAssured: item.isAssured ?? false,
    isFreeDelivery: item.isFreeDelivery ?? false,
    estimatedDeliveryDays: item.estimatedDeliveryDays || 3,
    seller: {
      id: item.sellerId || "",
      name: item.seller || "Seller",
      rating: item.rating || 0,
    },
    tags: [],
    variants: item.variants?.map((v: Record<string, unknown>) => ({
      color: v.color ? [v.color] : [],
      size: v.size ? [v.size] : [],
    })),
    createdAt: item.createdAt,
  };
}

/**
 * Product Service
 */
export const productService = {
  /**
   * Fetch products with optional filtering, sorting, and pagination.
   * Calls GET /api/v1/products.
   */
  async getProducts(filters: ProductFilterParams = {}): Promise<PaginatedResponse<Product>> {
    if (!API_BASE) {
      return { data: [], total: 0, page: 1, totalPages: 1, hasMore: false };
    }
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.category) params.set("category", filters.category);
    if (filters.brand) params.set("brand", filters.brand);
    if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
    if (filters.minRating !== undefined) params.set("minRating", String(filters.minRating));
    if (filters.minDiscount !== undefined) params.set("minDiscount", String(filters.minDiscount));
    if (filters.inStock !== undefined) params.set("stock", filters.inStock ? "IN_STOCK" : "OUT_OF_STOCK");
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.limit) params.set("limit", String(filters.limit));

    try {
      const res = await fetch(`${API_BASE}/api/v1/products?${params.toString()}`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        return { data: [], total: 0, page: 1, totalPages: 1, hasMore: false };
      }

      const data = await res.json();
      return {
        data: (data.data || []).map(mapBackendProductToFrontend),
        total: data.meta?.total || 0,
        page: data.meta?.page || 1,
        totalPages: data.meta?.totalPages || 1,
        hasMore: data.meta?.hasMore ?? false,
      };
    } catch {
      return { data: [], total: 0, page: 1, totalPages: 1, hasMore: false };
    }
  },

  /**
   * Fetch a single product by its unique ID.
   * Calls GET /api/v1/products/:id.
   */
  async getProductById(id: string): Promise<Product | null> {
    if (!API_BASE) {
      return null;
    }
    try {
      const res = await fetch(`${API_BASE}/api/v1/products/${id}`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 404) return null;
        return null;
      }

      const data = await res.json();
      return mapBackendProductToFrontend(data.data);
    } catch {
      return null;
    }
  },

  /**
   * Fetch a single product by its URL slug.
   * Calls GET /api/v1/products?slug=...
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    if (!API_BASE) {
      return null;
    }
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/products?slug=${encodeURIComponent(slug)}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      if (!res.ok) {
        if (res.status === 404) return null;
        return null;
      }

      const data = await res.json();
      return mapBackendProductToFrontend(data.data);
    } catch {
      return null;
    }
  },

  /**
   * Fetch featured/top products.
   */
  async getFeaturedProducts(limit = 6): Promise<Product[]> {
    const result = await this.getProducts({
      isAssured: true,
      limit,
      sortBy: "rating",
    });
    return result.data;
  },

  /**
   * Get "Deal of the Day" high discount products.
   */
  async getDealsOfTheDay(limit = 5): Promise<Product[]> {
    const result = await this.getProducts({
      limit,
      sortBy: "discount",
    });
    return result.data;
  },

  /**
   * Get trending products.
   */
  async getTrendingProducts(limit = 5): Promise<Product[]> {
    const result = await this.getProducts({
      limit,
      sortBy: "popularity",
    });
    return result.data;
  },

  /**
   * Get best selling products.
   */
  async getBestSellingProducts(limit = 5): Promise<Product[]> {
    const result = await this.getProducts({
      limit,
      sortBy: "popularity",
    });
    return result.data;
  },

  /**
   * Get home and lifestyle products.
   */
  async getHomeLifestyleProducts(limit = 5): Promise<Product[]> {
    const result = await this.getProducts({
      category: "home-kitchen",
      limit,
      sortBy: "newest",
    });
    return result.data;
  },

  /**
   * Get related products based on category or brand.
   */
  async getRelatedProducts(productId: string, limit = 5): Promise<Product[]> {
    const result = await this.getProducts({
      limit: limit + 1,
      sortBy: "newest",
    });
    return result.data.filter((p) => p.id !== productId).slice(0, limit);
  },

  /**
   * Fetch reviews for a specific product.
   */
  async getProductReviews(productId: string): Promise<Review[]> {
    // Reviews are fetched via a separate endpoint in a future part
    return [];
  },

  /**
   * Live autocomplete suggestions.
   */
  async getLiveSuggestions(query: string, limit = 5): Promise<{
    products: Product[];
    categories: { name: string; slug: string }[];
    brands: { name: string; slug: string }[];
  }> {
    const result = await this.getProducts({
      search: query,
      limit,
    });
    return {
      products: result.data,
      categories: [],
      brands: [],
    };
  },
};
