/**
 * Shiprocket shipping integration (token auth, order creation, AWB assignment, tracking).
 * Best-effort: failures are logged/returned so order status flows remain functional.
 */

import { env } from '@/backend/config/env';
import { logger } from '@/backend/utils/logger';

type ShiprocketTokenCache = { token: string; expiresAt: number } | null;
let tokenCache: ShiprocketTokenCache = null;

export function isShiprocketConfigured(): boolean {
  return !!(env.shiprocketEmail && env.shiprocketPassword);
}

function getBaseUrl(): string {
  return (env.shiprocketApiBase || 'https://apiv2.shiprocket.in/v1/external').replace(/\/$/, '');
}

async function shiprocketFetch(path: string, init: RequestInit & { auth?: boolean } = {}, retryAuth = true): Promise<any> {
  const base = getBaseUrl();
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> || {}),
  };
  if (init.auth !== false) {
    const token = await getShiprocketToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...init, headers, cache: 'no-store' });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }

  if (res.status === 401 && init.auth !== false && retryAuth) {
    tokenCache = null;
    return shiprocketFetch(path, init, false);
  }
  if (!res.ok) {
    const msg = json?.message || json?.errors?.[0] || json?.error || `Shiprocket request failed (${res.status})`;
    const err: any = new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    err.status = res.status;
    err.payload = json;
    throw err;
  }
  return json;
}

