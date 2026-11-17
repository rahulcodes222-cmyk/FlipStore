/**
 * Product Service
 * Encapsulates all product operations with a Promise-based API.
 * Connects to backend APIs under /api/v1/products.
 */

import { Product, ProductFilterParams, PaginatedResponse, Review } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function getApiBase(): string {
  if (API_BASE) return API_BASE.replace(/\/$/, "");
  if (typeof window !== "undefined") return "";
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

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
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.category) params.set("category", filters.category);
    if (filters.brand) params.set("brand", filters.brand);
    if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
    if (filters.minRating !== undefined) params.set("minRating", String(filters.minRating));
    if (filters.minDiscount !== undefined) params.set("minDiscount", String(filters.minDiscount));
    if (filters.isAssured !== undefined) params.set("isAssured", String(filters.isAssured));
    if (filters.inStock !== undefined) params.set("stock", filters.inStock ? "IN_STOCK" : "OUT_OF_STOCK");
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.limit) params.set("limit", String(filters.limit));

    try {
      const res = await fetch(`${getApiBase()}/api/v1/products?${params.toString()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({} as any));
        return {
          data: (data.data || []).map(mapBackendProductToFrontend),
          total: data.meta?.total || 0,
          page: data.meta?.page || 1,
          totalPages: data.meta?.totalPages || 1,
          hasMore: data.meta?.hasMore ?? false,
        };
      }
    } catch {}

    // Server-side fallback: read directly from DB/service to avoid self-fetch issues in RSC/prerender.
    if (typeof window === "undefined") {
      try {
        const { connectDB } = await import("@/backend/config/db");
        await connectDB();
        const { getProducts: getProductsBackend } = await import("@/backend/services/productService");
        const result = await getProductsBackend({
          search: filters.search,
          category: filters.category,
          brand: filters.brand,
          status: undefined,
          stock: filters.inStock === undefined ? undefined : (filters.inStock ? 'IN_STOCK' : 'OUT_OF_STOCK'),
          sortBy: filters.sortBy as any,
          page: String(filters.page || 1),
          limit: String(filters.limit || 20),
          isAssured: filters.isAssured,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          minRating: filters.minRating,
          minDiscount: filters.minDiscount,
          inStock: filters.inStock,
        } as any);
        return {
          data: (result.data || []).map((p: any) => mapBackendProductToFrontend({
            id: p.id || p._id?.toString?.(),
            name: p.name,
            slug: p.slug,
            sku: p.sku,
            barcode: p.barcode || '',
            category: p.category,
            categoryId: p.categoryId?.toString?.() || p.categoryId || '',
            categorySlug: String(p.category || '').toLowerCase().replace(/\s+/g, '-'),
            brand: p.brand || '',
            brandId: p.brandId?.toString?.() || p.brandId || '',
            description: p.description,
            shortDescription: p.shortDescription || '',
            highlights: p.highlights || [],
            specifications: p.specifications || {},
            price: p.price,
            mrp: p.mrp,
            discountPercentage: p.discountPercentage,
            rating: p.rating || 0,
            reviewCount: p.reviewCount || 0,
            images: p.images || [],
            stock: p.stock,
            inStock: (p.stock || 0) > 0,
            isAssured: !!p.isAssured,
            isFreeDelivery: !!p.isFreeDelivery,
            estimatedDeliveryDays: p.estimatedDeliveryDays || 3,
            sellerId: p.sellerId?.toString?.() || p.sellerId || '',
            seller: 'Store',
            createdAt: p.createdAt,
          })),
          total: result.total || 0,
          page: result.page || 1,
          totalPages: result.totalPages || 1,
          hasMore: result.hasMore ?? false,
        };
      } catch {}
    }
    return { data: [], total: 0, page: 1, totalPages: 1, hasMore: false };
  },

  /**
   * Fetch a single product by its unique ID.
   * Calls GET /api/v1/products/:id.
   */
  async getProductById(id: string): Promise<Product | null> {
    try {
      const res = await fetch(`${getApiBase()}/api/v1/products/${id}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
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
    try {
      const res = await fetch(
        `${getApiBase()}/api/v1/products?slug=${encodeURIComponent(slug)}`,
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
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
    try {
      const res = await fetch(`${getApiBase()}/api/v1/products/${productId}/reviews`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result?.success) return [];
      const reviews = Array.isArray(result?.data?.reviews) ? result.data.reviews : [];
      return reviews as Review[];
    } catch {
      return [];
    }
  },

  /**
   * Submit a customer review for a product.
   */
  async createProductReview(
    productId: string,
    payload: { rating: number; title: string; comment: string; images?: string[] },
  ): Promise<{ success: boolean; review?: Review; message?: string; details?: Record<string, string[]> }> {
    try {
      const res = await fetch(`${getApiBase()}/api/v1/products/${productId}/reviews`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result?.success) {
        return {
          success: false,
          message: result?.message || "Failed to submit review.",
          details: result?.error?.details,
        };
      }
      return {
        success: true,
        review: result?.data?.review as Review | undefined,
        message: result?.message,
      };
    } catch {
      return { success: false, message: "Failed to submit review. Please try again." };
    }
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
