import { MOCK_PRODUCTS, MOCK_REVIEWS } from "@/data";
import { Product, ProductFilterParams, PaginatedResponse, Review } from "@/types";

/**
 * Product Service
 * Encapsulates all product operations with a Promise-based API
 * Ready for drop-in replacement with REST/GraphQL backend
 */
export const productService = {
  /**
   * Fetch products with optional filtering, sorting, and pagination
   */
  async getProducts(filters: ProductFilterParams = {}): Promise<PaginatedResponse<Product>> {
    let result = [...MOCK_PRODUCTS];

    // Filter by Category
    if (filters.category) {
      result = result.filter(
        (p) =>
          p.categorySlug.toLowerCase() === filters.category?.toLowerCase() ||
          p.categoryId.toLowerCase() === filters.category?.toLowerCase()
      );
    }

    // Filter by Brand
    if (filters.brand) {
      result = result.filter(
        (p) =>
          p.brandId.toLowerCase() === filters.brand?.toLowerCase() ||
          p.brandName.toLowerCase() === filters.brand?.toLowerCase()
      );
    }

    // Filter by Search Query
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.brandName.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q)
      );
    }

    // Filter by Price Range
    if (filters.minPrice !== undefined) {
      result = result.filter((p) => p.price >= (filters.minPrice ?? 0));
    }
    if (filters.maxPrice !== undefined) {
      result = result.filter((p) => p.price <= (filters.maxPrice ?? Infinity));
    }

    // Filter by Rating
    if (filters.minRating !== undefined) {
      result = result.filter((p) => p.rating >= (filters.minRating ?? 0));
    }

    // Filter by Minimum Discount
    if (filters.minDiscount !== undefined) {
      result = result.filter((p) => p.discountPercentage >= (filters.minDiscount ?? 0));
    }

    // Filter by Assured
    if (filters.isAssured) {
      result = result.filter((p) => p.isAssured);
    }

    // Filter by Stock
    if (filters.inStock) {
      result = result.filter((p) => p.inStock);
    }

    // Sorting
    switch (filters.sortBy) {
      case "price_asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "discount":
        result.sort((a, b) => b.discountPercentage - a.discountPercentage);
        break;
      case "newest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "popularity":
      default:
        result.sort((a, b) => b.ratingCount - a.ratingCount);
        break;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const total = result.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedData = result.slice(start, start + limit);

    return {
      data: paginatedData,
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    };
  },

  /**
   * Fetch a single product by its unique ID
   */
  async getProductById(id: string): Promise<Product | null> {
    const product = MOCK_PRODUCTS.find((p) => p.id === id);
    return product || null;
  },

  /**
   * Fetch a single product by its URL slug
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    const product = MOCK_PRODUCTS.find((p) => p.slug === slug);
    return product || null;
  },

  /**
   * Get featured/top products
   */
  async getFeaturedProducts(limit = 6): Promise<Product[]> {
    return MOCK_PRODUCTS.filter((p) => p.isAssured || p.rating >= 4.5).slice(0, limit);
  },

  /**
   * Get "Deal of the Day" high discount products
   */
  async getDealsOfTheDay(limit = 5): Promise<Product[]> {
    return [...MOCK_PRODUCTS]
      .sort((a, b) => b.discountPercentage - a.discountPercentage)
      .slice(0, limit);
  },

  /**
   * Get trending products (high interest and popular tags)
   */
  async getTrendingProducts(limit = 5): Promise<Product[]> {
    return MOCK_PRODUCTS.filter(
      (p) => p.tags?.some((t) => /trending|hot deal|galaxy ai|popular/i.test(t)) || p.rating >= 4.4
    ).slice(0, limit);
  },

  /**
   * Get best selling products
   */
  async getBestSellingProducts(limit = 5): Promise<Product[]> {
    return MOCK_PRODUCTS.filter(
      (p) => p.tags?.some((t) => /bestseller|audiophile|top/i.test(t)) || p.ratingCount > 20000
    ).slice(0, limit);
  },

  /**
   * Get home and lifestyle products
   */
  async getHomeLifestyleProducts(limit = 5): Promise<Product[]> {
    return MOCK_PRODUCTS.filter(
      (p) =>
        p.categorySlug === "home-furniture" ||
        p.categorySlug === "appliances" ||
        p.categorySlug === "beauty"
    ).slice(0, limit);
  },

  /**
   * Get related products based on category or brand
   */
  async getRelatedProducts(productId: string, limit = 4): Promise<Product[]> {
    const current = MOCK_PRODUCTS.find((p) => p.id === productId);
    if (!current) return [];

    return MOCK_PRODUCTS.filter(
      (p) => p.id !== productId && (p.categoryId === current.categoryId || p.brandId === current.brandId)
    ).slice(0, limit);
  },

  /**
   * Fetch reviews for a specific product
   */
  async getProductReviews(productId: string): Promise<Review[]> {
    return MOCK_REVIEWS.filter((r) => r.productId === productId);
  },

  /**
   * Live autocomplete suggestions with product thumbnails, matching brands and categories
   */
  async getLiveSuggestions(query: string, limit = 5): Promise<{
    products: Product[];
    categories: { name: string; slug: string }[];
    brands: { name: string; slug: string }[];
  }> {
    const q = query.toLowerCase().trim();
    if (!q) {
      return { products: [], categories: [], brands: [] };
    }

    // 1. Matching products (by name, brand, category, tags)
    const matchedProducts = MOCK_PRODUCTS.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.brandName.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
    ).slice(0, limit);

    // 2. Matching categories
    const categoriesMap = new Map<string, string>();
    MOCK_PRODUCTS.forEach((p) => {
      if (p.categoryName.toLowerCase().includes(q) || p.categorySlug.toLowerCase().includes(q)) {
        categoriesMap.set(p.categorySlug, p.categoryName);
      }
    });
    const matchedCategories = Array.from(categoriesMap.entries()).map(([slug, name]) => ({
      slug,
      name,
    }));

    // 3. Matching brands
    const brandsMap = new Map<string, string>();
    MOCK_PRODUCTS.forEach((p) => {
      if (p.brandName.toLowerCase().includes(q)) {
        brandsMap.set(p.brandId, p.brandName);
      }
    });
    const matchedBrands = Array.from(brandsMap.entries()).map(([slug, name]) => ({
      slug,
      name,
    }));

    return {
      products: matchedProducts,
      categories: matchedCategories.slice(0, 3),
      brands: matchedBrands.slice(0, 3),
    };
  },
};
