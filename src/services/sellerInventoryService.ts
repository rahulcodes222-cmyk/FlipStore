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
  } as InventoryItem;
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
  async updateStock(_sellerId: string, productId: string, stock: number): Promise<InventoryItem | null> {
    await api<any>(`/api/v1/vendor/inventory/${productId}`, { method: "PATCH", body: JSON.stringify({ stock, reason: "manual_stock_update" }) });
    const items = await this.getInventory(_sellerId);
    return items.find((i) => i.productId === productId) || null;
  },
  async bulkUpdateStock(_sellerId: string, updates: { productId: string; stock: number }[]): Promise<InventoryItem[]> {
    const results: InventoryItem[] = [];
    for (const u of updates) { const r = await this.updateStock("", u.productId, u.stock); if (r) results.push(r); }
    return results;
  },
  async getStockHistory(_sellerId: string): Promise<StockHistoryEntry[]> {
    const data = await api<any>(`/api/v1/vendor/inventory/history?limit=50`);
    const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    return rows.map((r: any) => ({ id: r.id || String(r._id), productId: r.productId, productName: r.productName || "Product", type: r.type || "ADJUSTMENT", quantity: Number(r.quantity || 0), reason: r.reason || "", referenceId: r.referenceId, createdAt: r.createdAt || new Date().toISOString() })) as StockHistoryEntry[];
  },
  async searchInventory(_sellerId: string, query: string): Promise<InventoryItem[]> {
    const data = await api<any>(`/api/v1/vendor/inventory?search=${encodeURIComponent(query)}&limit=200`);
    const rows = Array.isArray(data?.data) ? data.data : [];
    return rows.map(mapItem);
  },
};