export async function getShiprocketToken(force = false): Promise<string | null> {
  if (!isShiprocketConfigured()) return null;
  const now = Date.now();
  if (!force && tokenCache && tokenCache.expiresAt > now + 60_000) return tokenCache.token;
  try {
    const res = await fetch(`${getBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: env.shiprocketEmail, password: env.shiprocketPassword }),
      cache: 'no-store',
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.token) {
      logger.warn('Shiprocket auth failed', { status: res.status, message: json?.message });
      return null;
    }
    // Shiprocket tokens are typically valid ~10 days; cache conservatively for 9 days
    tokenCache = { token: String(json.token), expiresAt: now + 9 * 24 * 60 * 60 * 1000 };
    return tokenCache.token;
  } catch (error) {
    logger.warn('Shiprocket auth error', { error: (error as Error)?.message });
    return null;
  }
}

function num(v: any, d = 0): number { const n = Number(v); return Number.isFinite(n) ? n : d; }
function str(v: any, d = ''): string { const s = v == null ? '' : String(v).trim(); return s || d; }
function splitName(full: string): { first: string; last: string } {
  const parts = str(full, 'Customer').split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first: parts[0] || 'Customer', last: '.' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

export interface ShiprocketShipmentResult {
  shiprocketOrderId?: string | number;
  shiprocketShipmentId?: string | number;
  awbCode?: string;
  courierName?: string;
  trackingUrl?: string;
  labelUrl?: string;
  manifestUrl?: string;
  pickupScheduledAt?: string;
  raw?: any;
}

export async function createShiprocketShipmentForSubOrder(params: {
  order: any;
  subOrder: any;
  shippingAddress: any;
  seller?: any;
  vendor?: any;
}): Promise<ShiprocketShipmentResult | null> {
  if (!isShiprocketConfigured()) return null;
  const { order, subOrder, shippingAddress, seller, vendor } = params;

  const pickupLocation = str(process.env.SHIPROCKET_PICKUP_LOCATION || vendor?.storeProfile?.storeName || vendor?.storeName || 'Primary', 'Primary');
  const addr = shippingAddress || {};
  const billingName = str(addr.name || order?.customerName, 'Customer');
  const { first: bFirst, last: bLast } = splitName(billingName);
  const items = Array.isArray(subOrder?.items) ? subOrder.items : [];
  const orderItems = items.map((it: any, idx: number) => ({
    name: str(it?.title || it?.name || `Item ${idx + 1}`).slice(0, 100),
    sku: str(it?.sku || it?.id || it?.productId || `SKU-${idx + 1}`).slice(0, 50),
    units: Math.max(1, num(it?.quantity, 1)),
    selling_price: Math.max(0, num(it?.price, 0)),
    discount: 0,
    tax: 0,
    hsn: '',
  }));
  if (orderItems.length === 0) return null;

  const subTotal = Math.max(0, num(subOrder?.pricing?.totalAmount, items.reduce((s: number, i: any) => s + num(i.price) * num(i.quantity, 1), 0)));
  const weight = Math.max(0.1, num(process.env.SHIPROCKET_DEFAULT_WEIGHT, 0.5));
  const length = Math.max(1, num(process.env.SHIPROCKET_DEFAULT_LENGTH, 10));
  const breadth = Math.max(1, num(process.env.SHIPROCKET_DEFAULT_BREADTH, 10));
  const height = Math.max(1, num(process.env.SHIPROCKET_DEFAULT_HEIGHT, 10));

  const orderDate = new Date(order?.placedAt || subOrder?.placedAt || Date.now());
  const yyyy = orderDate.getFullYear();
  const mm = String(orderDate.getMonth() + 1).padStart(2, '0');
  const dd = String(orderDate.getDate()).padStart(2, '0');
  const hh = String(orderDate.getHours()).padStart(2, '0');
  const mi = String(orderDate.getMinutes()).padStart(2, '0');

  const payload: any = {
    order_id: str(subOrder?.subOrderNumber || subOrder?._id || order?.orderNumber),
    order_date: `${yyyy}-${mm}-${dd} ${hh}:${mi}`,
    pickup_location: pickupLocation,
    channel_id: process.env.SHIPROCKET_CHANNEL_ID || '',
    comment: str(subOrder?.subOrderNumber ? `SubOrder ${subOrder.subOrderNumber}` : ''),
    billing_customer_name: bFirst,
    billing_last_name: bLast,
    billing_address: str(addr.street || addr.addressLine1 || addr.locality || 'Address'),
    billing_address_2: str(addr.landmark || addr.locality || ''),
    billing_city: str(addr.city, 'City'),
    billing_pincode: str(addr.pincode, ''),
    billing_state: str(addr.state, 'State'),
    billing_country: str(addr.country || 'India'),
    billing_email: str(order?.customerEmail || seller?.email || 'customer@example.com'),
    billing_phone: str(addr.phone || order?.customerPhone || '9999999999').replace(/\D/g, '').slice(-10) || '9999999999',
    shipping_is_billing: true,
    shipping_customer_name: '',
    shipping_last_name: '',
    shipping_address: '',
    shipping_address_2: '',
    shipping_city: '',
    shipping_pincode: '',
    shipping_country: '',
    shipping_state: '',
    shipping_email: '',
    shipping_phone: '',
    order_items: orderItems,
    payment_method: String(order?.paymentMethod || subOrder?.paymentMethod || '').toUpperCase() === 'COD' ? 'COD' : 'Prepaid',
    shipping_charges: Math.max(0, num(subOrder?.pricing?.deliveryCharges, 0)),
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: Math.max(0, num(subOrder?.pricing?.discount, 0) + num(subOrder?.pricing?.couponDiscount, 0)),
    sub_total: subTotal,
    length,
    breadth,
    height,
    weight,
  };
  if (!payload.channel_id) delete payload.channel_id;

  try {
    const created = await shiprocketFetch('/orders/create/adhoc', { method: 'POST', body: JSON.stringify(payload) });
    const shipmentId = created?.shipment_id || created?.payload?.shipment_id || created?.data?.shipment_id;
    const srOrderId = created?.order_id || created?.payload?.order_id || created?.data?.order_id;

    let awbCode = created?.awb_code || created?.payload?.awb_code || '';
    let courierName = created?.courier_name || created?.payload?.courier_name || str(process.env.SHIPROCKET_DEFAULT_COURIER, 'Shiprocket');
    let trackingUrl = '';
    let labelUrl = '';
    let pickupScheduledAt = '';

    if (shipmentId && !awbCode) {
      try {
        const awbRes = await shiprocketFetch('/courier/assign/awb', {
          method: 'POST',
          body: JSON.stringify({ shipment_id: shipmentId, courier_id: process.env.SHIPROCKET_COURIER_ID || undefined }),
        });
        const awbData = awbRes?.response?.data || awbRes?.data || awbRes || {};
        awbCode = awbData.awb_code || awbData.awb || awbCode;
        courierName = awbData.courier_name || awbData.courier_company_id || courierName;
        pickupScheduledAt = awbData.pickup_scheduled_date || awbData.pickup_date || '';
        try {
          const labelRes = await shiprocketFetch('/courier/generate/label', { method: 'POST', body: JSON.stringify({ shipment_id: [shipmentId] }) });
          labelUrl = labelRes?.label_url || labelRes?.label_created || labelRes?.response?.label_url || '';
        } catch {}
      } catch (e) {
        logger.warn('Shiprocket AWB assignment failed', { shipmentId, subOrderId: subOrder?._id, error: (e as Error)?.message });
      }
    }

    if (awbCode) {
      trackingUrl = `https://shiprocket.co/tracking/${encodeURIComponent(String(awbCode))}`;
    }

    return {
      shiprocketOrderId: srOrderId,
      shiprocketShipmentId: shipmentId,
      awbCode: awbCode || undefined,
      courierName: courierName || undefined,
      trackingUrl: trackingUrl || undefined,
      labelUrl: labelUrl || undefined,
      pickupScheduledAt: pickupScheduledAt || undefined,
      raw: { create: created },
    };
  } catch (error) {
    logger.warn('Shiprocket shipment creation failed', { subOrderId: subOrder?._id, orderId: order?._id, error: (error as Error)?.message });
    return null;
  }
}

