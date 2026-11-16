import type { SellerProduct, ProductFilters, PaginatedProducts } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || json?.error?.message || `Request failed (${res.status})`);
  }
  return (json?.data ?? json) as T;
}

function qs(filters: ProductFilters = {}) {
  const p = new URLSearchParams();
  if (filters.search) p.set("search", filters.search);
  if (filters.category) p.set("category", filters.category);
  if (filters.brand) p.set("brand", filters.brand);
  if (filters.status) p.set("status", filters.status);
  if (filters.stock) p.set("stock", filters.stock);
  if (filters.sortBy) p.set("sortBy", filters.sortBy);
  if (filters.page) p.set("page", String(filters.page));
  if (filters.limit) p.set("limit", String(filters.limit));
  const s = p.toString();
  return s ? `?${s}` : "";
}

function mapProduct(p: any): SellerProduct {
  const specs = p.specifications && !Array.isArray(p.specifications)
    ? Object.entries(p.specifications).map(([key, value]) => ({ key, value: String(value) }))
    : (p.specifications || []);
  return {
    id: p.id || p._id,
    sellerId: p.sellerId || "",
    name: p.name || p.title || "",
    slug: p.slug || "",
    sku: p.sku || "",
    barcode: p.barcode || "",
    category: p.category || "",
    subcategory: p.subcategory || "",
    brand: p.brand || "",
    description: p.description || "",
    shortDescription: p.shortDescription || "",
    highlights: p.highlights || [],
    price: Number(p.price || 0),
    mrp: Number(p.mrp || 0),
    discountPercentage: Number(p.discountPercentage || 0),
    taxPercentage: Number(p.taxPercentage || 0),
    stock: Number(p.stock || 0),
    lowStockThreshold: Number(p.lowStockThreshold || 0),
    status: (p.status || "DRAFT") as any,
    images: (p.images || []).map((img: any, i: number) => ({ id: img.id || `img-${i + 1}`, url: img.url, alt: img.alt || p.name || "", isPrimary: !!img.isPrimary })),
    variants: (p.variants || []).map((v: any, i: number) => ({ id: v.id || `var-${i + 1}`, sku: v.sku || "", size: v.size, color: v.color, price: Number(v.price || 0), mrp: Number(v.mrp || 0), stock: Number(v.stock || 0) })),
    specifications: specs,
    seoTitle: p.seoTitle || "",
    seoDescription: p.seoDescription || "",
    unitsSold: Number(p.unitsSold || 0),
    totalRevenue: Number(p.totalRevenue || 0),
    rating: Number(p.rating || 0),
    reviewCount: Number(p.reviewCount || 0),
    isAssured: !!p.isAssured,
    isFreeDelivery: !!p.isFreeDelivery,
    estimatedDeliveryDays: Number(p.estimatedDeliveryDays || 3),
    createdAt: p.createdAt || new Date().toISOString(),
    updatedAt: p.updatedAt || new Date().toISOString(),
  };
}

export const sellerProductService = {
  async getProducts(_sellerId: string, filters: ProductFilters = {}): Promise<PaginatedProducts> {
    const data = await api<any>(`/api/v1/vendor/products${qs(filters)}`);
    const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    return { data: rows.map(mapProduct), total: Number(data?.total ?? rows.length), page: Number(data?.page ?? filters.page ?? 1), totalPages: Number(data?.totalPages ?? 1), hasMore: !!data?.hasMore };
  },
  async getProduct(_sellerId: string, productId: string): Promise<SellerProduct | null> {
    const p = await api<any>(`/api/v1/vendor/products/${productId}`);
    return p ? mapProduct(p) : null;
  },
  async createProduct(_sellerId: string, product: any): Promise<SellerProduct> {
    const payload = { ...product, specifications: Array.isArray(product?.specifications) ? Object.fromEntries(product.specifications.map((s: any) => [s.key, s.value])) : (product?.specifications || {}), status: product?.status === "PUBLISHED" ? "PENDING_APPROVAL" : (product?.status || "DRAFT") };
    const p = await api<any>(`/api/v1/vendor/products`, { method: "POST", body: JSON.stringify(payload) });
    return mapProduct(p);
  },
  async updateProduct(_sellerId: string, productId: string, updates: any): Promise<SellerProduct | null> {
    const payload = { ...updates, ...(Array.isArray(updates?.specifications) ? { specifications: Object.fromEntries(updates.specifications.map((s: any) => [s.key, s.value])) } : {}), ...(updates?.status === "PUBLISHED" ? { status: "PENDING_APPROVAL" } : {}) };
    const p = await api<any>(`/api/v1/vendor/products/${productId}`, { method: "PATCH", body: JSON.stringify(payload) });
    return p ? mapProduct(p) : null;
  },
  async deleteProduct(_sellerId: string, productId: string): Promise<boolean> {
    await api<any>(`/api/v1/vendor/products/${productId}`, { method: "DELETE" });
    return true;
  },
  async duplicateProduct(sellerId: string, productId: string): Promise<SellerProduct | null> {
    const src = await this.getProduct(sellerId, productId);
    if (!src) return null;
    const { id, createdAt, updatedAt, unitsSold, totalRevenue, rating, reviewCount, ...rest } = src as any;
    return this.createProduct(sellerId, { ...rest, name: `${src.name} (Copy)`, slug: `${src.slug}-copy-${Date.now().toString().slice(-4)}`, sku: `${src.sku}-COPY-${Date.now().toString().slice(-4)}`, status: "DRAFT" });
  },
  async getCategories(_sellerId: string): Promise<string[]> {
    const data = await api<any>(`/api/v1/vendor/products?limit=100`);
    const rows = Array.isArray(data?.data) ? data.data : [];
    return [...new Set(rows.map((p: any) => p.category).filter(Boolean))] as string[];
  },
  async getBrands(_sellerId: string): Promise<string[]> {
    const data = await api<any>(`/api/v1/vendor/products?limit=100`);
    const rows = Array.isArray(data?.data) ? data.data : [];
    return [...new Set(rows.map((p: any) => p.brand).filter(Boolean))] as string[];
  },
};
