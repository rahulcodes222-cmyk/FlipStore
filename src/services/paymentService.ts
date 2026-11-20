/**
 * Payment API client (Razorpay/Cashfree, sandbox-ready)
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export type CreatePaymentOrderResponse = {
  paymentId: string;
  transactionId: string;
  status: string;
  amount: number;
  currency: string;
  keyId: string;
  sandbox: boolean;
  alreadyPaid: boolean;
  gateway?: 'RAZORPAY' | 'CASHFREE' | string;
  // Razorpay
  razorpayOrderId?: string;
  razorpayOrder?: { id: string; amount: number; currency: string; receipt: string } | null;
  // Cashfree
  cashfreeOrderId?: string;
  paymentSessionId?: string;
  cashfreeOrderToken?: string;
  orderToken?: string;
  cashfreeEnv?: 'sandbox' | 'production' | string;
};

export type VerifyPaymentResponse = {
  paymentId: string;
  status: string;
  orderId: string;
  verified: boolean;
  idempotent: boolean;
  sandbox: boolean;
  gateway?: 'RAZORPAY' | 'CASHFREE' | string;
};

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

async function unwrap<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || json?.error?.message || 'Payment request failed.');
  }
  return (json?.data ?? json) as T;
}

export async function createPaymentOrder(orderId: string, idempotencyKey?: string): Promise<CreatePaymentOrderResponse> {
  const res = await fetchWithAuthRetry(`${API_BASE}/api/v1/payments/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, idempotencyKey }),
  });
  return unwrap<CreatePaymentOrderResponse>(res);
}

export async function verifyPayment(input: {
  paymentId: string;
  // Razorpay
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  // Cashfree / generic
  gateway?: string;
  gatewayOrderId?: string;
  cashfreeOrderId?: string;
}): Promise<VerifyPaymentResponse> {
  const res = await fetchWithAuthRetry(`${API_BASE}/api/v1/payments/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return unwrap<VerifyPaymentResponse>(res);
}

export async function getPayment(id: string): Promise<unknown> {
  const res = await fetchWithAuthRetry(`${API_BASE}/api/v1/payments/${encodeURIComponent(id)}`, {
    method: 'GET',
  });
  return unwrap<unknown>(res);
}
