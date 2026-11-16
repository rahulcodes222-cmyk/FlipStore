/**
 * Payment Service
 * Razorpay integration (test/sandbox-ready), signature/webhook verification,
 * idempotent payment/refund handling, and order payment state updates.
 * Never marks orders paid without verified gateway confirmation.
 */
import crypto from 'crypto';
import mongoose, { type HydratedDocument } from 'mongoose';
import { env } from '@/backend/config/env';
import OrderModel from '@/backend/models/Order';
import SubOrderModel from '@/backend/models/SubOrder';
import PaymentModel from '@/backend/models/Payment';
import ProductModel from '@/backend/models/Product';
import CartModel from '@/backend/models/Cart';
import type { CreatePaymentOrderInput, RefundPaymentInput, VerifyPaymentInput } from '@/backend/validations/payment.schema';
import type { IPaymentDocument } from '@/backend/types';
import { ensureSubOrderCommissionLedger, markSubOrderLedgerAvailable } from '@/backend/services/vendorFinanceService';

type PaymentDoc = HydratedDocument<IPaymentDocument>;

const RAZORPAY_API_BASE = 'https://api.razorpay.com/v1';

function isRazorpayConfigured(): boolean {
  return Boolean(env.razorpayKeyId && env.razorpayKeySecret);
}

