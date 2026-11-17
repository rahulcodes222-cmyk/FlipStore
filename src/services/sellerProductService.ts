import type { SellerProduct, ProductFilters, PaginatedProducts } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function extractErrorMessage(json: any, status: number) {
  if (!json) return `Request failed (${status})`;
  if (typeof json?.message === "string" && json.message) {
    const details = json?.error?.details;
    if (details && typeof details === "object") {
      const parts = Object.entries(details)
        .flatMap(([k, v]) => Array.isArray(v) ? v.map((x) => `${k}: ${String(x)}`) : [])
        .filter(Boolean);
      if (parts.length) return `${json.message} ${parts.slice(0, 3).join("; ")}`;
    }
    return json.message;
  }
  return json?.error?.message || `Request failed (${status})`;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(extractErrorMessage(json, res.status));
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
  if ((filters as any).sortBy) p.set("sortBy", String((filters as any).sortBy));
  if (filters.page) p.set("page", String(filters.page));
  if (filters.limit) p.set("limit", String(filters.limit));
  const s = p.toString();
  return s ? `?${s}` : "";
}

function normalizeSpecifications(specs: any) {
  if (!specs) return [] as { key: string; value: string }[];
  if (Array.isArray(specs)) return specs.map((s: any) => ({ key: String(s?.key || ""), value: String(s?.value ?? "") })).filter((s) => s.key);
  if (typeof specs === "object") return Object.entries(specs).map(([key, value]) => ({ key, value: String(value ?? "") })).filter((s) => s.key);
  return [];
}

function mapProduct(p: any): SellerProduct {
  const images = Array.isArray(p?.images) ? p.images : [];
  const primary = images.find((i: any) => i?.isPrimary) || images[0];
  const variants = Array.isArray(p?.variants) ? p.variants : [];
  const rawId = p?.id ?? p?._id;
  const id = rawId === undefined || rawId === null ? "" : String(rawId).trim();
  const legacy = String(p?.status || "DRAFT").toUpperCase();
  const approvalStatus = String(p?.approvalStatus || (legacy === "PUBLISHED" ? "Approved" : legacy === "REJECTED" ? "Rejected" : "Draft"));
  const productStatus = String(p?.productStatus || (legacy === "PUBLISHED" ? "Active" : "Inactive"));
  return {
    id: id === "undefined" || id === "null" ? "" : id,
    sellerId: String(p?.sellerId || ""),
    name: String(p?.name || p?.title || ""),
    slug: String(p?.slug || ""),
    sku: String(p?.sku || ""),
    barcode: String(p?.barcode || ""),
    category: String(p?.category || ""),
    subcategory: String(p?.subcategory || ""),
    brand: String(p?.brand || ""),
    description: String(p?.description || ""),
    shortDescription: String(p?.shortDescription || ""),
    highlights: Array.isArray(p?.highlights) ? p.highlights : [],
    price: Number(p?.price || 0),
    mrp: Number(p?.mrp || 0),
    discountPercentage: Number(p?.discountPercentage || 0),
    taxPercentage: Number(p?.taxPercentage || 0),
    stock: Number(p?.stock || 0),
    lowStockThreshold: Number(p?.lowStockThreshold || 0),
    status: (p?.status || "DRAFT") as any,
    approvalStatus: approvalStatus as any,
    productStatus: productStatus as any,
    rejectionReason: String(p?.rejectionReason || ""),
    adminComment: String(p?.adminComment || ""),
    submittedAt: p?.submittedAt || undefined,
    reviewedAt: p?.reviewedAt || undefined,
    reviewedBy: p?.reviewedBy || undefined,
    approvedAt: p?.approvedAt || undefined,
    approvedBy: p?.approvedBy || undefined,
    changesRequestedAt: p?.changesRequestedAt || undefined,
    rejectedAt: p?.rejectedAt || undefined,
    approvalHistory: Array.isArray(p?.approvalHistory) ? p.approvalHistory : [],
    images: images.map((img: any, i: number) => ({ id: String(img?.id || `img-${i + 1}`), url: String(img?.url || ""), alt: String(img?.alt || p?.name || ""), isPrimary: !!img?.isPrimary || (i === 0 && !primary) })).filter((i: any) => i.url),
    thumbnail: String(p?.thumbnail || primary?.url || ""),
    variants: variants.map((v: any, i: number) => ({ id: String(v?.id || `var-${i + 1}`), sku: String(v?.sku || ""), size: v?.size, color: v?.color, price: Number(v?.price || 0), mrp: Number(v?.mrp ?? v?.price ?? 0), stock: Number(v?.stock || 0) })),
    specifications: normalizeSpecifications(p?.specifications),
    seoTitle: String(p?.seoTitle || ""),
    seoDescription: String(p?.seoDescription || ""),
    unitsSold: Number(p?.unitsSold || 0),
    totalRevenue: Number(p?.totalRevenue || 0),
    rating: Number(p?.rating || 0),
    reviewCount: Number(p?.reviewCount || 0),
    isAssured: !!p?.isAssured,
    isFreeDelivery: !!p?.isFreeDelivery,
    estimatedDeliveryDays: Number(p?.estimatedDeliveryDays || 3),
    createdAt: p?.createdAt || new Date().toISOString(),
    updatedAt: p?.updatedAt || new Date().toISOString(),
  } as SellerProduct;
}

