/**
 * Payment API client (Razorpay test/sandbox-ready)
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export type CreatePaymentOrderResponse = {
  paymentId: string;
  transactionId: string;
  status: string;
  razorpayOrderId?: string;
  amount: number;
  currency: string;
  keyId: string;
  sandbox: boolean;
  alreadyPaid: boolean;
  razorpayOrder?: { id: string; amount: number; currency: string; receipt: string } | null;
};

export type VerifyPaymentResponse = {
  paymentId: string;
  status: string;
  orderId: string;
  verified: boolean;
  idempotent: boolean;
  sandbox: boolean;
};

async function unwrap<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || json?.error?.message || 'Payment request failed.');
  }
  return (json?.data ?? json) as T;
}

export async function createPaymentOrder(orderId: string, idempotencyKey?: string): Promise<CreatePaymentOrderResponse> {
  const res = await fetch(`${API_BASE}/api/v1/payments/create-order`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, idempotencyKey }),
  });
  return unwrap<CreatePaymentOrderResponse>(res);
}

export async function verifyPayment(input: {
  paymentId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<VerifyPaymentResponse> {
  const res = await fetch(`${API_BASE}/api/v1/payments/verify`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return unwrap<VerifyPaymentResponse>(res);
}

export async function getPayment(id: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}/api/v1/payments/${encodeURIComponent(id)}`, {
    method: 'GET',
    credentials: 'include',
  });
  return unwrap<unknown>(res);
}
