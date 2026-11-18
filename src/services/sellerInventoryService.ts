import type { InventoryItem, StockHistoryEntry } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) throw new Error(json?.message || json?.error?.message || `Request failed (${res.status})`);
  return (json?.data ?? json) as T;
}

function mapItem(i: any): InventoryItem {
  return {
    id: i.id || `${i.productId}:${i.sku}`,
    productId: i.productId,
    productName: i.productName || i.name || "Product",
    sku: i.sku || "",
    image: i.image || i.thumbnail || "",
    category: i.category || "",
    stock: Number(i.stock || 0),
    lowStockThreshold: Number(i.lowStockThreshold || 0),
    status: (i.status || "IN_STOCK") as any,
    reservedStock: Number(i.reservedStock || 0),
    availableStock: Number(i.availableStock ?? Math.max(0, Number(i.stock || 0) - Number(i.reservedStock || 0))),
    lastUpdated: i.lastUpdated || i.updatedAt || new Date().toISOString(),
    ...(i.variantId ? { variantId: String(i.variantId) } : {}),
    ...(i.variantLabel ? { variantLabel: String(i.variantLabel) } : {}),
  } as any;
}

export const sellerInventoryService = {
  async getInventory(_sellerId: string): Promise<InventoryItem[]> {
    const data = await api<any>(`/api/v1/vendor/inventory?limit=200`);
    const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    return rows.map(mapItem);
  },
  async getInventoryStats(_sellerId: string) {
    const data = await api<any>(`/api/v1/vendor/inventory?limit=200`);
    if (data?.stats) return data.stats;
    const items = (Array.isArray(data?.data) ? data.data : []).map(mapItem);
    return {
      totalProducts: new Set(items.map((i: InventoryItem) => i.productId)).size,
      totalStock: items.reduce((s: number, i: InventoryItem) => s + i.stock, 0),
      availableStock: items.reduce((s: number, i: InventoryItem) => s + i.availableStock, 0),
      lowStock: items.filter((i: InventoryItem) => i.status === "LOW_STOCK").length,
      outOfStock: items.filter((i: InventoryItem) => i.status === "OUT_OF_STOCK").length,
    };
  },
  async updateStock(_sellerId: string, productId: string, stock: number, variant?: { variantId?: string; sku?: string }): Promise<InventoryItem | null> {
    await api<any>(`/api/v1/vendor/inventory/${productId}`, {
      method: "PATCH",
      body: JSON.stringify({
        stock,
        ...(variant?.variantId ? { variantId: variant.variantId } : {}),
        ...(variant?.sku ? { sku: variant.sku } : {}),
        reason: "manual_stock_update",
      }),
    });
    const items = await this.getInventory(_sellerId);
    const sku = variant?.sku ? String(variant.sku) : "";
    return items.find((i: any) => i.productId === productId && (!sku || String(i.sku || "") === sku)) || items.find((i) => i.productId === productId) || null;
  },
  async bulkUpdateStock(_sellerId: string, updates: { productId: string; stock: number; variantId?: string; sku?: string }[]): Promise<InventoryItem[]> {
    if (updates.length === 0) return [];
    for (const u of updates) {
      const pid = String(u.productId || "");
      if (!pid) continue;
      await api<any>(`/api/v1/vendor/inventory/${pid}`, {
        method: "PATCH",
        body: JSON.stringify({
          stock: Math.max(0, Number(u.stock || 0)),
          ...(u.variantId ? { variantId: u.variantId } : {}),
          ...(u.sku ? { sku: u.sku } : {}),
          reason: "manual_stock_update",
        }),
      });
    }
    const refreshed = await this.getInventory(_sellerId);
    const wanted = new Set(updates.map((u) => String(u.productId || "")));
    return refreshed.filter((i) => wanted.has(String(i.productId || "")));
  },
  async getStockHistory(_sellerId: string): Promise<StockHistoryEntry[]> {
    const data = await api<any>(`/api/v1/vendor/inventory/history?limit=50`);
    const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    return rows.map((r: any) => {
      const rawType = String(r.type || "ADJUSTMENT").toUpperCase();
      const type = rawType === "IN" ? "IN" : rawType === "OUT" ? "OUT" : "ADJUST";
      return {
        id: r.id || String(r._id || `${r.productId}:${r.createdAt || Math.random()}`),
        productId: String(r.productId || ""),
        productName: r.productName || "Product",
        type,
        quantity: Math.abs(Number(r.quantity || 0)),
        reason: r.reason || "",
        referenceId: r.referenceId || r.orderId || r.subOrderId,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      } as StockHistoryEntry;
    });
  },
  async searchInventory(_sellerId: string, query: string): Promise<InventoryItem[]> {
    const data = await api<any>(`/api/v1/vendor/inventory?search=${encodeURIComponent(query)}&limit=200`);
    const rows = Array.isArray(data?.data) ? data.data : [];
    return rows.map(mapItem);
  },
};
