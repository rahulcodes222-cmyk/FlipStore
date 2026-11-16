/**
 * Order Service (Frontend)
 * Encapsulates checkout and order operations.
 * Connects to backend APIs under /api/v1/checkout and /api/v1/orders.
 */

import { Order, PaymentMethod } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export interface CheckoutSummaryResponse {
  items: Array<{
    productId: string;
    variantId?: string;
    productName?: string;
    thumbnail?: string;
    price: number;
    mrp?: number;
    quantity: number;
    sellerId?: string;
    selectedVariants?: Record<string, string>;
  }>;
  summary: {
    totalMrp: number;
    discount: number;
    subtotal?: number;
    couponDiscount: number;
    deliveryCharges: number;
    taxAmount?: number;
    totalAmount: number;
    totalQuantity?: number;
  };
}



function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem("my_ecommerce_access_token_v1"); } catch { return null; }
}
function setStoredAccessToken(token?: string): void {
  if (typeof window === "undefined") return;
  try { if (token) window.localStorage.setItem("my_ecommerce_access_token_v1", token); } catch {}
}
function withAuthHeaders(init: RequestInit = {}): RequestInit {
  const token = getStoredAccessToken();
  const headers = new Headers(init.headers || {});
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
  return { ...init, headers };
}

async function tryRefreshAuth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, withAuthHeaders({
      method: "POST",
      credentials: "include",
    }));
    if (!res.ok) return false;
    const body = await res.json().catch(() => ({} as any));
    const token = body?.data?.accessToken || body?.accessToken;
    if (token) setStoredAccessToken(token);
    return true;
  } catch {
    return false;
  }
}

async function fetchWithAuthRetry(input: RequestInfo | URL, init: RequestInit = {}, canRetry = true): Promise<Response> {
  const reqInit = withAuthHeaders({ credentials: "include", ...init });
  const res = await fetch(input, reqInit);
  if (res.status === 401 && canRetry) {
    const refreshed = await tryRefreshAuth();
    if (refreshed) return fetch(input, withAuthHeaders({ credentials: "include", ...init }));
  }
  return res;
}

export interface CreateOrderResponse {
  id: string;
  orderNumber: string;
  status?: string;
  paymentStatus?: string;
  pricing: {
    totalMrp: number;
    discount: number;
    couponDiscount: number;
    deliveryCharges: number;
    totalAmount: number;
  };
  placedAt: string;
}

