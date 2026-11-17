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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function getStoredAccessTokenAdmin(): string | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem("my_ecommerce_access_token_v1"); } catch { return null; }
}
function adminAuthHeaders(init: RequestInit = {}): RequestInit {
  const token = getStoredAccessTokenAdmin();
  const headers = new Headers(init.headers || {});
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
  return { ...init, headers, credentials: "include" as RequestCredentials };
}
async function adminFetch(input: RequestInfo | URL, init: RequestInit = {}, canRetry = true): Promise<Response> {
  let res = await fetch(input, adminAuthHeaders(init));
  if (res.status === 401 && canRetry) {
    try {
      const r = await fetch(`${API_BASE}/api/v1/auth/refresh`, adminAuthHeaders({ method: "POST" }));
      if (r.ok) {
        const b = await r.json().catch(() => ({} as any));
        const t = b?.data?.accessToken || b?.accessToken;
        if (t) try { window.localStorage.setItem("my_ecommerce_access_token_v1", t); } catch {}
        res = await fetch(input, adminAuthHeaders(init));
      }
    } catch {}
  }
  return res;
}

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
  // ── Products (DB-backed via API) ────────────────────────────────────────────
  async getProducts(params?: {
    query?: string;
    category?: string;
    inStockOnly?: boolean;
  }): Promise<Product[]> {
    const sp = new URLSearchParams();
    sp.set("limit", "100");
    if (params?.query?.trim()) sp.set("search", params.query.trim());
    if (params?.category && params.category !== "ALL") sp.set("category", params.category);
    if (params?.inStockOnly) sp.set("stock", "IN_STOCK");
    const res = await fetch(`${API_BASE}/api/v1/products?${sp.toString()}`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok || body?.success === false) {
      throw new Error(body?.message || "Failed to fetch products.");
    }
    return ((body?.data || []) as any[]).map(mapApiProductToFrontend);
  },

  async getProductById(id: string): Promise<Product | null> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/products/${id}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json().catch(() => ({} as any));
      if (res.ok && body?.success !== false && body?.data) {
        return mapApiProductToFrontend(body.data);
      }
      if (res.status !== 404 && res.ok === false && body?.success === false) {
        // try fallback below for transient/compat cases
      }
    } catch {}
    try {
      const list = await this.getProducts({ query: id });
      return list.find((p) => p.id === id || p.slug === id) || null;
    } catch {
      return null;
    }
  },

  async createProduct(productData: Omit<Product, "id" | "createdAt">): Promise<Product> {
    const payload = toApiCreateProductPayload(productData as any);
    const res = await fetch(`${API_BASE}/api/v1/products`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok || body?.success === false) {
      const details = body?.error?.details;
      const first = details ? Object.values(details).flat().find(Boolean) : null;
      throw new Error(first ? String(first) : body?.message || "Failed to create product.");
    }
    const created = body?.data;
    if (created?.id) {
      try {
        const full = await this.getProductById(created.id);
        if (full) return full;
      } catch {}
      return mapApiProductToFrontend({ ...payload, ...created, title: payload.name, name: payload.name });
    }
    return mapApiProductToFrontend(created || payload);
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const payload = toApiUpdateProductPayload(updates as any);
    const res = await fetch(`${API_BASE}/api/v1/products/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok || body?.success === false) {
      const details = body?.error?.details;
      const first = details ? Object.values(details).flat().find(Boolean) : null;
      throw new Error(first ? String(first) : body?.message || "Failed to update product.");
    }
    try {
      const full = await this.getProductById(id);
      if (full) return full;
    } catch {}
    return mapApiProductToFrontend({ id, ...updates, ...body?.data });
  },

  async deleteProduct(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/v1/products/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok || body?.success === false) {
      throw new Error(body?.message || "Failed to delete product.");
    }
  },

  async updateProductStock(id: string, newStock: number): Promise<Product> {
    return this.updateProduct(id, { stock: newStock, inStock: newStock > 0 } as any);
  },

  // ── Categories (DB-backed via API) ─────────────────────────────────────────
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/api/v1/categories?limit=100`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok || body?.success === false) {
      throw new Error(body?.message || "Failed to fetch categories.");
    }
    return (body?.data || []) as Category[];
  },

  async createCategory(categoryData: Omit<Category, "id">): Promise<Category> {
    const res = await fetch(`${API_BASE}/api/v1/categories`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description || "",
        image: categoryData.image || "",
        icon: (categoryData as any).icon || "",
        itemCount: categoryData.itemCount ?? 0,
        isFeatured: categoryData.isFeatured ?? false,
        isActive: (categoryData as any).isActive ?? true,
      }),
    });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok || body?.success === false) {
      const details = body?.error?.details;
      const first = details ? Object.values(details).flat().find(Boolean) : null;
      throw new Error(first ? String(first) : body?.message || "Failed to create category.");
    }
    return body.data as Category;
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const res = await fetch(`${API_BASE}/api/v1/categories/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok || body?.success === false) {
      const details = body?.error?.details;
      const first = details ? Object.values(details).flat().find(Boolean) : null;
      throw new Error(first ? String(first) : body?.message || "Failed to update category.");
    }
    return body.data as Category;
  },

  async deleteCategory(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/v1/categories/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok || body?.success === false) {
      throw new Error(body?.message || "Failed to delete category.");
    }
  },

  // ── Orders (DB-backed via API) ──────────────────────────────────────────────
  async getOrders(): Promise<Order[]> {
    const res = await adminFetch(`${API_BASE}/api/v1/orders`, { method: "GET" });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok || body?.success === false) {
      throw new Error(body?.message || body?.error?.message || "Failed to fetch orders.");
    }
    const list = Array.isArray(body?.data) ? body.data : [];
    return list.map((o: any) => this._mapApiOrder(o));
  },

  async getOrderById(id: string): Promise<Order | null> {
    const res = await adminFetch(`${API_BASE}/api/v1/orders/${encodeURIComponent(id)}`, { method: "GET" });
    const body = await res.json().catch(() => ({} as any));
    if (res.status === 404) return null;
    if (!res.ok || body?.success === false) {
      try {
        const orders = await this.getOrders();
        return orders.find((o) => o.id === id || o.orderNumber === id) || null;
      } catch {
        return null;
      }
    }
    return body?.data ? this._mapApiOrder(body.data) : null;
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const res = await adminFetch(`${API_BASE}/api/v1/orders/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok || body?.success === false) {
      throw new Error(body?.message || body?.error?.message || "Failed to update order status.");
    }
    const data = body?.data;
    if (data) return this._mapApiOrder(data);
    const refreshed = await this.getOrderById(id);
    if (!refreshed) throw new Error("Order not found after status update.");
    return refreshed;
  },

  _mapApiOrder(data: any): Order {
    const toIso = (v: any) => {
      if (!v) return new Date().toISOString();
      if (typeof v === "string") return v;
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    };
    const addr = data?.shippingAddress || {};
    return {
      id: String(data?.id || data?._id || data?.orderNumber || ""),
      orderNumber: String(data?.orderNumber || data?.subOrderNumber || data?.id || ""),
      userId: String(data?.userId || data?.customerId || ""),
      items: Array.isArray(data?.items) ? data.items : [],
      shippingAddress: {
        id: String(addr?.id || addr?._id || ""),
        name: addr?.name || data?.customerName || "Customer",
        phone: addr?.phone || data?.customerPhone || "",
        pincode: addr?.pincode || "",
        locality: addr?.locality || "",
        street: addr?.street || "",
        city: addr?.city || "",
        state: addr?.state || "",
        landmark: addr?.landmark || "",
        type: addr?.type || "home",
        isDefault: !!addr?.isDefault,
        alternatePhone: addr?.alternatePhone,
      } as any,
      paymentMethod: (data?.paymentMethod || "COD") as any,
      paymentStatus: (data?.paymentStatus || "PENDING") as any,
      orderStatus: (data?.orderStatus || "PLACED") as any,
      pricing: {
        totalMrp: Number(data?.pricing?.totalMrp || 0),
        discount: Number(data?.pricing?.discount || 0),
        couponDiscount: Number(data?.pricing?.couponDiscount || 0),
        deliveryCharges: Number(data?.pricing?.deliveryCharges || 0),
        totalAmount: Number(data?.pricing?.totalAmount || 0),
      } as any,
      placedAt: toIso(data?.placedAt || data?.createdAt),
      estimatedDelivery: toIso(data?.estimatedDelivery || Date.now() + 3 * 24 * 60 * 60 * 1000),
      deliveredAt: data?.deliveredAt ? toIso(data.deliveredAt) : undefined,
      cancelledAt: data?.cancelledAt ? toIso(data.cancelledAt) : undefined,
      cancelReason: data?.cancelReason,
      appliedCouponId: data?.appliedCouponId,
      statusHistory: data?.statusHistory || [],
      shipments: data?.shipments || [],
      tracking: data?.tracking,
      returns: data?.returns || [],
      invoice: data?.invoice,
    } as unknown as Order;
  },

  // ── Seller/Vendor Applications (DB-backed via admin API) ─────────────────────
  async getVendors(params?: { status?: string; search?: string; page?: number; limit?: number }) {
    const sp = new URLSearchParams();
    if (params?.status) sp.set("status", params.status);
    if (params?.search?.trim()) sp.set("search", params.search.trim());
    sp.set("page", String(params?.page || 1));
    sp.set("limit", String(params?.limit || 50));
    const res = await adminFetch(`${API_BASE}/api/v1/admin/vendors?${sp.toString()}`, { method: "GET" });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok || body?.success === false) {
      throw new Error(body?.message || body?.error?.message || "Failed to fetch seller applications.");
    }
    return body?.data || { vendors: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 1 } };
  },

  async updateVendorStatus(id: string, status: string, opts?: { reason?: string; note?: string }) {
    const res = await adminFetch(`${API_BASE}/api/v1/admin/vendors/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...(opts?.reason ? { reason: opts.reason } : {}), ...(opts?.note ? { note: opts.note } : {}) }),
    });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok || body?.success === false) {
      throw new Error(body?.message || body?.error?.message || "Failed to update seller status.");
    }
    return body?.data;
  },

  // ── Customers (DB-backed via admin API) ─────────────────────────────────────
  async getCustomers(query?: string): Promise<User[]> {
    const sp = new URLSearchParams();
    sp.set("limit", "100");
    if (query?.trim()) sp.set("search", query.trim());
    const res = await adminFetch(`${API_BASE}/api/v1/admin/users?${sp.toString()}`, { method: "GET" });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok || body?.success === false) {
      throw new Error(body?.message || body?.error?.message || "Failed to fetch customers.");
    }
    const payload = body?.data;
    const list = Array.isArray(payload) ? payload : Array.isArray(payload?.users) ? payload.users : [];
    return list.map((u: any) => this._mapApiUser(u));
  },

  async getCustomerById(id: string): Promise<User | null> {
    try {
      const res = await adminFetch(`${API_BASE}/api/v1/admin/users/${encodeURIComponent(id)}`, { method: "GET" });
      const body = await res.json().catch(() => ({} as any));
      if (res.status === 404) return null;
      if (res.ok && body?.success !== false && body?.data) return this._mapApiUser(body.data);
    } catch {}
    try {
      const users = await this.getCustomers(id);
      return users.find((u) => u.id === id || u.email === id) || null;
    } catch {
      return null;
    }
  },

  _mapApiUser(u: any): User {
    const toIso = (v: any) => {
      if (!v) return new Date().toISOString();
      if (typeof v === "string") return v;
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    };
    return {
      id: String(u?.id || u?._id || ""),
      name: String(u?.name || ""),
      email: String(u?.email || ""),
      phone: String(u?.phone || ""),
      role: (u?.role || "customer") as any,
      avatar: u?.avatar,
      addresses: Array.isArray(u?.addresses) ? u.addresses : [],
      defaultAddressId: u?.defaultAddressId,
      createdAt: toIso(u?.createdAt),
    } as User;
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



function slugify(v: string): string {
  return String(v || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function mapApiProductToFrontend(item: any): Product {
  const imagesArr = Array.isArray(item?.images)
    ? item.images.map((img: any) => (typeof img === "string" ? img : img?.url)).filter(Boolean)
    : [];
  const primary = Array.isArray(item?.images)
    ? item.images.find((img: any) => img && typeof img === "object" && img.isPrimary) || item.images[0]
    : null;
  const thumbnail = item?.thumbnail || (typeof primary === "string" ? primary : primary?.url) || imagesArr[0] || "";
  const categorySlug = item?.categorySlug || slugify(item?.categoryName || item?.category || "general");
  return {
    id: String(item?.id || item?._id || ""),
    title: String(item?.title || item?.name || ""),
    slug: String(item?.slug || slugify(item?.title || item?.name || "")),
    brandId: String(item?.brandId || slugify(item?.brandName || item?.brand || "brand") || "brand"),
    brandName: String(item?.brandName || item?.brand || ""),
    categoryId: String(item?.categoryId || slugify(item?.categoryName || item?.category || "category")),
    categoryName: String(item?.categoryName || item?.category || ""),
    categorySlug,
    price: Number(item?.price || 0),
    mrp: Number(item?.mrp || item?.price || 0),
    discountPercentage: Number(item?.discountPercentage || 0),
    inStock: item?.inStock ?? Number(item?.stock || 0) > 0,
    stock: Number(item?.stock || 0),
    rating: Number(item?.rating || 0),
    ratingCount: Number(item?.ratingCount || item?.reviewCount || 0),
    reviewCount: Number(item?.reviewCount || item?.ratingCount || 0),
    isAssured: !!item?.isAssured,
    isFreeDelivery: !!item?.isFreeDelivery,
    estimatedDeliveryDays: Number(item?.estimatedDeliveryDays || 3),
    seller: item?.seller || { id: String(item?.sellerId || "admin"), name: "Store", rating: 4.5 },
    thumbnail,
    images: imagesArr.length ? imagesArr : (thumbnail ? [thumbnail] : []),
    shortDescription: String(item?.shortDescription || ""),
    description: String(item?.description || ""),
    highlights: Array.isArray(item?.highlights) ? item.highlights : [],
    specifications: (item?.specifications as any) || {},
    tags: Array.isArray(item?.tags) ? item.tags : [],
    createdAt: String(item?.createdAt || new Date().toISOString()),
  } as Product;
}

function normalizeSpecifications(input: any): Record<string, string> {
  const out: Record<string, string> = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return out;
  for (const [k, v] of Object.entries(input)) {
    if (v == null) continue;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out[String(k)] = String(v);
    } else if (typeof v === 'object' && !Array.isArray(v)) {
      // flatten nested group like { General: { Brand: "X" } }
      let added = false;
      for (const [nk, nv] of Object.entries(v as Record<string, any>)) {
        if (nv == null) continue;
        if (typeof nv === 'object' && !Array.isArray(nv)) {
          out[`${String(k)} - ${String(nk)}`] = JSON.stringify(nv);
        } else {
          out[String(nk)] = String(nv);
        }
        added = true;
      }
      if (!added) out[String(k)] = JSON.stringify(v);
    } else {
      out[String(k)] = Array.isArray(v) ? v.join(', ') : JSON.stringify(v);
    }
  }
  return out;
}

function toApiCreateProductPayload(productData: any): any {
  const name = String(productData?.title || productData?.name || "").trim();
  const slug = slugify(productData?.slug || name) || `product-${Date.now()}`;
  const categoryName = String(productData?.categoryName || productData?.category || "General").trim() || "General";
  const brandName = String(productData?.brandName || productData?.brand || "Store").trim() || "Store";
  const imageUrl = String(productData?.thumbnail || (Array.isArray(productData?.images) ? (typeof productData.images[0] === 'string' ? productData.images[0] : productData.images[0]?.url) : "") || "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&q=80");
  const desc = String(productData?.description || `${name} by ${brandName}.`).trim();
  const highlights = Array.isArray(productData?.highlights) ? productData.highlights.filter(Boolean) : [];
  const rawSpecs = (productData?.specifications && typeof productData.specifications === 'object') ? productData.specifications : { Brand: brandName, Model: name };
  const specs = normalizeSpecifications(rawSpecs);
  const mrp = Number(productData?.mrp ?? productData?.originalPrice ?? productData?.price ?? 0) || 0;
  const price = Number(productData?.price ?? 0) || 0;
  const payload: any = {
    name,
    slug,
    sku: `ADM-${Date.now().toString(36).toUpperCase()}`,
    category: categoryName,
    brand: brandName,
    description: desc.length >= 10 ? desc : `${desc} Premium quality product.`,
    shortDescription: String(productData?.shortDescription || `${name} by ${brandName}`).slice(0, 300),
    highlights,
    specifications: specs,
    price,
    mrp: mrp || price,
    discountPercentage: Number(productData?.discountPercentage ?? (mrp > price && mrp > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0)) || 0,
    taxPercentage: Number(productData?.taxPercentage ?? 0) || 0,
    stock: Number.isFinite(Number(productData?.stock)) ? Math.max(0, Math.floor(Number(productData.stock))) : 0,
    lowStockThreshold: Number(productData?.lowStockThreshold ?? 5) || 5,
    status: productData?.status || ((Number(productData?.stock || 0) > 0) ? "PUBLISHED" : "OUT_OF_STOCK"),
    images: [{ id: `img-${Date.now()}`, url: imageUrl, alt: name || "Product image", isPrimary: true }],
    variants: [],
    seoTitle: String(productData?.seoTitle || name).slice(0, 200),
    seoDescription: String(productData?.seoDescription || desc).slice(0, 500),
    isAssured: !!productData?.isAssured,
    isFreeDelivery: !!productData?.isFreeDelivery,
    estimatedDeliveryDays: Number(productData?.estimatedDeliveryDays ?? 3) || 3,
  };
  const catId = String(productData?.categoryId || '').trim();
  if (/^[a-f\d]{24}$/i.test(catId)) payload.categoryId = catId;
  const brId = String(productData?.brandId || '').trim();
  if (/^[a-f\d]{24}$/i.test(brId)) payload.brandId = brId;
  return payload;
}

function toApiUpdateProductPayload(updates: any): any {
  const out: any = {};
  if (updates?.title !== undefined || updates?.name !== undefined) out.name = String(updates.title ?? updates.name).trim();
  if (updates?.slug !== undefined) out.slug = slugify(updates.slug);
  if (updates?.categoryName !== undefined || updates?.category !== undefined) out.category = String(updates.categoryName ?? updates.category);
  if (updates?.categoryId !== undefined) {
    const v = String(updates.categoryId || '').trim();
    if (/^[a-f\d]{24}$/i.test(v)) out.categoryId = v;
  }
  if (updates?.brandName !== undefined || updates?.brand !== undefined) out.brand = String(updates.brandName ?? updates.brand);
  if (updates?.brandId !== undefined) {
    const v = String(updates.brandId || '').trim();
    if (/^[a-f\d]{24}$/i.test(v)) out.brandId = v;
  }
  if (updates?.description !== undefined) {
    const d = String(updates.description || "");
    out.description = d.length >= 10 ? d : `${d} Premium quality product.`;
  }
  if (updates?.shortDescription !== undefined) out.shortDescription = String(updates.shortDescription).slice(0,300);
  if (updates?.highlights !== undefined) out.highlights = Array.isArray(updates.highlights) ? updates.highlights : [];
  if (updates?.specifications !== undefined) out.specifications = normalizeSpecifications(updates.specifications || {});
  if (updates?.price !== undefined) out.price = Number(updates.price) || 0;
  if (updates?.mrp !== undefined || updates?.originalPrice !== undefined) out.mrp = Number(updates.mrp ?? updates.originalPrice) || 0;
  if (updates?.discountPercentage !== undefined) out.discountPercentage = Number(updates.discountPercentage) || 0;
  if (updates?.stock !== undefined) {
    out.stock = Math.max(0, Math.floor(Number(updates.stock) || 0));
    out.status = out.stock > 0 ? "PUBLISHED" : "OUT_OF_STOCK";
  }
  if (updates?.isAssured !== undefined) out.isAssured = !!updates.isAssured;
  if (updates?.isFreeDelivery !== undefined) out.isFreeDelivery = !!updates.isFreeDelivery;
  if (updates?.thumbnail !== undefined || updates?.images !== undefined) {
    const url = updates.thumbnail || (Array.isArray(updates.images) ? (typeof updates.images[0] === 'string' ? updates.images[0] : updates.images[0]?.url) : null);
    if (url) out.images = [{ id: `img-${Date.now()}`, url: String(url), alt: String(updates.title || updates.name || 'Product'), isPrimary: true }];
  }
  if (updates?.status !== undefined) out.status = updates.status;
  return out;
}
