import type { Seller, SellerStats, SellerOrder, TopProduct, LowStockProduct, SalesDataPoint, RevenueDataPoint } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const DASHBOARD_SESSION_KEY = "my_ecommerce_seller_session_v1";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include", headers: { "Content-Type": "application/json", ...(init?.headers || {}) }, ...init });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) throw new Error(json?.message || json?.error?.message || `Request failed (${res.status})`);
  return (json?.data ?? json) as T;
}

function getSessionSeller(): Seller | null {
  if (typeof window === "undefined") return null;
  try { const raw = localStorage.getItem(DASHBOARD_SESSION_KEY); return raw ? (JSON.parse(raw) as Seller) : null; } catch { return null; }
}

function mapOrder(o: any): SellerOrder {
  const items = o.items || [];
  const first = items[0] || {};
  const totalAmount = Number(o.pricing?.totalAmount ?? o.totalAmount ?? items.reduce((s: number, i: any) => s + Number(i.price || 0) * Number(i.quantity || 1), 0));
  return {
    id: o.id || o.subOrderId || o._id,
    orderNumber: o.orderNumber || o.subOrderNumber || "",
    customerName: o.customerName || "Customer",
    customerAvatar: o.customerAvatar,
    productName: items.length > 1 ? `${first.title || first.productName || "Product"} +${items.length - 1} more` : (first.title || first.productName || "Product"),
    productImage: first.thumbnail || first.image || "",
    quantity: items.reduce((s: number, i: any) => s + Number(i.quantity || 1), 0) || 1,
    totalAmount,
    paymentStatus: (o.paymentStatus || "PENDING") as any,
    orderStatus: (o.orderStatus || "PLACED") as any,
    orderDate: o.placedAt || o.orderDate || new Date().toISOString(),
  };
}

export const sellerDashboardService = {
  async getSeller(_sellerId: string): Promise<Seller | null> {
    try { const data = await api<any>("/api/v1/vendors/store"); const session = getSessionSeller(); return session ? { ...session, storeName: data?.storeName || session.storeName, storeSlug: data?.storeSlug || session.storeSlug } : session; } catch { return getSessionSeller(); }
  },
  async getStats(_sellerId: string): Promise<SellerStats> {
    try {
      const [ordersRes, productsRes, customersRes] = await Promise.all([api<any>("/api/v1/vendor/orders?limit=100"), api<any>("/api/v1/vendor/products?limit=100"), api<any>("/api/v1/vendor/customers?limit=100")]);
      const orders = Array.isArray(ordersRes?.data) ? ordersRes.data : [];
      const products = Array.isArray(productsRes?.data) ? productsRes.data : [];
      const customers = Array.isArray(customersRes?.data) ? customersRes.data : [];
      const totalRevenue = orders.filter((o: any) => ["PAID"].includes(o.paymentStatus) || ["DELIVERED"].includes(o.orderStatus)).reduce((s: number, o: any) => s + Number(o.pricing?.totalAmount || 0), 0);
      const pendingOrders = orders.filter((o: any) => ["PLACED","CONFIRMED","PROCESSING","PACKED","SHIPPED","OUT_FOR_DELIVERY"].includes(o.orderStatus)).length;
      const cancelledOrders = orders.filter((o: any) => o.orderStatus === "CANCELLED").length;
      return { totalRevenue, totalOrders: orders.length, totalProducts: products.length, totalCustomers: customers.length, pendingOrders, cancelledOrders, availableBalance: totalRevenue, totalEarnings: totalRevenue };
    } catch {
      return { totalRevenue: 0, totalOrders: 0, totalProducts: 0, totalCustomers: 0, pendingOrders: 0, cancelledOrders: 0, availableBalance: 0, totalEarnings: 0 };
    }
  },
  async getOrders(_sellerId: string): Promise<SellerOrder[]> {
    const data = await api<any>("/api/v1/vendor/orders?limit=20");
    const rows = Array.isArray(data?.data) ? data.data : [];
    return rows.map(mapOrder);
  },
  async getTopProducts(_sellerId: string): Promise<TopProduct[]> {
    const data = await api<any>("/api/v1/vendor/products?limit=20");
    const rows = Array.isArray(data?.data) ? data.data : [];
    return rows.slice().sort((a: any, b: any) => Number(b.unitsSold || 0) - Number(a.unitsSold || 0)).slice(0, 5).map((p: any) => ({ id: p.id, name: p.name || p.title, image: p.thumbnail || p.images?.[0]?.url || "", unitsSold: Number(p.unitsSold || 0), revenue: Number(p.totalRevenue || 0), stock: Number(p.stock || 0), inStock: Number(p.stock || 0) > 0 }));
  },
  async getLowStock(_sellerId: string): Promise<LowStockProduct[]> {
    const data = await api<any>("/api/v1/vendor/inventory?limit=200");
    const rows = Array.isArray(data?.data) ? data.data : [];
    return rows.filter((i: any) => i.status === "LOW_STOCK" || i.status === "OUT_OF_STOCK").slice(0, 10).map((i: any) => ({ id: i.productId || i.id, name: i.productName || i.name, image: i.image || "", stock: Number(i.stock || 0), threshold: Number(i.lowStockThreshold || 0) }));
  },
  async getSalesData(_sellerId: string): Promise<SalesDataPoint[]> {
    try {
      const data = await api<any>("/api/v1/vendor/orders?limit=100");
      const orders = Array.isArray(data?.data) ? data.data : [];
      const byDate = new Map<string, { sales: number; orders: number }>();
      for (const o of orders) {
        const d = new Date(o.placedAt || Date.now());
        const key = d.toISOString().slice(0, 10);
        const cur = byDate.get(key) || { sales: 0, orders: 0 };
        cur.sales += Number(o.pricing?.totalAmount || 0); cur.orders += 1; byDate.set(key, cur);
      }
      return Array.from(byDate.entries()).sort(([a],[b]) => a.localeCompare(b)).slice(-14).map(([date, v]) => ({ name: date, sales: v.sales, orders: v.orders, revenue: v.sales }));
    } catch { return []; }
  },
  async getRevenueData(_sellerId: string): Promise<RevenueDataPoint[]> {
    const sales = await this.getSalesData(_sellerId);
    return sales.map((s) => ({ name: s.name, revenue: s.revenue }));
  },
  async getCurrentSeller(): Promise<Seller | null> { return getSessionSeller(); },
};
