import type { SellerReturn } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include", headers: { "Content-Type": "application/json", ...(init?.headers || {}) }, ...init });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) throw new Error(json?.message || json?.error?.message || `Request failed (${res.status})`);
  return (json?.data ?? json) as T;
}

function mapReturn(r: any): SellerReturn {
  return {
    id: r.id || r._id || "",
    returnNumber: r.returnNumber || "",
    orderId: r.orderId || "",
    orderNumber: r.orderNumber || "",
    customerName: r.customerName || "",
    customerEmail: r.customerEmail || "",
    productId: r.productId || "",
    productName: r.productName || "",
    productImage: r.productImage || r.thumbnail || "",
    quantity: Number(r.quantity || 1),
    reason: r.reason || "",
    status: (r.status || "PENDING") as any,
    requestDate: r.requestDate || r.createdAt || new Date().toISOString(),
    resolvedAt: r.resolvedAt,
    refundAmount: Number(r.refundAmount || 0),
    notes: r.notes || "",
  };
}

export const sellerReturnService = {
  async getReturns(_sellerId: string): Promise<SellerReturn[]> {
    const data = await api<any>(`/api/v1/vendor/returns`);
    const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    return rows.map(mapReturn);
  },
  async getReturn(sellerId: string, returnId: string): Promise<SellerReturn | null> {
    const all = await this.getReturns(sellerId);
    return all.find((r) => r.id === returnId) || null;
  },
  async updateReturnStatus(_sellerId: string, returnId: string, status: "APPROVED" | "REJECTED" | "PROCESSING" | "COMPLETED"): Promise<SellerReturn | null> {
    const r = await api<any>(`/api/v1/vendor/returns/${returnId}`, { method: "PATCH", body: JSON.stringify({ status }) });
    return r ? mapReturn(r) : null;
  },
  async getReturnStats(sellerId: string) {
    const returns = await this.getReturns(sellerId);
    return { total: returns.length, pending: returns.filter((r) => r.status === "PENDING").length, approved: returns.filter((r) => r.status === "APPROVED").length, rejected: returns.filter((r) => r.status === "REJECTED").length, totalRefund: returns.reduce((sum, r) => sum + (r.refundAmount || 0), 0) };
  },
};