function toApiPayload(product: any) {
  const specs = Array.isArray(product?.specifications)
    ? Object.fromEntries(product.specifications.filter((s: any) => s?.key).map((s: any) => [String(s.key), String(s.value ?? "")]))
    : (product?.specifications && typeof product.specifications === "object" ? product.specifications : {});
  const payload: any = { ...product, specifications: specs };
  delete payload.id;
  delete payload.createdAt;
  delete payload.updatedAt;
  delete payload.unitsSold;
  delete payload.totalRevenue;
  delete payload.rating;
  delete payload.reviewCount;
  delete payload.thumbnail;
  if (Array.isArray(payload.images)) {
    payload.images = payload.images.filter((img: any) => img?.url).map((img: any, i: number) => ({ id: img.id || `img-${i + 1}`, url: String(img.url), alt: img.alt || payload.name || "Product image", isPrimary: !!img.isPrimary }));
    if (payload.images.length && !payload.images.some((i: any) => i.isPrimary)) payload.images[0].isPrimary = true;
  }
  if (Array.isArray(payload.variants)) {
    payload.variants = payload.variants
      .filter((v: any) => v && (v.sku || v.size || v.color))
      .map((v: any) => ({
        ...(v.id ? { id: v.id } : {}),
        sku: String(v.sku || "").trim().toUpperCase(),
        ...(v.size ? { size: String(v.size) } : {}),
        ...(v.color ? { color: String(v.color) } : {}),
        price: Number(v.price ?? payload.price ?? 0),
        mrp: Number(v.mrp ?? payload.mrp ?? payload.price ?? 0),
        stock: Number(v.stock ?? 0),
      }));
  }
  return payload;
}

export const sellerProductService = {
  async getProducts(_sellerId: string, filters: ProductFilters = {}): Promise<PaginatedProducts> {
    const data = await api<any>(`/api/v1/vendor/products${qs(filters)}`);
    const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    const page = Number(data?.page ?? data?.pagination?.page ?? filters.page ?? 1);
    const total = Number(data?.total ?? data?.pagination?.total ?? rows.length);
    const limit = Number(data?.limit ?? data?.pagination?.limit ?? filters.limit ?? 20);
    const totalPages = Number(data?.totalPages ?? data?.pagination?.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, limit))));
    return { data: rows.map(mapProduct), total, page, totalPages, hasMore: !!data?.hasMore || page < totalPages };
  },
  async getProduct(_sellerId: string, productId: string): Promise<SellerProduct | null> {
    const p = await api<any>(`/api/v1/vendor/products/${productId}`);
    return p ? mapProduct(p) : null;
  },
  async createProduct(_sellerId: string, product: any): Promise<SellerProduct> {
    const payload = toApiPayload(product);
    const p = await api<any>(`/api/v1/vendor/products`, { method: "POST", body: JSON.stringify(payload) });
    return mapProduct(p);
  },
  async updateProduct(_sellerId: string, productId: string, updates: any): Promise<SellerProduct | null> {
    const payload = toApiPayload(updates);
    const p = await api<any>(`/api/v1/vendor/products/${productId}`, { method: "PATCH", body: JSON.stringify(payload) });
    return p ? mapProduct(p) : null;
  },
  async deleteProduct(_sellerId: string, productId: string): Promise<boolean> {
    await api<any>(`/api/v1/vendor/products/${productId}`, { method: "DELETE" });
    return true;
  },
  async submitProduct(_sellerId: string, productId: string): Promise<SellerProduct> {
    const p = await api<any>(`/api/v1/vendor/products/${encodeURIComponent(productId)}/submit`, { method: "PATCH" });
    return mapProduct(p);
  },
  async duplicateProduct(sellerId: string, productId: string): Promise<SellerProduct | null> {
    const src = await this.getProduct(sellerId, productId);
    if (!src) return null;
    const { id, createdAt, updatedAt, unitsSold, totalRevenue, rating, reviewCount, thumbnail, approvalHistory, reviewedAt, reviewedBy, approvedAt, approvedBy, submittedAt, rejectionReason, adminComment, changesRequestedAt, rejectedAt, approvalStatus, productStatus, ...rest } = src as any;
    return this.createProduct(sellerId, { ...rest, name: `${src.name} (Copy)`, slug: `${src.slug}-copy-${Date.now().toString().slice(-4)}`, sku: `${src.sku}-COPY-${Date.now().toString().slice(-4)}`, status: "DRAFT" });
  },
  async getCategories(_sellerId: string): Promise<string[]> {
    try {
      const data = await api<any>(`/api/v1/vendor/products?limit=100`);
      const rows = Array.isArray(data?.data) ? data.data : [];
      return [...new Set(rows.map((p: any) => p.category).filter(Boolean))] as string[];
    } catch { return []; }
  },
  async getBrands(_sellerId: string): Promise<string[]> {
    try {
      const data = await api<any>(`/api/v1/vendor/products?limit=100`);
      const rows = Array.isArray(data?.data) ? data.data : [];
      return [...new Set(rows.map((p: any) => p.brand).filter(Boolean))] as string[];
    } catch { return []; }
  },
};



