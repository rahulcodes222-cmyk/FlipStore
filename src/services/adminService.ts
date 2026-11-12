/**
 * adminService — Frontend-only simulated admin data service.
 *
 * ⚠️  Admin security is not real in this phase.
 * This is only a frontend demonstration.
 * All admin data operations are kept separate here for future backend integration.
 */

import {
  Product,
  Category,
  Order,
  User,
  Coupon,
  Review,
  OrderStatus,
} from "@/types";
import {
  MOCK_PRODUCTS,
  MOCK_CATEGORIES,
  MOCK_ORDERS,
  MOCK_USERS,
  MOCK_COUPONS,
  MOCK_REVIEWS,
} from "@/data";

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const STORAGE_KEYS = {
  PRODUCTS: "flipstore_admin_products_v1",
  CATEGORIES: "flipstore_admin_categories_v1",
  ORDERS: "my_ecommerce_orders_v1", // Shares with customer checkout/orders
  USERS: "flipstore_admin_customers_v1",
  COUPONS: "flipstore_admin_coupons_v1",
  REVIEWS: "flipstore_admin_reviews_v1",
  SETTINGS: "flipstore_admin_settings_v1",
};

export interface StoreSettings {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  taxPercentage: number;
  freeDeliveryThreshold: number;
  maintenanceMode: boolean;
  announcementBanner: string;
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "FlipStore India",
  supportEmail: "support@flipstore.in",
  supportPhone: "+91 1800 208 9898",
  currency: "INR",
  taxPercentage: 18,
  freeDeliveryThreshold: 500,
  maintenanceMode: false,
  announcementBanner: "Big Billion Days are Live! Enjoy up to 80% off across electronics and fashion.",
};

// ─── LocalStorage Helpers ─────────────────────────────────────────────────────
function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, data: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

