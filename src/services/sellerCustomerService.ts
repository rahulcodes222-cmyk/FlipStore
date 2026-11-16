import type { SellerCustomer } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include", headers: { "Content-Type": "application/json", ...(init?.headers || {}) }, ...init });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) throw new Error(json?.message || json?.error?.message || `Request failed (${res.status})`);
  return (json?.data ?? json) as T;
}

function mapCustomer(c: any): SellerCustomer {
  return { id: c.id || c._id || "", name: c.name || "Customer", email: c.email || "", phone: c.phone || "", totalOrders: Number(c.totalOrders || 0), totalSpending: Number(c.totalSpending || 0), lastOrderDate: c.lastOrderDate || new Date().toISOString(), location: c.location || "", avatar: c.avatar || "" };
}

export const sellerCustomerService = {
  async getCustomers(_sellerId: string): Promise<SellerCustomer[]> {
    const data = await api<any>(`/api/v1/vendor/customers?limit=100`);
    const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    return rows.map(mapCustomer);
  },
  async getCustomer(sellerId: string, customerId: string): Promise<SellerCustomer | null> {
    const all = await this.getCustomers(sellerId);
    return all.find((c) => c.id === customerId) || null;
  },
  async searchCustomers(_sellerId: string, query: string): Promise<SellerCustomer[]> {
    const data = await api<any>(`/api/v1/vendor/customers?search=${encodeURIComponent(query)}&limit=100`);
    const rows = Array.isArray(data?.data) ? data.data : [];
    return rows.map(mapCustomer);
  },
};
