import type { SellerOrderDetail, SellerOrderStatus } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include", headers: { "Content-Type": "application/json", ...(init?.headers || {}) }, ...init });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) throw new Error(json?.message || json?.error?.message || `Request failed (${res.status})`);
  return (json?.data ?? json) as T;
}

function toTimeline(statusHistory: any[] = [], current: string): any[] {
  const flow = ["PLACED","CONFIRMED","PROCESSING","PACKED","SHIPPED","OUT_FOR_DELIVERY","DELIVERED","CANCELLED","RETURN_REQUESTED","RETURNED","REFUNDED"];
  const idx = flow.indexOf(current);
  if (statusHistory.length) return statusHistory.map((h, i) => ({ id: `tl-${i}`, status: h.status, title: String(h.status || "").replace(/_/g, " "), description: h.note || "", date: h.timestamp || new Date().toISOString(), isCompleted: true }));
  return flow.slice(0, Math.max(1, idx + 1)).map((s, i) => ({ id: `tl-${i}`, status: s, title: s.replace(/_/g, " "), description: "", date: new Date().toISOString(), isCompleted: flow.indexOf(s) <= idx }));
}

function mapDetail(o: any): SellerOrderDetail {
  const items = (o.items || []).map((it: any) => ({ productId: it.productId, title: it.title || it.productName, thumbnail: it.thumbnail || "", price: Number(it.price || 0), mrp: Number(it.mrp || it.price || 0), quantity: Number(it.quantity || 1), selectedVariants: it.selectedVariants || {} }));
  const addr = o.shippingAddress || {};
  return {
    id: o.id || o._id,
    orderNumber: o.orderNumber || o.subOrderNumber || "",
    customerName: o.customerName || "Customer",
    customerEmail: o.customerEmail || "",
    customerPhone: o.customerPhone || "",
    customerAddress: { id: addr.id || "", name: addr.name || o.customerName || "", phone: addr.phone || "", pincode: addr.pincode || "", locality: addr.locality || "", street: addr.street || "", city: addr.city || "", state: addr.state || "", type: (addr.type as any) || "home", isDefault: !!addr.isDefault },
    items,
    paymentMethod: (o.paymentMethod || "COD") as any,
    paymentStatus: (o.paymentStatus || "PENDING") as any,
    orderStatus: (o.orderStatus || "PLACED") as SellerOrderStatus,
    pricing: o.pricing || { totalMrp: 0, discount: 0, couponDiscount: 0, deliveryCharges: 0, totalAmount: items.reduce((s: number, i: any) => s + i.price * i.quantity, 0) },
    placedAt: o.placedAt || new Date().toISOString(),
    estimatedDelivery: o.estimatedDelivery || new Date().toISOString(),
    deliveredAt: o.deliveredAt,
    timeline: toTimeline(o.statusHistory || o.timeline || [], o.orderStatus || "PLACED"),
  } as SellerOrderDetail;
}

export const sellerOrderService = {
  async getOrders(_sellerId: string) {
    const data = await api<any>(`/api/v1/vendor/orders?limit=100`);
    return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  },
  async getOrderDetail(orderId: string, _sellerId: string): Promise<SellerOrderDetail | null> {
    const o = await api<any>(`/api/v1/vendor/orders/${orderId}`);
    return o ? mapDetail(o) : null;
  },
  async updateOrderStatus(orderId: string, _sellerId: string, status: SellerOrderStatus): Promise<SellerOrderDetail | null> {
    await api<any>(`/api/v1/vendor/orders/${orderId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    return this.getOrderDetail(orderId, _sellerId);
  },
  async getTimelineStatuses(): Promise<SellerOrderStatus[]> {
    return ["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"] as SellerOrderStatus[];
  },
};