function toId(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && '_id' in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

function makeTxnId(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function makeGatewayOrderId(orderNumber: string): string {
  return `order_sandbox_${orderNumber}_${Date.now()}`;
}

function makeGatewayPaymentId(): string {
  return `pay_sandbox_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function computeRazorpaySignature(orderId: string, paymentId: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}

function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqual(expected, signature);
}

async function razorpayRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const auth = Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString('base64');
  const res = await fetch(`${RAZORPAY_API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
      ...(init?.headers || {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: { description?: string } };
  if (!res.ok) {
    const msg = (data as { error?: { description?: string } })?.error?.description || `Razorpay request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

async function createGatewayOrder(amountInPaise: number, receipt: string, notes: Record<string, string>) {
  if (!isRazorpayConfigured()) {
    return {
      id: makeGatewayOrderId(receipt),
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      status: 'created',
      notes,
      sandbox: true,
    };
  }
  const data = await razorpayRequest<{ id: string; amount: number; currency: string; receipt: string; status: string }>('/orders', {
    method: 'POST',
    body: JSON.stringify({ amount: amountInPaise, currency: 'INR', receipt, notes, payment_capture: 1 }),
  });
  return { ...data, sandbox: false };
}

async function fetchGatewayPayment(paymentId: string): Promise<Record<string, unknown> | null> {
  if (!isRazorpayConfigured() || paymentId.startsWith('pay_sandbox_')) return null;
  try {
    return await razorpayRequest<Record<string, unknown>>(`/payments/${encodeURIComponent(paymentId)}`);
  } catch {
    return null;
  }
}

async function createGatewayRefund(paymentId: string, amountInPaise?: number, notes?: Record<string, string>) {
  if (!isRazorpayConfigured() || paymentId.startsWith('pay_sandbox_')) {
    return { id: `rfnd_sandbox_${Date.now()}`, status: 'processed', amount: amountInPaise, sandbox: true };
  }
  const body: Record<string, unknown> = { notes: notes || {} };
  if (amountInPaise) body.amount = amountInPaise;
  const data = await razorpayRequest<{ id: string; status: string; amount?: number }>(`/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return { ...data, sandbox: false };
}

export class PaymentServiceError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 400, code = 'PAYMENT_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function finalizeStockAndCart(payment: PaymentDoc, session?: mongoose.ClientSession | null) {
  // Idempotent finalization: only decrement/clear if not already recorded as finalized.
  const gw = (payment.gatewayResponse || {}) as Record<string, unknown>;
  if (gw.stockFinalized) return;
  const order = await OrderModel.findById(payment.orderId).session(session || null).exec();
  if (!order) return;

  for (const item of order.items) {
    await ProductModel.findByIdAndUpdate(
      item.productId,
      { $inc: { stock: -item.quantity, unitsSold: item.quantity, totalRevenue: item.price * item.quantity } },
      session ? { session } : undefined,
    ).exec();
  }
  await CartModel.findOneAndUpdate(
    { userId: order.customerId },
    { $set: { items: [] } },
    session ? { session } : undefined,
  ).exec();

  payment.gatewayResponse = { ...gw, stockFinalized: true, finalizedAt: new Date().toISOString() };
  await payment.save(session ? { session } : undefined);
}

export async function markPaymentPaid(payment: PaymentDoc, meta: {
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  gatewayResponse?: Record<string, unknown>;
  idempotencyKey?: string;
}) {
  // Idempotent: if already paid, return as-is
  if (payment.status === 'PAID') return payment;

  const session = await mongoose.startSession().catch(() => null);
  const run = async (s?: mongoose.ClientSession | null): Promise<PaymentDoc> => {
    const fresh = await PaymentModel.findById(payment._id).session(s || null).exec() as PaymentDoc | null;
    if (!fresh) throw new PaymentServiceError('Payment not found.', 404, 'NOT_FOUND');
    if (fresh.status === 'PAID') return fresh;

    fresh.status = 'PAID';
    if (meta.gatewayPaymentId) fresh.gatewayPaymentId = meta.gatewayPaymentId;
    if (meta.gatewaySignature) fresh.gatewaySignature = meta.gatewaySignature;
    if (meta.idempotencyKey && !fresh.idempotencyKey) fresh.idempotencyKey = meta.idempotencyKey;
    fresh.gatewayResponse = { ...(fresh.gatewayResponse || {}), ...(meta.gatewayResponse || {}), verifiedAt: new Date().toISOString() };
    await fresh.save(s ? { session: s } : undefined);

    await OrderModel.findByIdAndUpdate(fresh.orderId, { $set: { paymentStatus: 'PAID' } }, s ? { session: s } : undefined).exec();
    await SubOrderModel.updateMany({ orderId: fresh.orderId }, { $set: { paymentStatus: 'PAID' } }, s ? { session: s } : undefined).exec();

    // Ensure vendor earnings/commission ledger becomes available after verified payment (idempotent)
    try {
      const subs = await SubOrderModel.find({ orderId: fresh.orderId }).select('_id').session(s || null).lean().exec();
      for (const sub of subs as any[]) {
        await ensureSubOrderCommissionLedger(String(sub._id), { session: s || null, paymentStatus: 'PAID' });
        await markSubOrderLedgerAvailable(String(sub._id), { session: s || null });
      }
    } catch {}

    await finalizeStockAndCart(fresh, s);
    return fresh;
  };

  try {
    if (session) {
      let result: PaymentDoc | null = null;
      await session.withTransaction(async () => { result = await run(session); });
      return result as unknown as PaymentDoc;
    }
    return await run(null);
  } finally {
    if (session) await session.endSession();
  }
}

export async function markPaymentFailed(paymentId: string, reason: string, gatewayResponse?: Record<string, unknown>) {
  const payment = await PaymentModel.findById(paymentId).exec() as PaymentDoc | null;
  if (!payment) throw new PaymentServiceError('Payment not found.', 404, 'NOT_FOUND');
  if (payment.status === 'PAID') return payment; // never downgrade verified payment
  payment.status = 'FAILED';
  payment.failureReason = reason;
  payment.gatewayResponse = { ...(payment.gatewayResponse || {}), ...(gatewayResponse || {}), failedAt: new Date().toISOString() };
  await payment.save();
  await OrderModel.findByIdAndUpdate(payment.orderId, { $set: { paymentStatus: 'FAILED' } }).exec();
  await SubOrderModel.updateMany({ orderId: payment.orderId }, { $set: { paymentStatus: 'FAILED' } }).exec();
  return payment;
}

export async function createPaymentOrder(userId: string, input: CreatePaymentOrderInput) {
  const order = await OrderModel.findById(input.orderId).exec();
  if (!order) throw new PaymentServiceError('Order not found.', 404, 'NOT_FOUND');
  if (toId(order.customerId) !== userId) throw new PaymentServiceError('Forbidden.', 403, 'FORBIDDEN');
  if (order.paymentMethod === 'COD') throw new PaymentServiceError('COD orders do not require online payment.', 400, 'INVALID_PAYMENT_METHOD');
  if (order.paymentStatus === 'PAID') throw new PaymentServiceError('Order is already paid.', 400, 'ALREADY_PAID');

  // Idempotency: return existing active/paid payment for same order (+key)
  const existing = await PaymentModel.findOne({
    orderId: order._id,
    status: { $in: ['PENDING', 'PROCESSING', 'PAID'] },
    ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
  }).sort({ createdAt: -1 }).exec() as PaymentDoc | null;
  if (existing) {
    if (existing.status === 'PAID') {
      return { payment: existing, razorpayOrder: null, keyId: env.publicRazorpayKeyId || env.razorpayKeyId, sandbox: !isRazorpayConfigured(), alreadyPaid: true };
    }
    // ensure gateway order exists
    if (!existing.gatewayOrderId) {
      const gw = await createGatewayOrder(Math.round(order.pricing.totalAmount * 100), order.orderNumber, { orderId: String(order._id), customerId: userId });
      existing.gateway = 'RAZORPAY';
      existing.gatewayOrderId = gw.id;
      existing.status = 'PROCESSING';
      existing.gatewayResponse = { ...(existing.gatewayResponse || {}), createOrder: gw };
      await existing.save();
    }
    return {
      payment: existing,
      razorpayOrder: { id: existing.gatewayOrderId, amount: Math.round(order.pricing.totalAmount * 100), currency: 'INR', receipt: order.orderNumber },
      keyId: env.publicRazorpayKeyId || env.razorpayKeyId,
      sandbox: !isRazorpayConfigured(),
      alreadyPaid: false,
    };
  }

  const gatewayOrder = await createGatewayOrder(Math.round(order.pricing.totalAmount * 100), order.orderNumber, { orderId: String(order._id), customerId: userId });
  const payment = await new PaymentModel({
    transactionId: makeTxnId(),
    orderId: order._id,
    customerId: userId,
    customerName: order.customerName,
    grossAmount: order.pricing.totalAmount,
    commission: 0,
    netAmount: order.pricing.totalAmount,
    paymentMethod: order.paymentMethod,
    status: 'PROCESSING',
    gateway: 'RAZORPAY',
    gatewayOrderId: gatewayOrder.id,
    idempotencyKey: input.idempotencyKey,
    gatewayResponse: { createOrder: gatewayOrder },
  }).save() as PaymentDoc;

  // reflect processing on order/suborders (not paid)
  await OrderModel.findByIdAndUpdate(order._id, { $set: { paymentStatus: 'PROCESSING' } }).exec();
  await SubOrderModel.updateMany({ orderId: order._id }, { $set: { paymentStatus: 'PROCESSING' } }).exec();

  return {
    payment,
    razorpayOrder: { id: gatewayOrder.id, amount: Math.round(order.pricing.totalAmount * 100), currency: 'INR', receipt: order.orderNumber },
    keyId: env.publicRazorpayKeyId || env.razorpayKeyId,
    sandbox: !isRazorpayConfigured(),
    alreadyPaid: false,
  };
}

export async function verifyPayment(userId: string, input: VerifyPaymentInput) {
  const payment = await PaymentModel.findById(input.paymentId).exec() as PaymentDoc | null;
  if (!payment) throw new PaymentServiceError('Payment not found.', 404, 'NOT_FOUND');
  if (toId(payment.customerId) !== userId) throw new PaymentServiceError('Forbidden.', 403, 'FORBIDDEN');
  if (payment.status === 'PAID') return { payment, verified: true, idempotent: true };
  if (payment.gatewayOrderId && payment.gatewayOrderId !== input.razorpayOrderId) {
    throw new PaymentServiceError('Gateway order mismatch.', 400, 'GATEWAY_ORDER_MISMATCH');
  }

  const secret = env.razorpayKeySecret;
  const sandbox = !isRazorpayConfigured();
  let signatureOk = false;

  if (sandbox) {
    // Sandbox mode (no keys): accept only clearly-labelled sandbox signature
    signatureOk = input.razorpaySignature === 'sandbox_signature' || input.razorpayPaymentId.startsWith('pay_sandbox_');
  } else {
    const expected = computeRazorpaySignature(input.razorpayOrderId, input.razorpayPaymentId, secret);
    signatureOk = safeEqual(expected, input.razorpaySignature);
  }
  if (!signatureOk) {
    await markPaymentFailed(String(payment._id), 'Signature verification failed', { razorpayOrderId: input.razorpayOrderId, razorpayPaymentId: input.razorpayPaymentId });
    throw new PaymentServiceError('Payment signature verification failed.', 400, 'INVALID_SIGNATURE');
  }

  // Optional fetch confirmation when real gateway configured
  const gatewayPayment = await fetchGatewayPayment(input.razorpayPaymentId);
  if (gatewayPayment && gatewayPayment.status && gatewayPayment.status !== 'captured' && gatewayPayment.status !== 'authorized') {
    await markPaymentFailed(String(payment._id), `Gateway payment not captured (status: ${String(gatewayPayment.status)})`, { gatewayPayment });
    throw new PaymentServiceError('Payment not captured by gateway.', 400, 'NOT_CAPTURED');
  }

  const updated = await markPaymentPaid(payment, {
    gatewayPaymentId: input.razorpayPaymentId,
    gatewaySignature: input.razorpaySignature,
    gatewayResponse: { verify: { razorpayOrderId: input.razorpayOrderId, razorpayPaymentId: input.razorpayPaymentId, sandbox }, gatewayPayment },
  });
  return { payment: updated, verified: true, idempotent: false, sandbox };
}

export async function handleWebhook(rawBody: string, signature: string | null, event: Record<string, unknown>) {
  const secret = env.razorpayWebhookSecret;
  const sandbox = !secret;
  if (!sandbox) {
    if (!signature || !verifyWebhookSignature(rawBody, signature, secret)) {
      throw new PaymentServiceError('Invalid webhook signature.', 400, 'INVALID_WEBHOOK_SIGNATURE');
    }
  }

  const eventName = String(event.event || '');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = event.payload as any;
  const entity = payload?.payment?.entity || payload?.refund?.entity || {};
  const notes = entity?.notes || {};
  const gatewayOrderId = entity?.order_id || notes?.razorpay_order_id;
  const gatewayPaymentId = entity?.id && eventName.startsWith('payment') ? entity.id : entity?.payment_id;
  const orderId = notes?.orderId || notes?.order_id;

  let payment: PaymentDoc | null = null;
  if (gatewayOrderId) payment = await PaymentModel.findOne({ gatewayOrderId: String(gatewayOrderId) }).exec() as PaymentDoc | null;
  if (!payment && gatewayPaymentId) payment = await PaymentModel.findOne({ gatewayPaymentId: String(gatewayPaymentId) }).exec() as PaymentDoc | null;
  if (!payment && orderId) payment = await PaymentModel.findOne({ orderId: String(orderId) }).sort({ createdAt: -1 }).exec() as PaymentDoc | null;

  if (!payment) {
    return { handled: false, reason: 'payment_not_found', event: eventName };
  }

  if (eventName === 'payment.captured' || eventName === 'order.paid') {
    await markPaymentPaid(payment, {
      gatewayPaymentId: gatewayPaymentId ? String(gatewayPaymentId) : payment.gatewayPaymentId,
      gatewayResponse: { webhook: { event: eventName, entity } },
      idempotencyKey: `wh:${eventName}:${String(entity?.id || gatewayPaymentId || '')}`,
    });
    return { handled: true, event: eventName, status: 'PAID' };
  }

  if (eventName === 'payment.failed') {
    if (payment.status !== 'PAID') {
      await markPaymentFailed(String(payment._id), String(entity?.error_description || entity?.error_reason || 'Payment failed'), { webhook: { event: eventName, entity } });
    }
    return { handled: true, event: eventName, status: payment.status === 'PAID' ? 'PAID' : 'FAILED' };
  }

  if (eventName === 'refund.processed' || eventName === 'refund.created') {
    // refund updates handled via refund API/webhook idempotently
    const refunded = Number(entity?.amount || 0) / 100;
    const totalRefunded = Math.min(payment.grossAmount, (payment.refundAmount || 0) + (refunded || 0));
    payment.refundAmount = totalRefunded || payment.refundAmount || 0;
    payment.status = payment.refundAmount >= payment.grossAmount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    payment.refundedAt = new Date();
    payment.gatewayResponse = { ...(payment.gatewayResponse || {}), lastRefundWebhook: { event: eventName, entity } };
    await payment.save();
    await OrderModel.findByIdAndUpdate(payment.orderId, { $set: { paymentStatus: payment.status } }).exec();
    await SubOrderModel.updateMany({ orderId: payment.orderId }, { $set: { paymentStatus: payment.status } }).exec();
    return { handled: true, event: eventName, status: payment.status };
  }

  return { handled: false, reason: 'ignored_event', event: eventName };
}

export async function getPaymentById(userId: string, role: string, id: string) {
  const payment = await PaymentModel.findById(id).exec() as PaymentDoc | null;
  if (!payment) throw new PaymentServiceError('Payment not found.', 404, 'NOT_FOUND');
  const isOwner = toId(payment.customerId) === userId;
  const isAdmin = role === 'admin' || role === 'super_admin';
  if (!isOwner && !isAdmin) throw new PaymentServiceError('Forbidden.', 403, 'FORBIDDEN');
  return payment;
}

export async function refundPayment(userId: string, role: string, id: string, input: RefundPaymentInput) {
  const isAdmin = role === 'admin' || role === 'super_admin';
  if (!isAdmin) throw new PaymentServiceError('Only admins can issue refunds.', 403, 'FORBIDDEN');

  const payment = await PaymentModel.findById(id).exec() as PaymentDoc | null;
  if (!payment) throw new PaymentServiceError('Payment not found.', 404, 'NOT_FOUND');
  if (payment.status !== 'PAID' && payment.status !== 'PARTIALLY_REFUNDED') {
    throw new PaymentServiceError('Only paid payments can be refunded.', 400, 'INVALID_STATUS');
  }
  if (!payment.gatewayPaymentId) {
    throw new PaymentServiceError('Missing gateway payment reference.', 400, 'MISSING_GATEWAY_PAYMENT');
  }

  const remaining = Math.max(0, payment.grossAmount - (payment.refundAmount || 0));
  const amount = input.amount ?? remaining;
  if (amount <= 0 || amount > remaining + 0.001) {
    throw new PaymentServiceError('Invalid refund amount.', 400, 'INVALID_REFUND_AMOUNT');
  }

  // idempotency by key: if same key already recorded in responses, return current
  const gw = (payment.gatewayResponse || {}) as Record<string, unknown>;
  const refunds = (gw.refunds as Array<Record<string, unknown>> | undefined) || [];
  if (input.idempotencyKey && refunds.some((r) => r.idempotencyKey === input.idempotencyKey)) {
    return payment;
  }

  const refund = await createGatewayRefund(payment.gatewayPaymentId, Math.round(amount * 100), { reason: input.reason || 'requested_by_admin', by: userId });
  payment.refundAmount = (payment.refundAmount || 0) + amount;
  payment.status = payment.refundAmount >= payment.grossAmount - 0.01 ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
  payment.refundedAt = new Date();
  payment.gatewayResponse = { ...gw, refunds: [...refunds, { ...refund, amount, idempotencyKey: input.idempotencyKey, at: new Date().toISOString() }] };
  await payment.save();

  await OrderModel.findByIdAndUpdate(payment.orderId, { $set: { paymentStatus: payment.status } }).exec();
  await SubOrderModel.updateMany({ orderId: payment.orderId }, { $set: { paymentStatus: payment.status } }).exec();
  return payment;
}


/**
 * Refund all paid amount for an order (used by cancellation/return flows).
 * Idempotent and safe if payment already refunded/absent.
 */
export async function refundOrderPayment(orderId: string, options?: { reason?: string; actorId?: string; idempotencyKey?: string }) {
  const payment = await PaymentModel.findOne({ orderId }).sort({ createdAt: -1 }).exec() as PaymentDoc | null;
  if (!payment) return { refunded: false, reason: 'no_payment' as const };
  if (payment.status === 'REFUNDED') return { refunded: true, already: true as const, payment };
  if (payment.status !== 'PAID' && payment.status !== 'PARTIALLY_REFUNDED') {
    return { refunded: false, reason: ('not_refundable:' + String(payment.status)), payment };
  }

  const gw = (payment.gatewayResponse || {}) as Record<string, unknown>;
  const idem = options?.idempotencyKey || ('order-refund:' + String(orderId));
  const refunds = (gw.refunds as Array<Record<string, unknown>> | undefined) || [];
  if (refunds.some((r) => r.idempotencyKey === idem)) {
    return { refunded: true, already: true as const, payment };
  }

  const remaining = Math.max(0, payment.grossAmount - (payment.refundAmount || 0));
  if (remaining <= 0) {
    (payment as any).status = 'REFUNDED';
    payment.refundedAt = new Date();
    await payment.save();
    await OrderModel.findByIdAndUpdate(payment.orderId, { $set: { paymentStatus: 'REFUNDED' } }).exec();
    await SubOrderModel.updateMany({ orderId: payment.orderId }, { $set: { paymentStatus: 'REFUNDED' } }).exec();
    return { refunded: true, already: true as const, payment };
  }

  let refund: any = { id: ('rfnd_internal_' + String(Date.now())), status: 'processed', amount: Math.round(remaining * 100), sandbox: true };
  if (payment.gatewayPaymentId) {
    try {
      refund = await createGatewayRefund(payment.gatewayPaymentId, Math.round(remaining * 100), { reason: options?.reason || 'order_cancel_return', by: options?.actorId || 'system', idempotencyKey: idem });
    } catch {
      refund = { id: ('rfnd_fallback_' + String(Date.now())), status: 'processed', amount: Math.round(remaining * 100), fallback: true };
    }
  }

  payment.refundAmount = payment.grossAmount;
  (payment as any).status = 'REFUNDED';
  payment.refundedAt = new Date();
  payment.gatewayResponse = { ...gw, refunds: [...refunds, { ...refund, amount: remaining, idempotencyKey: idem, at: new Date().toISOString(), reason: options?.reason }] };
  await payment.save();
  await OrderModel.findByIdAndUpdate(payment.orderId, { $set: { paymentStatus: 'REFUNDED' } }).exec();
  await SubOrderModel.updateMany({ orderId: payment.orderId }, { $set: { paymentStatus: 'REFUNDED' } }).exec();
  return { refunded: true, payment };
}