// ─── Admin Service Implementation ─────────────────────────────────────────────
export const adminService = {
  // ── Products ────────────────────────────────────────────────────────────────
  async getProducts(params?: {
    query?: string;
    category?: string;
    inStockOnly?: boolean;
  }): Promise<Product[]> {
    const products = readStorage<Product[]>(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
    let filtered = [...products];

    if (params?.category && params.category !== "ALL") {
      filtered = filtered.filter(
        (p) =>
          p.categorySlug.toLowerCase() === params.category?.toLowerCase() ||
          p.categoryId.toLowerCase() === params.category?.toLowerCase()
      );
    }

    if (params?.inStockOnly) {
      filtered = filtered.filter((p) => p.inStock && p.stock > 0);
    }

    if (params?.query && params.query.trim()) {
      const q = params.query.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.brandName.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
      );
    }

    return filtered;
  },

  async getProductById(id: string): Promise<Product | null> {
    const products = await this.getProducts();
    return products.find((p) => p.id === id || p.slug === id) || null;
  },

  async createProduct(productData: Omit<Product, "id" | "createdAt">): Promise<Product> {
    const products = readStorage<Product[]>(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
    const slug = productData.slug || productData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      slug,
      createdAt: new Date().toISOString(),
    };

    const updated = [newProduct, ...products];
    writeStorage(STORAGE_KEYS.PRODUCTS, updated);
    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const products = readStorage<Product[]>(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Product not found");

    products[index] = { ...products[index], ...updates };
    writeStorage(STORAGE_KEYS.PRODUCTS, products);
    return products[index];
  },

  async deleteProduct(id: string): Promise<void> {
    const products = readStorage<Product[]>(STORAGE_KEYS.PRODUCTS, MOCK_PRODUCTS);
    const updated = products.filter((p) => p.id !== id);
    writeStorage(STORAGE_KEYS.PRODUCTS, updated);
  },

  async updateProductStock(id: string, newStock: number): Promise<Product> {
    return this.updateProduct(id, {
      stock: newStock,
      inStock: newStock > 0,
    });
  },

  // ── Categories ──────────────────────────────────────────────────────────────
  async getCategories(): Promise<Category[]> {
    return readStorage<Category[]>(STORAGE_KEYS.CATEGORIES, MOCK_CATEGORIES);
  },

  async createCategory(categoryData: Omit<Category, "id">): Promise<Category> {
    const categories = await this.getCategories();
    const slug = categoryData.slug || categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const newCategory: Category = {
      ...categoryData,
      id: `cat-${Date.now()}`,
      slug,
    };
    const updated = [...categories, newCategory];
    writeStorage(STORAGE_KEYS.CATEGORIES, updated);
    return newCategory;
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const categories = await this.getCategories();
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Category not found");

    categories[index] = { ...categories[index], ...updates };
    writeStorage(STORAGE_KEYS.CATEGORIES, categories);
    return categories[index];
  },

  async deleteCategory(id: string): Promise<void> {
    const categories = await this.getCategories();
    const updated = categories.filter((c) => c.id !== id);
    writeStorage(STORAGE_KEYS.CATEGORIES, updated);
  },

  // ── Orders ──────────────────────────────────────────────────────────────────
  async getOrders(): Promise<Order[]> {
    return readStorage<Order[]>(STORAGE_KEYS.ORDERS, MOCK_ORDERS);
  },

  async getOrderById(id: string): Promise<Order | null> {
    const orders = await this.getOrders();
    return orders.find((o) => o.id === id || o.orderNumber === id) || null;
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const orders = await this.getOrders();
    const index = orders.findIndex((o) => o.id === id || o.orderNumber === id);
    if (index === -1) throw new Error("Order not found");

    orders[index].orderStatus = status;
    if (status === "DELIVERED") {
      orders[index].deliveredAt = new Date().toISOString();
      orders[index].paymentStatus = "PAID";
    }
    writeStorage(STORAGE_KEYS.ORDERS, orders);
    return orders[index];
  },

  // ── Customers ───────────────────────────────────────────────────────────────
  async getCustomers(query?: string): Promise<User[]> {
    const users = readStorage<User[]>(STORAGE_KEYS.USERS, MOCK_USERS);
    if (!query || !query.trim()) return users;
    const q = query.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q)
    );
  },

  async getCustomerById(id: string): Promise<User | null> {
    const users = await this.getCustomers();
    return users.find((u) => u.id === id || u.email === id) || null;
  },

  // ── Coupons ─────────────────────────────────────────────────────────────────
  async getCoupons(): Promise<Coupon[]> {
    return readStorage<Coupon[]>(STORAGE_KEYS.COUPONS, MOCK_COUPONS);
  },

  async createCoupon(couponData: Omit<Coupon, "id">): Promise<Coupon> {
    const coupons = await this.getCoupons();
    const newCoupon: Coupon = {
      ...couponData,
      id: `coup-${Date.now()}`,
      code: couponData.code.toUpperCase().trim(),
    };
    const updated = [newCoupon, ...coupons];
    writeStorage(STORAGE_KEYS.COUPONS, updated);
    return newCoupon;
  },

  async updateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon> {
    const coupons = await this.getCoupons();
    const index = coupons.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Coupon not found");

    coupons[index] = { ...coupons[index], ...updates };
    if (updates.code) coupons[index].code = updates.code.toUpperCase().trim();
    writeStorage(STORAGE_KEYS.COUPONS, coupons);
    return coupons[index];
  },

  async deleteCoupon(id: string): Promise<void> {
    const coupons = await this.getCoupons();
    const updated = coupons.filter((c) => c.id !== id);
    writeStorage(STORAGE_KEYS.COUPONS, updated);
  },

  // ── Reviews ─────────────────────────────────────────────────────────────────
  async getReviews(ratingFilter?: number): Promise<Review[]> {
    const reviews = readStorage<Review[]>(STORAGE_KEYS.REVIEWS, MOCK_REVIEWS);
    if (ratingFilter && ratingFilter > 0) {
      return reviews.filter((r) => r.rating === ratingFilter);
    }
    return reviews;
  },

  async deleteReview(id: string): Promise<void> {
    const reviews = await this.getReviews();
    const updated = reviews.filter((r) => r.id !== id);
    writeStorage(STORAGE_KEYS.REVIEWS, updated);
  },

  // ── Settings ────────────────────────────────────────────────────────────────
  async getSettings(): Promise<StoreSettings> {
    return readStorage<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  },

  async updateSettings(updates: Partial<StoreSettings>): Promise<StoreSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...updates };
    writeStorage(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  },

  // ── Dashboard Metrics & Chart Data ──────────────────────────────────────────
  async getDashboardMetrics() {
    const [products, orders, customers] = await Promise.all([
      this.getProducts(),
      this.getOrders(),
      this.getCustomers(),
    ]);

    const totalRevenue = orders.reduce((sum, o) => sum + (o.pricing?.totalAmount || 0), 0);
    const lowStockProducts = products.filter((p) => p.stock <= 5);
    const bestSellingProducts = products
      .filter((p) => p.ratingCount > 5000)
      .slice(0, 5);

    // Sales chart data points (7 days simulated revenue curve)
    const salesChart = [
      { day: "Mon", revenue: 84500, orders: 12 },
      { day: "Tue", revenue: 112000, orders: 18 },
      { day: "Wed", revenue: 98000, orders: 15 },
      { day: "Thu", revenue: 145000, orders: 22 },
      { day: "Fri", revenue: 189000, orders: 28 },
      { day: "Sat", revenue: 245000, orders: 36 },
      { day: "Sun", revenue: 210000, orders: 31 },
    ];

    return {
      totalRevenue,
      totalOrders: orders.length,
      totalCustomers: customers.length + 2450, // simulated active base
      totalProducts: products.length,
      salesChart,
      recentOrders: orders.slice(0, 5),
      bestSellingProducts,
      lowStockProducts,
    };
  },
};