function toIsoString(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  const d = new Date(value as string | number);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export const orderService = {
  async getCheckoutSummary(payload: {
    shippingAddressId: string;
    paymentMethod: PaymentMethod;
    couponCode?: string;
    items: Array<{
      productId: string;
      variantId?: string;
      quantity: number;
    }>;
  }): Promise<CheckoutSummaryResponse & { appliedCoupon?: any }> {
    const res = await fetchWithAuthRetry(`${API_BASE}/api/v1/checkout/summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cartItems: payload.items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        shippingAddressId: payload.shippingAddressId,
        paymentMethod: payload.paymentMethod,
        ...(payload.couponCode?.trim() ? { couponCode: payload.couponCode.trim() } : {}),
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.success === false) {
      throw new Error(json?.message || json?.error?.message || "Failed to calculate checkout summary.");
    }
    return json.data as CheckoutSummaryResponse & { appliedCoupon?: any };
  },

  async validateCoupon(payload: {
    couponCode: string;
    shippingAddressId: string;
    items: Array<{ productId: string; variantId?: string; quantity: number }>;
  }): Promise<CheckoutSummaryResponse & { appliedCoupon?: any }> {
    const res = await fetchWithAuthRetry(`${API_BASE}/api/v1/checkout/validate-coupon`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        couponCode: payload.couponCode.trim(),
        shippingAddressId: payload.shippingAddressId,
        cartItems: payload.items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.success === false) {
      throw new Error(json?.message || json?.error?.message || "Invalid coupon code.");
    }
    return json.data as CheckoutSummaryResponse & { appliedCoupon?: any };
  },

  async createOrder(payload: {
    shippingAddressId: string;
    paymentMethod: PaymentMethod;
    couponCode?: string;
    cartItems?: Array<{ productId: string; variantId?: string; quantity: number }>;
  }): Promise<CreateOrderResponse> {
    const res = await fetchWithAuthRetry(`${API_BASE}/api/v1/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.success === false) {
      throw new Error(json?.message || json?.error?.message || "Failed to create order.");
    }
    return json.data as CreateOrderResponse;
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    const res = await fetchWithAuthRetry(`${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}`, {
      method: "GET",
    });

    const json = await res.json().catch(() => ({}));
    if (res.status === 404) return null;
    if (!res.ok || json?.success === false) {
      throw new Error(json?.message || json?.error?.message || "Failed to fetch order.");
    }

    const data = (json.data || json) as Record<string, any>;
    return {
      id: data.id || data._id || orderId,
      orderNumber: data.orderNumber || orderId,
      userId: data.userId || data.customerId || "",
      items: (data.items || []) as Order["items"],
      shippingAddress: data.shippingAddress as Order["shippingAddress"],
      paymentMethod: data.paymentMethod as Order["paymentMethod"],
      paymentStatus: (data.paymentStatus || "PENDING") as Order["paymentStatus"],
      orderStatus: (data.orderStatus || "PLACED") as Order["orderStatus"],
      pricing: data.pricing as Order["pricing"],
      placedAt: toIsoString(data.placedAt),
      estimatedDelivery: toIsoString(data.estimatedDelivery || Date.now() + 3 * 24 * 60 * 60 * 1000),
      deliveredAt: data.deliveredAt ? toIsoString(data.deliveredAt) : undefined,
      cancelledAt: data.cancelledAt ? toIsoString(data.cancelledAt) : undefined,
      cancelReason: data.cancelReason,
      appliedCouponId: data.appliedCouponId,
      statusHistory: data.statusHistory || [],
      shipments: data.shipments || [],
      tracking: data.tracking,
      returns: data.returns || [],
      invoice: data.invoice,
    } as unknown as Order;
  },

  async getOrders(): Promise<Order[]> {
    const res = await fetchWithAuthRetry(`${API_BASE}/api/v1/orders/my-orders`, {
      method: "GET",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.success === false) {
      return [];
    }
    const list = (json.data || []) as Record<string, any>[];
    return list.map((data) => ({
      id: data.id || data._id || "",
      orderNumber: data.orderNumber || data.subOrderNumber || "",
      userId: data.userId || data.customerId || "",
      items: (data.items || []) as Order["items"],
      shippingAddress: data.shippingAddress as Order["shippingAddress"],
      paymentMethod: data.paymentMethod as Order["paymentMethod"],
      paymentStatus: (data.paymentStatus || "PENDING") as Order["paymentStatus"],
      orderStatus: (data.orderStatus || "PLACED") as Order["orderStatus"],
      pricing: data.pricing as Order["pricing"],
      placedAt: toIsoString(data.placedAt),
      estimatedDelivery: toIsoString(data.estimatedDelivery || Date.now() + 3 * 24 * 60 * 60 * 1000),
      deliveredAt: data.deliveredAt ? toIsoString(data.deliveredAt) : undefined,
      cancelledAt: data.cancelledAt ? toIsoString(data.cancelledAt) : undefined,
      cancelReason: data.cancelReason,
      appliedCouponId: data.appliedCouponId,
      statusHistory: data.statusHistory || [],
      shipments: data.shipments || [],
      tracking: data.tracking,
      returns: data.returns || [],
      invoice: data.invoice,
    })) as Order[];
  },

  async getOrderTracking(orderId: string): Promise<any> {
    const res = await fetchWithAuthRetry(`${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}/tracking`, {
      method: "GET",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.success === false) {
      throw new Error(json?.message || json?.error?.message || "Failed to fetch tracking.");
    }
    return json.data;
  },

  async getInvoice(orderId: string): Promise<any> {
    const res = await fetchWithAuthRetry(`${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}/invoice`, {
      method: "GET",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.success === false) {
      throw new Error(json?.message || json?.error?.message || "Failed to fetch invoice.");
    }
    return json.data;
  },

  async createReturn(payload: { orderId: string; productId: string; quantity?: number; reason: string; type?: 'RETURN' | 'REPLACEMENT'; notes?: string; subOrderId?: string }): Promise<any> {
    const res = await fetchWithAuthRetry(`${API_BASE}/api/v1/returns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.success === false) {
      throw new Error(json?.message || json?.error?.message || "Failed to create return request.");
    }
    return json.data;
  },

  async getMyReturns(): Promise<any[]> {
    const res = await fetchWithAuthRetry(`${API_BASE}/api/v1/returns/my-returns`, { method: "GET" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.success === false) return [];
    return (json.data || []) as any[];
  },

  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    const res = await fetchWithAuthRetry(`${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}/cancel`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reason ? { reason } : {}),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.success === false) {
      throw new Error(json?.message || json?.error?.message || "Failed to cancel order.");
    }
    const data = json.data || json;
    return (await this.getOrderById(data.orderNumber || data.id || orderId)) as Order;
  },

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    const res = await fetchWithAuthRetry(`${API_BASE}/api/v1/orders/${encodeURIComponent(orderId)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.success === false) {
      throw new Error(json?.message || json?.error?.message || "Failed to update order status.");
    }
    const data = json.data || json;
    return (await this.getOrderById(data.orderNumber || data.id || orderId)) as Order;
  },
};