export async function trackShiprocketByAwb(awbCode: string): Promise<any | null> {
  if (!isShiprocketConfigured() || !awbCode) return null;
  try {
    return await shiprocketFetch(`/courier/track/awb/${encodeURIComponent(awbCode)}`, { method: 'GET' });
  } catch (error) {
    logger.warn('Shiprocket tracking fetch failed', { awbCode, error: (error as Error)?.message });
    return null;
  }
}

function pickNumber(...vals: any[]): number | null {
  for (const v of vals) {
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return null;
}

function extractCourierFreight(c: any): number | null {
  return pickNumber(
    c?.freight_charge,
    c?.total_charge,
    c?.rate,
    c?.shipping_charge,
    c?.delivery_charge,
    c?.charge,
    c?.price,
    c?.cost,
  );
}

export async function getShiprocketDeliveryRate(params: {
  deliveryPincode: string;
  pickupPincode?: string;
  weightKg?: number;
  cod?: boolean;
  declaredValue?: number;
}): Promise<{ charge: number; courierName?: string; courierCompanyId?: string | number; estimatedDays?: string | number; raw?: any } | null> {
  if (!isShiprocketConfigured()) return null;
  const deliveryPincode = str(params.deliveryPincode, '').replace(/\D/g, '').slice(0, 6);
  if (!/^\d{6}$/.test(deliveryPincode)) return null;

  const pickupPincode = str(params.pickupPincode || process.env.SHIPROCKET_PICKUP_PINCODE || process.env.SHIPROCKET_PICKUP_POSTCODE || process.env.NEXT_PUBLIC_SHIPROCKET_PICKUP_PINCODE, '').replace(/\D/g, '').slice(0, 6);
  // If pickup pincode is unknown, serviceability/rate API is unreliable; skip to preserve safe fallback.
  if (!/^\d{6}$/.test(pickupPincode)) {
    logger.debug?.('Shiprocket rate skipped: pickup pincode not configured');
    return null;
  }

  const weight = Math.max(0.1, num(params.weightKg, num(process.env.SHIPROCKET_DEFAULT_WEIGHT, 0.5)));
  const length = Math.max(1, num(process.env.SHIPROCKET_DEFAULT_LENGTH, 10));
  const breadth = Math.max(1, num(process.env.SHIPROCKET_DEFAULT_BREADTH, 10));
  const height = Math.max(1, num(process.env.SHIPROCKET_DEFAULT_HEIGHT, 10));
  const cod = params.cod ? 1 : 0;
  const declared = Math.max(0, num(params.declaredValue, 0));

  try {
    const qs = new URLSearchParams({
      pickup_postcode: pickupPincode,
      delivery_postcode: deliveryPincode,
      weight: String(weight),
      cod: String(cod),
      length: String(length),
      breadth: String(breadth),
      height: String(height),
      ...(declared > 0 ? { declared_value: String(declared) } : {}),
    });
    const res = await shiprocketFetch(`/courier/serviceability/?${qs.toString()}`, { method: 'GET' });

    const root = res?.data || res?.response?.data || res || {};
    const companiesRaw = root?.available_courier_companies || root?.available_couriers || root?.courier_data || root?.couriers || root?.recommended_courier_company;
    const companies = Array.isArray(companiesRaw) ? companiesRaw : companiesRaw && typeof companiesRaw === 'object' ? [companiesRaw] : [];

    const candidates = companies
      .map((c: any) => {
        const charge = extractCourierFreight(c);
        if (charge == null) return null;
        return {
          charge: Math.max(0, round2(charge)),
          courierName: str(c?.courier_name || c?.name || c?.company_name, '') || undefined,
          courierCompanyId: c?.courier_company_id ?? c?.id,
          estimatedDays: c?.estimated_delivery_days || c?.etd || c?.edd || c?.delivery_days,
          raw: c,
        };
      })
      .filter(Boolean) as Array<{ charge: number; courierName?: string; courierCompanyId?: string | number; estimatedDays?: string | number; raw?: any }>;

    if (!candidates.length) {
      // Some responses expose a direct freight/rate at root
      const rootCharge = extractCourierFreight(root);
      if (rootCharge != null) return { charge: Math.max(0, round2(rootCharge)), raw: root };
      return null;
    }

    candidates.sort((a, b) => a.charge - b.charge);
    return candidates[0];
  } catch (error) {
    logger.warn('Shiprocket rate calculation failed', { deliveryPincode, pickupPincode, error: (error as Error)?.message });
    return null;
  }
}

function round2(n: number): number { return Math.round(n * 100) / 100; }
