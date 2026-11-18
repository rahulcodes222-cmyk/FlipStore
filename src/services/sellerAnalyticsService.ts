import type {
  AnalyticsDataPoint,
  CategorySalesData,
  ProductPerformanceData,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

type DateRange = { from?: string; to?: string };

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || json?.error?.message || `Request failed (${res.status})`);
  }
  return (json?.data ?? json) as T;
}

function toDateKey(value: any): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function clamp01to100(n: number) {
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
}

function inRange(dateKey: string, range?: DateRange) {
  if (!range) return true;
  if (range.from && dateKey < range.from) return false;
  if (range.to && dateKey > range.to) return false;
  return true;
}

async function fetchVendorOrders(): Promise<any[]> {
  const ordersRes = await api<any>("/api/v1/vendor/orders?limit=200");
  return Array.isArray(ordersRes?.data) ? ordersRes.data : Array.isArray(ordersRes) ? ordersRes : [];
}

async function fetchVendorProducts(): Promise<any[]> {
  try {
    const res = await api<any>("/api/v1/vendor/products?limit=200");
    return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

async function fetchVendorCustomers(): Promise<any[]> {
  try {
    const res = await api<any>("/api/v1/vendor/customers?limit=200");
    return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
  } catch {
    return [];
  }
}

async function fetchVendorProductsMap(): Promise<Map<string, { category: string; name: string; image: string }>> {
  try {
    const rows = await fetchVendorProducts();
    const map = new Map<string, { category: string; name: string; image: string }>();
    for (const p of rows) {
      const id = String(p?.id || p?._id || "").trim();
      if (!id) continue;
      map.set(id, {
        category: String(p?.category || p?.subcategory || "Other").trim() || "Other",
        name: String(p?.name || p?.title || "Product"),
        image: String(p?.thumbnail || p?.images?.[0]?.url || ""),
      });
    }
    return map;
  } catch {
    return new Map();
  }
}

export const sellerAnalyticsService = {
  async getAnalyticsData(_sellerId: string, range?: DateRange): Promise<AnalyticsDataPoint[]> {
    try {
      const qs = new URLSearchParams();
      if (range?.from) qs.set("from", range.from);
      if (range?.to) qs.set("to", range.to);
      const [earningsRes, orders] = await Promise.all([
        api<any>(`/api/v1/vendor/earnings${qs.toString() ? `?${qs.toString()}` : ""}`),
        fetchVendorOrders(),
      ]);

      const dateWise = Array.isArray(earningsRes?.dateWise || earningsRes?.reports)
        ? (earningsRes?.dateWise || earningsRes?.reports)
        : [];

      const ordersByDate = new Map<string, { orders: number; customers: Set<string> }>();
      for (const o of orders) {
        const key = toDateKey(o?.placedAt || o?.createdAt);
        if (!key || !inRange(key, range)) continue;
        const entry = ordersByDate.get(key) || { orders: 0, customers: new Set<string>() };
        entry.orders += 1;
        const cid = String(o?.customerId || o?.customerName || "").trim();
        if (cid) entry.customers.add(cid);
        ordersByDate.set(key, entry);
      }

      if (dateWise.length > 0) {
        const points = dateWise
          .map((d: any) => {
            const key = String(d?.date || "").slice(0, 10);
            if (!key || !inRange(key, range)) return null;
            const o = ordersByDate.get(key);
            const revenue = Number(d?.grossSales ?? d?.netEarnings ?? 0);
            const ordersCount = o?.orders ?? 0;
            const customersCount = o?.customers?.size ?? 0;
            return {
              date: key,
              revenue: Math.round(revenue),
              orders: ordersCount,
              customers: customersCount,
              conversionRate: ordersCount > 0 ? clamp01to100(Number(((ordersCount / Math.max(1, customersCount || ordersCount)) * 100).toFixed(1))) : 0,
            } as AnalyticsDataPoint;
          })
          .filter(Boolean) as AnalyticsDataPoint[];

        for (const [key, v] of ordersByDate.entries()) {
          if (points.some((p) => p.date === key)) continue;
          points.push({
            date: key,
            revenue: 0,
            orders: v.orders,
            customers: v.customers.size,
            conversionRate: v.customers.size > 0 ? clamp01to100(Number(((v.orders / v.customers.size) * 100).toFixed(1))) : 0,
          });
        }

        return points.sort((a, b) => a.date.localeCompare(b.date));
      }

      const byDate = new Map<string, { revenue: number; orders: number; customers: Set<string> }>();
      for (const o of orders) {
        const key = toDateKey(o?.placedAt || o?.createdAt);
        if (!key || !inRange(key, range)) continue;
        const e = byDate.get(key) || { revenue: 0, orders: 0, customers: new Set<string>() };
        e.revenue += Number(o?.pricing?.totalAmount || 0);
        e.orders += 1;
        const cid = String(o?.customerId || o?.customerName || "").trim();
        if (cid) e.customers.add(cid);
        byDate.set(key, e);
      }
      return Array.from(byDate.entries())
        .map(([date, v]) => ({
          date,
          revenue: Math.round(v.revenue),
          orders: v.orders,
          customers: v.customers.size,
          conversionRate: v.customers.size > 0 ? clamp01to100(Number(((v.orders / v.customers.size) * 100).toFixed(1))) : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch {
      return [];
    }
  },

  async getCategorySales(_sellerId: string, range?: DateRange): Promise<CategorySalesData[]> {
    try {
      const [orders, productMap] = await Promise.all([fetchVendorOrders(), fetchVendorProductsMap()]);
      const map = new Map<string, { category: string; revenue: number; orders: number; unitsSold: number }>();
      for (const o of orders) {
        const oKey = toDateKey(o?.placedAt || o?.createdAt);
        if (!oKey || !inRange(oKey, range)) continue;
        const items = Array.isArray(o?.items) ? o.items : [];
        for (const it of items) {
          const pid = String(it?.productId || "").trim();
          const pInfo = pid ? productMap.get(pid) : undefined;
          const category = String(it?.category || it?.productCategory || pInfo?.category || "Other").trim() || "Other";
          const qty = Math.max(1, Number(it?.quantity || 1));
          const revenue = Number(it?.price || 0) * qty;
          const row = map.get(category) || { category, revenue: 0, orders: 0, unitsSold: 0 };
          row.revenue += revenue;
          row.orders += 1;
          row.unitsSold += qty;
          map.set(category, row);
        }
      }
      const rows = Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
      const total = rows.reduce((s, r) => s + r.revenue, 0) || 1;
      return rows.map((r) => ({
        ...r,
        revenue: Math.round(r.revenue),
        sharePercentage: Number(((r.revenue / total) * 100).toFixed(1)),
      }));
    } catch {
      return [];
    }
  },

  async getProductPerformance(_sellerId: string, range?: DateRange): Promise<ProductPerformanceData[]> {
    try {
      const [orders, productMap] = await Promise.all([fetchVendorOrders(), fetchVendorProductsMap()]);
      const map = new Map<string, ProductPerformanceData>();
      for (const o of orders) {
        const oKey = toDateKey(o?.placedAt || o?.createdAt);
        if (!oKey || !inRange(oKey, range)) continue;
        const items = Array.isArray(o?.items) ? o.items : [];
        for (const it of items) {
          const productId = String(it?.productId || it?.id || it?.title || "product");
          const pInfo = productMap.get(String(it?.productId || ""));
          const qty = Math.max(1, Number(it?.quantity || 1));
          const revenue = Number(it?.price || 0) * qty;
          const existing = map.get(productId) || {
            productId,
            productName: String(it?.title || it?.productName || pInfo?.name || "Product"),
            productImage: String(it?.thumbnail || pInfo?.image || ""),
            revenue: 0,
            unitsSold: 0,
            orders: 0,
            conversionRate: 0,
            rating: 0,
          };
          existing.revenue += revenue;
          existing.unitsSold += qty;
          existing.orders += 1;
          if (!existing.productImage && (it?.thumbnail || pInfo?.image)) existing.productImage = String(it?.thumbnail || pInfo?.image || "");
          if ((!existing.productName || existing.productName === "Product") && (it?.title || it?.productName || pInfo?.name)) {
            existing.productName = String(it?.title || it?.productName || pInfo?.name);
          }
          map.set(productId, existing);
        }
      }
      return Array.from(map.values())
        .map((p) => ({ ...p, revenue: Math.round(p.revenue) }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 20);
    } catch {
      return [];
    }
  },

  async getAnalyticsSummary(_sellerId: string, range?: DateRange) {
    try {
      const qs = new URLSearchParams();
      if (range?.from) qs.set("from", range.from);
      if (range?.to) qs.set("to", range.to);
      const [earningsRes, orders, customers, products] = await Promise.all([
        api<any>(`/api/v1/vendor/earnings${qs.toString() ? `?${qs.toString()}` : ""}`),
        fetchVendorOrders(),
        fetchVendorCustomers(),
        fetchVendorProducts(),
      ]);
      const filteredOrders = orders.filter((o) => {
        const key = toDateKey(o?.placedAt || o?.createdAt);
        return key && inRange(key, range);
      });

      // Prefer seller-wide counts for products/customers; fall back to period/order-derived values.
      const totalProducts = Array.isArray(products) ? products.length : 0;
      const periodCustomerIds = new Set<string>();
      for (const o of filteredOrders) {
        const cid = String(o?.customerId || "").trim();
        if (cid) periodCustomerIds.add(cid);
      }
      const totalCustomers = customers.length > 0 ? customers.length : periodCustomerIds.size;
      const totalRevenue = Number(
        earningsRes?.grossRevenue ?? earningsRes?.grossSales ?? earningsRes?.totalRevenue ?? earningsRes?.netEarnings ?? 0
      );
      const totalOrders = filteredOrders.length;
      const categorySales = await this.getCategorySales(_sellerId, range);
      return {
        totalRevenue: Math.round(totalRevenue),
        totalOrders,
        totalProducts,
        totalCustomers,
        avgConversion: periodCustomerIds.size > 0 ? Number(((totalOrders / periodCustomerIds.size) * 100).toFixed(1)) : 0,
        topCategory: categorySales.length > 0 ? categorySales[0].category : "N/A",
      };
    } catch {
      return { totalRevenue: 0, totalOrders: 0, totalProducts: 0, totalCustomers: 0, avgConversion: 0, topCategory: "N/A" };
    }
  },
};
