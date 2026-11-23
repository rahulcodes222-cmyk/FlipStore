/**
 * Order Service - Checkout, order management, tracking, cancellation, returns (Part 8/10)
 * Prices/totals computed from DB records only. Status transitions validated server-side.
 */
import mongoose from 'mongoose';
import {
  OrderModel,
  SubOrderModel,
  ProductModel,
  CartModel,
  UserModel,
  AddressModel,
  CommissionModel,
  ShipmentModel,
  ReturnRequestModel,
  PaymentModel,
  CouponModel,
  VendorModel,
  SellerStoreModel,
} from '@/backend/models';
import type { CheckoutSummaryInput, CreateOrderInput } from '@/backend/validations/checkout.schema';
import type { IProductDocument } from '@/backend/types';
import { USER_ROLES } from '@/backend/constants/roles';
import { refundOrderPayment } from '@/backend/services/paymentService';
import { ensureSubOrderCommissionLedger, markSubOrderLedgerAvailable, applyRefundReversalForSubOrder } from '@/backend/services/vendorFinanceService';
import { createShiprocketShipmentForSubOrder, isShiprocketConfigured, getShiprocketDeliveryRate } from '@/backend/services/shiprocketService';
import { getDeliverySettings } from '@/backend/services/platformSettingsService';
import { logger } from '@/backend/utils/logger';

const ORDER_FLOW = ['PENDING', 'PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'] as const;
type OrderStatusValue = typeof ORDER_FLOW[number] | 'CANCELLED' | 'RETURN_REQUESTED' | 'RETURNED' | 'REFUNDED';

const CUSTOMER_CANCELABLE = new Set(['PENDING', 'PLACED', 'CONFIRMED', 'PROCESSING', 'PACKED']);
const VENDOR_ALLOWED = new Set(['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED']);
const ADMIN_ALLOWED = new Set(ORDER_FLOW.concat(['CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED'] as any));

function round2(n: number): number { return Math.round(n * 100) / 100; }
function generateOrderNumber(): string { return `ORD${Date.now().toString().slice(-8)}${Math.floor(100 + Math.random() * 900)}`.toUpperCase(); }
function generateSubOrderNumber(): string { return `SUB${Date.now().toString().slice(-8)}${Math.floor(10 + Math.random() * 90)}`.toUpperCase(); }
function generateReturnNumber(): string { return `RET${Date.now().toString().slice(-8)}${Math.floor(100 + Math.random() * 900)}`.toUpperCase(); }

function isValidObjectId(id: string): boolean {
  return mongoose.isValidObjectId(String(id || ''));
}

async function resolveOrCreateShippingAddress(userId: string, shippingAddressId: string, session?: mongoose.ClientSession | null): Promise<any> {
  const id = String(shippingAddressId || '').trim();
  if (isValidObjectId(id)) {
    const q = AddressModel.findOne({ _id: id, userId });
    const addr = session ? await q.session(session).lean().exec() : await q.lean().exec();
    if (addr) return addr;
  }

  // Try embedded user addresses (legacy shape)
  const user: any = await (session ? UserModel.findById(userId).session(session).lean().exec() : UserModel.findById(userId).lean().exec());
  const embedded = Array.isArray(user?.addresses) ? user.addresses : [];
  const match = embedded.find((a: any) => String(a?.id || a?._id || '') === id) || embedded.find((a: any) => a?.isDefault) || embedded[0];

  const src = match || {
    name: user?.name || 'Customer',
    phone: user?.phone || '9999999999',
    pincode: '560034',
    locality: 'Address',
    street: 'Address details not provided',
    city: 'Bengaluru',
    state: 'Karnataka',
    type: 'home',
  };

  // Reuse existing AddressModel doc if same user+core fields exist (best-effort) to avoid duplicates on retries
  const reuseQuery: any = {
    userId,
    pincode: src.pincode || '000000',
    street: src.street || src.locality || 'Address',
    city: src.city || 'City',
    state: src.state || 'State',
  };
  const existing = session
    ? await AddressModel.findOne(reuseQuery).session(session).lean().exec()
    : await AddressModel.findOne(reuseQuery).lean().exec();
  if (existing) return existing;

  const doc = new AddressModel({
    userId,
    name: src.name || user?.name || 'Customer',
    phone: String(src.phone || user?.phone || '9999999999'),
    alternatePhone: src.alternatePhone,
    pincode: String(src.pincode || '560034'),
    locality: src.locality || src.city || 'Locality',
    street: src.street || src.locality || 'Address',
    city: src.city || 'Bengaluru',
    state: src.state || 'Karnataka',
    landmark: src.landmark,
    type: (src.type === 'work' || src.type === 'business') ? src.type : 'home',
    isDefault: !!src.isDefault,
  });
  const saved = session ? await doc.save({ session }) : await doc.save();
  return saved.toObject ? saved.toObject() : saved;
}

function toId(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && '_id' in (value as any)) return String((value as any)._id);
  return String(value);
}
function isAdminRole(role?: string) { return role === USER_ROLES.ADMIN || role === USER_ROLES.SUPER_ADMIN; }
function isVendorRole(role?: string) { return role === USER_ROLES.VENDOR; }
function nowDate() { return new Date(); }

function pushHistory(entity: any, status: string, actorRole: string, actorId?: string, note?: string) {
  if (!entity.statusHistory) entity.statusHistory = [];
  entity.statusHistory.push({ status, note, actorRole, actorId, timestamp: nowDate() });
}

function canTransition(from: string, to: string, actorRole: string): boolean {
  if (from === to) return true;
  if (to === 'CANCELLED') return CUSTOMER_CANCELABLE.has(from) || isAdminRole(actorRole);
  if (to === 'RETURN_REQUESTED') return from === 'DELIVERED';
  if (to === 'RETURNED') return from === 'RETURN_REQUESTED' || from === 'DELIVERED' || from === 'SHIPPED' || from === 'OUT_FOR_DELIVERY';
  if (to === 'REFUNDED') return from === 'CANCELLED' || from === 'RETURNED' || from === 'RETURN_REQUESTED' || from === 'DELIVERED';
  const fromIdx = ORDER_FLOW.indexOf(from as any);
  const toIdx = ORDER_FLOW.indexOf(to as any);
  if (fromIdx === -1 || toIdx === -1) return false;
  if (isAdminRole(actorRole)) return toIdx >= fromIdx || ['CANCELLED','RETURN_REQUESTED','RETURNED','REFUNDED'].includes(to);
  if (isVendorRole(actorRole)) {
    if (!VENDOR_ALLOWED.has(to)) return false;
    // vendors can move forward one or more steps in fulfillment flow
    return toIdx > fromIdx;
  }
  return false;
}

function aggregateOrderStatus(subStatuses: string[]): string {
  if (!subStatuses.length) return 'PLACED';
  const set = new Set(subStatuses);
  if (set.size === 1) return subStatuses[0];
  if ([...set].every(s => s === 'CANCELLED')) return 'CANCELLED';
  if ([...set].every(s => s === 'DELIVERED' || s === 'RETURNED' || s === 'REFUNDED')) {
    if (set.has('REFUNDED')) return 'REFUNDED';
    if (set.has('RETURNED')) return 'RETURNED';
    return 'DELIVERED';
  }
  if (set.has('RETURN_REQUESTED')) return 'RETURN_REQUESTED';
  if (set.has('OUT_FOR_DELIVERY')) return 'OUT_FOR_DELIVERY';
  if (set.has('SHIPPED')) return 'SHIPPED';
  if (set.has('PACKED')) return 'PACKED';
  if (set.has('PROCESSING')) return 'PROCESSING';
  if (set.has('CONFIRMED')) return 'CONFIRMED';
  if (set.has('PLACED') || set.has('PENDING')) return 'PLACED';
  return subStatuses[0];
}

async function loadAddressMap(ids: string[]) {
  const uniq = Array.from(new Set(ids.filter(Boolean)));
  if (!uniq.length) return new Map<string, any>();
  const docs = await AddressModel.find({ _id: { $in: uniq } }).lean().exec();
  return new Map(docs.map((d: any) => [String(d._id), d]));
}

function maskAddressForVendor(addr: any) {
  if (!addr) return addr;
  return {
    name: addr.name,
    city: addr.city,
    state: addr.state,
    pincode: addr.pincode,
    locality: addr.locality,
    // phone/street/landmark hidden for vendor privacy; fulfillment gets minimal info
  };
}

function resolveProductPricing(product: IProductDocument, variantId?: string) {
  if (variantId) {
    const variant = (product.variants || []).find((v: any) => v.id === variantId || v._id?.toString?.() === variantId);
    if (!variant) throw new Error(`Variant not found for ${product.name}.`);
    return {
      price: Number(variant.price),
      mrp: Number(variant.mrp ?? variant.price),
      stock: Number(variant.stock ?? 0),
      title: product.name,
      thumbnail: product.images?.find((img: any) => img.isPrimary)?.url || product.images?.[0]?.url || '',
    };
  }
  return {
    price: Number(product.price),
    mrp: Number(product.mrp ?? product.price),
    stock: Number(product.stock ?? 0),
    title: product.name,
    thumbnail: product.images?.find((img: any) => img.isPrimary)?.url || product.images?.[0]?.url || '',
  };
}

async function restoreStock(items: Array<{ productId: string; variantId?: string; quantity: number }>, session?: mongoose.ClientSession | null) {
  for (const item of items) {
    const product: any = await ProductModel.findById(item.productId).session(session || null).exec();
    if (!product) continue;
    if (item.variantId && Array.isArray(product.variants)) {
      const idx = product.variants.findIndex((v: any) => v.id === item.variantId || v._id?.toString?.() === item.variantId);
      if (idx >= 0) product.variants[idx].stock = Number(product.variants[idx].stock || 0) + item.quantity;
    } else {
      product.stock = Number(product.stock || 0) + item.quantity;
      if (product.status === 'OUT_OF_STOCK' && product.stock > 0) product.status = 'PUBLISHED';
    }
    await product.save(session ? { session } : undefined);
  }
}


type AppliedCoupon = {
  code: string;
  couponId?: string;
  couponDiscount: number;
  sellerId?: string | null;
};

const FALLBACK_PUBLIC_COUPONS: Array<{
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  startDate?: string;
  expiryDate?: string;
  status?: string;
}> = [
  { code: 'WELCOME100', discountType: 'FLAT', discountValue: 100, minOrderValue: 499, status: 'ACTIVE', expiryDate: '2099-12-31' },
  { code: 'FESTIVE20', discountType: 'PERCENTAGE', discountValue: 20, minOrderValue: 1999, maxDiscount: 1500, status: 'ACTIVE', expiryDate: '2099-12-31' },
  { code: 'FLAT500', discountType: 'FLAT', discountValue: 500, minOrderValue: 4999, status: 'ACTIVE', expiryDate: '2099-12-31' },
];

function computeCouponDiscountAmount(coupon: any, orderSubtotal: number): number {
  if (!coupon) return 0;
  if (coupon.discountType === 'FLAT') {
    return Math.max(0, Math.min(Number(coupon.discountValue || 0), orderSubtotal));
  }
  const pct = Math.max(0, Number(coupon.discountValue || 0));
  let amount = (orderSubtotal * pct) / 100;
  if (typeof coupon.maxDiscount === 'number' && coupon.maxDiscount > 0) {
    amount = Math.min(amount, Number(coupon.maxDiscount));
  }
  return Math.max(0, Math.min(amount, orderSubtotal));
}

function validateCouponRules(coupon: any, orderSubtotal: number): AppliedCoupon {
  const now = new Date();
  if (coupon.status && coupon.status !== 'ACTIVE') throw new Error('This coupon is not active.');
  if (coupon.startDate && new Date(coupon.startDate) > now) throw new Error('This coupon is not active yet.');
  if (coupon.expiryDate && new Date(coupon.expiryDate) < now) throw new Error('This coupon has expired.');
  const minOrderValue = Number(coupon.minOrderValue || 0);
  if (orderSubtotal < minOrderValue) throw new Error(`This coupon requires a minimum order value of ₹${minOrderValue}.`);
  const usageLimit = Number(coupon.usageLimit || 0);
  const usedCount = Number(coupon.usedCount || 0);
  if (usageLimit > 0 && usedCount >= usageLimit) throw new Error('This coupon usage limit has been reached.');
  const couponDiscount = round2(computeCouponDiscountAmount(coupon, orderSubtotal));
  if (couponDiscount <= 0) throw new Error('This coupon is not applicable to the current order amount.');
  return {
    code: String(coupon.code),
    couponId: coupon._id ? String(coupon._id) : undefined,
    couponDiscount,
    sellerId: coupon.sellerId ? String(coupon.sellerId) : null,
  };
}

async function resolveApplicableCoupon(
  couponCode: string | undefined,
  orderSubtotal: number,
  session?: mongoose.ClientSession | null,
): Promise<AppliedCoupon | null> {
  const code = String(couponCode || '').trim().toUpperCase();
  if (!code) return null;
  const q = CouponModel.findOne({ code });
  const coupon: any = session ? await q.session(session).exec() : await q.exec();
  if (coupon) return validateCouponRules(coupon, orderSubtotal);

  // Fallback for public/static coupons (keeps cart-applied coupons working on checkout even if not seeded in DB)
  const fallback = FALLBACK_PUBLIC_COUPONS.find((c) => c.code === code);
  if (!fallback) throw new Error('Invalid coupon code.');
  return validateCouponRules(fallback, orderSubtotal);
}

async function resolveCheckoutDeliveryCharge(params: {
  subtotal: number;
  totalQuantity: number;
  destinationPincode?: string;
  paymentMethod?: string;
  pickupPincode?: string;
}): Promise<{ deliveryCharges: number; freeDeliveryThreshold: number; standardDeliveryCharge: number; source: 'free' | 'shiprocket' | 'standard' | 'fallback' }> {
  const settings = await getDeliverySettings().catch(() => ({ standardDeliveryCharge: 40, freeDeliveryAboveAmount: 499 }));
  const threshold = Math.max(0, Number(settings.freeDeliveryAboveAmount ?? 499));
  const standard = Math.max(0, Number(settings.standardDeliveryCharge ?? 40));
  const subtotal = round2(Math.max(0, Number(params.subtotal || 0)));
  if (subtotal <= 0) return { deliveryCharges: 0, freeDeliveryThreshold: threshold, standardDeliveryCharge: standard, source: 'fallback' };
  if (threshold > 0 && subtotal >= threshold) {
    return { deliveryCharges: 0, freeDeliveryThreshold: threshold, standardDeliveryCharge: standard, source: 'free' };
  }

  const destinationPincode = String(params.destinationPincode || '').replace(/\D/g, '').slice(0, 6);
  const weightKg = Math.max(0.1, Number(process.env.SHIPROCKET_DEFAULT_WEIGHT || 0.5) * Math.max(1, Number(params.totalQuantity || 1)));
  let shiprocketCharge: number | null = null;
  if (/^\d{6}$/.test(destinationPincode)) {
    try {
      const rate = await getShiprocketDeliveryRate({
        deliveryPincode: destinationPincode,
        pickupPincode: params.pickupPincode,
        weightKg,
        cod: String(params.paymentMethod || '').toUpperCase() === 'COD',
        declaredValue: subtotal,
      });
      if (rate && Number.isFinite(Number(rate.charge)) && Number(rate.charge) >= 0) {
        shiprocketCharge = round2(Number(rate.charge));
      }
    } catch (e) {
      logger.warn('Shiprocket delivery rate resolution failed, using configured fallback', { error: (e as Error)?.message });
    }
  }

  if (shiprocketCharge != null) {
    return { deliveryCharges: shiprocketCharge, freeDeliveryThreshold: threshold, standardDeliveryCharge: standard, source: 'shiprocket' };
  }
  return { deliveryCharges: round2(standard), freeDeliveryThreshold: threshold, standardDeliveryCharge: standard, source: 'standard' };
}

async function buildOrderItemsFromInput(
  cartItemsInput: Array<{ productId: string; variantId?: string; quantity: number; selectedVariants?: Record<string, string> }>,
  session?: mongoose.ClientSession | null,
) {
  const normalized = (cartItemsInput || []).map((i) => ({
    productId: toId(i.productId),
    variantId: i.variantId ? String(i.variantId) : undefined,
    quantity: Number(i.quantity || 1),
    selectedVariants: i.selectedVariants || undefined,
  }));
  if (!normalized.length) throw new Error('Cart is empty.');

  const productIds = normalized.map((i) => i.productId);
  const q = ProductModel.find({ _id: { $in: productIds }, status: 'PUBLISHED' });
  const products = session ? await q.session(session).exec() : await q.exec();
  const productMap = new Map(products.map((p: any) => [toId(p._id), p]));

  const orderItems: any[] = [];
  let totalMrp = 0; let subtotal = 0;
  let totalQuantity = 0;

  for (const cartItem of normalized) {
    const product = productMap.get(cartItem.productId);
    if (!product) throw new Error(`Product not found: ${cartItem.productId}`);
    const pricing = resolveProductPricing(product, cartItem.variantId);
    if (pricing.stock <= 0) throw new Error(`${pricing.title} is out of stock.`);
    if (cartItem.quantity > pricing.stock) throw new Error(`Only ${pricing.stock} units available for ${pricing.title}.`);

    const itemMrp = pricing.mrp * cartItem.quantity;
    const itemSubtotal = pricing.price * cartItem.quantity;
    totalMrp += itemMrp; subtotal += itemSubtotal;
    totalQuantity += cartItem.quantity;

    orderItems.push({
      id: `${toId(product._id)}-${cartItem.variantId || 'default'}`,
      productId: toId(product._id),
      variantId: cartItem.variantId,
      title: pricing.title,
      thumbnail: pricing.thumbnail,
      price: pricing.price,
      mrp: pricing.mrp,
      quantity: cartItem.quantity,
      selectedVariants: cartItem.selectedVariants || {},
      sellerId: toId(product.sellerId),
    });
  }

  const discount = Math.max(0, totalMrp - subtotal);

  return { orderItems, totalMrp, subtotal, discount, totalQuantity };
}

export async function getCheckoutSummary(userId: string, input: CheckoutSummaryInput) {
  const address = await resolveOrCreateShippingAddress(userId, input.shippingAddressId);
  if (!address) throw new Error('Shipping address not found.');

  const productIds = input.cartItems.map((i) => i.productId);
  const products = await ProductModel.find({ _id: { $in: productIds }, status: 'PUBLISHED' }).lean().exec();
  const productMap = new Map(products.map((p: any) => [toId(p._id), p as IProductDocument]));

  const items: Array<any> = [];
  let totalMrp = 0;
  let subtotal = 0;
  let totalQuantity = 0;

  for (const cartItem of input.cartItems) {
    const product = productMap.get(cartItem.productId);
    if (!product) throw new Error(`Product not found: ${cartItem.productId}`);
    const pricing = resolveProductPricing(product, cartItem.variantId);
    if (pricing.stock <= 0) throw new Error(`${pricing.title} is out of stock.`);
    if (cartItem.quantity > pricing.stock) throw new Error(`Only ${pricing.stock} units available for ${pricing.title}.`);

    const itemMrp = pricing.mrp * cartItem.quantity;
    const itemSubtotal = pricing.price * cartItem.quantity;
    totalMrp += itemMrp;
    subtotal += itemSubtotal;
    totalQuantity += cartItem.quantity;

    items.push({
      productId: toId((product as any)._id),
      variantId: cartItem.variantId,
      productName: pricing.title,
      thumbnail: pricing.thumbnail,
      price: pricing.price,
      mrp: pricing.mrp,
      quantity: cartItem.quantity,
      sellerId: toId((product as any).sellerId),
    });
  }

  const discount = Math.max(0, totalMrp - subtotal);
  const destinationPincode = input.shippingAddress?.pincode || String((address as any)?.pincode || '');
  const delivery = await resolveCheckoutDeliveryCharge({
    subtotal,
    totalQuantity,
    destinationPincode,
    paymentMethod: input.paymentMethod,
  });
  const deliveryCharges = delivery.deliveryCharges;
  const totalAmount = round2(subtotal + deliveryCharges);

  return {
    items,
    summary: {
      totalMrp: round2(totalMrp),
      discount: round2(discount),
      subtotal: round2(subtotal),
      couponDiscount: 0,
      deliveryCharges: round2(deliveryCharges),
      totalAmount: round2(totalAmount),
      totalQuantity,
    },
  };
}

export async function createOrder(userId: string, input: CreateOrderInput) {
  const user = await UserModel.findById(userId).exec();
  if (!user) throw new Error('User not found.');

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const address = await resolveOrCreateShippingAddress(userId, input.shippingAddressId, session);
    if (!address) throw new Error('Shipping address not found.');
    const resolvedShippingAddressId = String((address as any)._id || input.shippingAddressId);

    const cart = await CartModel.findOne({ userId }).session(session).exec();
    let built: any;
    if (cart && Array.isArray(cart.items) && cart.items.length > 0) {
      const cartItems = cart.items.map((i: any) => ({
        productId: toId(i.productId),
        variantId: i.variantId ? String(i.variantId) : undefined,
        quantity: Number(i.quantity || 1),
        selectedVariants: i.selectedVariants ? (typeof i.selectedVariants === 'object' ? i.selectedVariants : Object.fromEntries(i.selectedVariants as any)) : undefined,
      }));
      built = await buildOrderItemsFromInput(cartItems, session);
    } else if (Array.isArray((input as any).cartItems) && (input as any).cartItems.length > 0) {
      // Fallback for client-managed carts (e.g. testing/mock checkout); prices/stock are server-validated.
      built = await buildOrderItemsFromInput((input as any).cartItems, session);
    } else {
      throw new Error('Cart is empty.');
    }

    let { orderItems, totalMrp, subtotal, discount, totalQuantity } = built;
    const destinationPincode = input.shippingAddress?.pincode || String((address as any)?.pincode || '');

    // Resolve the first seller's pickup pincode for Shiprocket rate calculation
    let sellerPickupPincode: string | undefined;
    try {
      const firstSellerId = orderItems?.[0]?.sellerId;
      if (firstSellerId) {
        const sellerStore = await SellerStoreModel.findOne({ sellerId: firstSellerId }).select('address.pincode').lean().exec();
        sellerPickupPincode = (sellerStore as any)?.address?.pincode || undefined;
      }
    } catch {}

    const delivery = await resolveCheckoutDeliveryCharge({
      subtotal,
      totalQuantity: totalQuantity || (orderItems || []).reduce((s: number, i: any) => s + Number(i.quantity || 0), 0),
      destinationPincode,
      paymentMethod: input.paymentMethod,
      pickupPincode: sellerPickupPincode,
    });
    const deliveryCharges = round2(delivery.deliveryCharges);
    const appliedCouponResolved = await resolveApplicableCoupon((input as any).couponCode, subtotal, session);
    const couponDiscount = round2(Math.min(Math.max(0, Number(appliedCouponResolved?.couponDiscount || 0)), subtotal));
    const totalAmount = round2(Math.max(0, subtotal - couponDiscount + deliveryCharges));

    const sellerGroups = new Map<string, any[]>();
    for (const item of orderItems) {
      if (!sellerGroups.has(item.sellerId)) sellerGroups.set(item.sellerId, []);
      sellerGroups.get(item.sellerId)!.push(item);
    }

    const orderNumber = generateOrderNumber();
    const placedAt = nowDate();
    const estimatedDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const initialHistory = [{ status: 'PLACED', note: 'Order placed', actorRole: 'customer', actorId: userId, timestamp: placedAt }];

    const createdSubOrders: any[] = [];
    let remainingCoupon = couponDiscount;
    const groupEntries = Array.from(sellerGroups.entries());
    for (let gi = 0; gi < groupEntries.length; gi++) {
      const [sellerId, items] = groupEntries[gi];
      const seller = await UserModel.findById(sellerId).session(session).lean().exec();
      const sellerName = (seller as any)?.storeName || (seller as any)?.name || 'Seller';
      const subMrp = items.reduce((s, i) => s + i.mrp * i.quantity, 0);
      const subSubtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
      const subDiscount = Math.max(0, subMrp - subSubtotal);
      const subDelivery = deliveryCharges <= 0 ? 0 : round2(deliveryCharges / sellerGroups.size);
      const subTotal = round2(subSubtotal + subDelivery);
      const commissionPercentage = 5;
      const commissionAmount = round2(subSubtotal * (commissionPercentage / 100));
      const sellerNetAmount = round2(subSubtotal - commissionAmount);
      const subOrderNumber = generateSubOrderNumber();

      const subOrder = await new SubOrderModel({
        subOrderNumber,
        orderId: new mongoose.Types.ObjectId(),
        sellerId,
        sellerName,
        items: items.map(({ sellerId: _sid, ...rest }: any) => rest),
        shippingAddress: resolvedShippingAddressId,
        paymentMethod: input.paymentMethod,
        paymentStatus: 'PENDING',
        orderStatus: 'PLACED',
        statusHistory: [{ ...initialHistory[0] }],
        pricing: { totalMrp: round2(subMrp), discount: round2(subDiscount), couponDiscount: 0, deliveryCharges: subDelivery, totalAmount: subTotal },
        commission: { sellingPrice: round2(subSubtotal), commissionPercentage, commissionAmount, sellerNetAmount },
        placedAt,
        estimatedDelivery,
      }).save({ session });
      createdSubOrders.push(subOrder);

      await new CommissionModel({
        sellerId,
        orderId: subOrder.orderId,
        subOrderId: subOrder._id,
        sellingPrice: round2(subSubtotal),
        commissionPercentage,
        commissionAmount,
        sellerNetAmount,
        status: 'PENDING',
      }).save({ session });

      await new ShipmentModel({
        orderId: subOrder.orderId,
        subOrderId: String(subOrder._id),
        sellerId,
        status: 'PENDING',
        statusHistory: [{ status: 'PENDING', note: 'Shipment created', actorRole: 'system', timestamp: placedAt }],
        estimatedDelivery,
      }).save({ session });
    }

    const order = await new OrderModel({
      orderNumber,
      customerId: userId,
      customerName: (user as any).name,
      customerEmail: (user as any).email,
      customerPhone: (user as any).phone,
      items: orderItems,
      subOrderIds: createdSubOrders.map((s) => toId(s._id)),
      shippingAddress: resolvedShippingAddressId,
      paymentMethod: input.paymentMethod,
      paymentStatus: 'PENDING',
      orderStatus: 'PLACED',
      statusHistory: initialHistory,
      pricing: { totalMrp: round2(totalMrp), discount: round2(discount), couponDiscount: 0, deliveryCharges: round2(deliveryCharges), totalAmount },
      appliedCouponId: input.couponCode || undefined,
      placedAt,
      estimatedDelivery,
    }).save({ session });

    for (const sub of createdSubOrders) {
      await SubOrderModel.updateOne({ _id: sub._id }, { $set: { orderId: order._id } }, { session });
      await CommissionModel.updateMany({ subOrderId: sub._id }, { $set: { orderId: order._id } }, { session });
      await ShipmentModel.updateMany({ subOrderId: String(sub._id) }, { $set: { orderId: order._id } }, { session });
    }

    // Ensure commission + immutable ledger entries exist (idempotent).
    for (const sub of createdSubOrders) {
      try {
        await ensureSubOrderCommissionLedger(String(sub._id), { session, paymentStatus: input.paymentMethod === 'COD' ? 'PAID' : 'PENDING', actorId: userId });
        if (input.paymentMethod === 'COD') await markSubOrderLedgerAvailable(String(sub._id), { session });
      } catch {}
    }

    // COD only: finalize stock/cart immediately. Online payments finalized after verified confirmation.
    if (input.paymentMethod === 'COD') {
      for (const item of orderItems) {
        const product = await ProductModel.findById(item.productId).session(session).exec();
        if (!product) continue;
        if (item.variantId && Array.isArray(product.variants)) {
          const idx = product.variants.findIndex((v: any) => v.id === item.variantId || v._id?.toString?.() === item.variantId);
          if (idx >= 0) product.variants[idx].stock = Math.max(0, Number(product.variants[idx].stock || 0) - item.quantity);
        } else {
          product.stock = Math.max(0, Number(product.stock || 0) - item.quantity);
        }
        if (!item.variantId && Number(product.stock || 0) === 0) product.status = 'OUT_OF_STOCK';
        await product.save({ session });
      }
      await CartModel.deleteOne({ userId }).session(session);
    }

    await session.commitTransaction();
    const saved = await OrderModel.findById(order._id).lean().exec();
    const addrOut = await AddressModel.findById((saved as any)?.shippingAddress || resolvedShippingAddressId).lean().exec();
    return { ...(saved as any), id: String((saved as any)._id), shippingAddress: addrOut || saved?.shippingAddress };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

async function findOrderByIdOrNumber(orderId: string) {
  const or: any[] = [{ orderNumber: orderId }];
  if (mongoose.isValidObjectId(orderId)) or.push({ _id: orderId });
  return OrderModel.findOne({ $or: or }).exec();
}

async function populateOrderView(orderDoc: any, requesterRole: string, requesterId: string) {
  const order = orderDoc.toObject ? orderDoc.toObject() : orderDoc;
  const subOrders = await SubOrderModel.find({ orderId: order._id }).lean().exec();
  let visibleSubs = subOrders as any[];
  if (isVendorRole(requesterRole)) {
    visibleSubs = visibleSubs.filter((s) => String(s.sellerId) === requesterId);
  }
  const visibleSubIds = new Set(visibleSubs.map((s) => String(s._id)));
  const shipments = await ShipmentModel.find({ orderId: order._id, ...(isVendorRole(requesterRole) ? { sellerId: requesterId } : {}) }).lean().exec();
  const returns = await ReturnRequestModel.find({ orderId: order._id, ...(isVendorRole(requesterRole) ? { sellerId: requesterId } : {}) }).sort({ createdAt: -1 }).lean().exec();
  const payment = await PaymentModel.findOne({ orderId: order._id }).lean().exec();
  const addr = typeof order.shippingAddress === 'string' || mongoose.isValidObjectId(order.shippingAddress)
    ? await AddressModel.findById(order.shippingAddress).lean().exec()
    : order.shippingAddress;

  const scopedAddr = isVendorRole(requesterRole) ? maskAddressForVendor(addr) : addr;
  const items = isVendorRole(requesterRole)
    ? (order.items || []).filter((it: any) => String(it.sellerId) === requesterId)
    : (order.items || []);
  const pricing = isVendorRole(requesterRole)
    ? (() => {
        const totalMrp = items.reduce((s: number, i: any) => s + (i.mrp || i.price) * i.quantity, 0);
        const totalAmount = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
        return { totalMrp: round2(totalMrp), discount: round2(Math.max(0, totalMrp - totalAmount)), couponDiscount: 0, deliveryCharges: 0, totalAmount: round2(totalAmount) };
      })()
    : order.pricing;

  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    customerId: String(order.customerId),
    customerName: order.customerName,
    customerEmail: isVendorRole(requesterRole) ? undefined : order.customerEmail,
    customerPhone: isVendorRole(requesterRole) ? undefined : order.customerPhone,
    items,
    subOrders: visibleSubs.map((s) => ({ ...s, id: String(s._id), orderId: String(s.orderId), shippingAddress: isVendorRole(requesterRole) ? maskAddressForVendor(addr) : addr })),
    subOrderIds: visibleSubs.map((s) => String(s._id)),
    shippingAddress: scopedAddr,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: isVendorRole(requesterRole) && visibleSubs.length === 1 ? visibleSubs[0].orderStatus : order.orderStatus,
    pricing,
    appliedCouponId: order.appliedCouponId,
    statusHistory: order.statusHistory || [],
    cancelReason: order.cancelReason,
    cancelledAt: order.cancelledAt,
    placedAt: order.placedAt,
    estimatedDelivery: order.estimatedDelivery,
    deliveredAt: order.deliveredAt,
    shipments,
    tracking: { shipments, statusHistory: order.statusHistory || [] },
    returns,
    payment: payment ? { id: String((payment as any)._id), status: payment.status, refundAmount: payment.refundAmount || 0, method: payment.paymentMethod } : null,
    invoice: {
      invoiceNumber: `INV-${order.orderNumber}`,
      issuedAt: order.placedAt || order.createdAt,
      downloadable: true,
    },
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export async function getOrderById(requesterId: string, requesterRole: string, orderId: string) {
  const order = await findOrderByIdOrNumber(orderId);
  if (!order) return null;
  if (isVendorRole(requesterRole)) {
    const owns = await SubOrderModel.exists({ orderId: order._id, sellerId: requesterId });
    if (!owns) return null;
  } else if (!isAdminRole(requesterRole)) {
    if (String(order.customerId) !== requesterId) return null;
  }
  return populateOrderView(order, requesterRole, requesterId);
}

export async function getMyOrders(requesterId: string, requesterRole: string) {
  let orders: any[] = [];
  if (isVendorRole(requesterRole)) {
    const subs = await SubOrderModel.find({ sellerId: requesterId }).sort({ placedAt: -1 }).lean().exec();
    const orderIds = Array.from(new Set(subs.map((s) => String(s.orderId))));
    const parents = await OrderModel.find({ _id: { $in: orderIds } }).lean().exec();
    const byId = new Map(parents.map((o: any) => [String(o._id), o]));
    const addrMap = await loadAddressMap(parents.map((o: any) => String(o.shippingAddress)));
    return subs.map((s: any) => {
      const o = byId.get(String(s.orderId));
      const addr = o ? addrMap.get(String(o.shippingAddress)) : null;
      return {
        id: String(s._id),
        parentOrderId: String(s.orderId),
        orderNumber: o?.orderNumber,
        subOrderNumber: s.subOrderNumber,
        customerName: o?.customerName,
        items: (s.items || []).map((it: any) => ({ ...it, sellerId: requesterId })),
        shippingAddress: maskAddressForVendor(addr),
        paymentMethod: s.paymentMethod || o?.paymentMethod,
        paymentStatus: s.paymentStatus || o?.paymentStatus,
        orderStatus: s.orderStatus,
        pricing: s.pricing,
        placedAt: s.placedAt || o?.placedAt,
        estimatedDelivery: s.estimatedDelivery || o?.estimatedDelivery,
        deliveredAt: s.deliveredAt,
        statusHistory: s.statusHistory || [],
      };
    });
  }

  const query: any = {};
  if (!isAdminRole(requesterRole)) query.customerId = requesterId;
  orders = await OrderModel.find(query).sort({ placedAt: -1 }).lean().exec();
  const addrMap = await loadAddressMap(orders.map((o: any) => String(o.shippingAddress)));
  return orders.map((o: any) => ({
    id: String(o._id),
    orderNumber: o.orderNumber,
    userId: String(o.customerId),
    items: o.items || [],
    shippingAddress: addrMap.get(String(o.shippingAddress)) || o.shippingAddress,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    orderStatus: o.orderStatus,
    pricing: o.pricing,
    placedAt: o.placedAt,
    estimatedDelivery: o.estimatedDelivery,
    deliveredAt: o.deliveredAt,
    statusHistory: o.statusHistory || [],
  }));
}

export async function cancelOrder(requesterId: string, requesterRole: string, orderId: string, reason?: string) {
  const order = await findOrderByIdOrNumber(orderId);
  if (!order) throw new Error('Order not found.');
  if (!isAdminRole(requesterRole) && String(order.customerId) !== requesterId) throw new Error('Forbidden');
  if (!CUSTOMER_CANCELABLE.has(String(order.orderStatus)) && !isAdminRole(requesterRole)) {
    throw new Error('Order cannot be cancelled at this stage.');
  }

  const session = await mongoose.startSession().catch(() => null);
  const run = async (s?: mongoose.ClientSession | null) => {
    const fresh = await OrderModel.findById(order._id).session(s || null).exec();
    if (!fresh) throw new Error('Order not found.');
    if (fresh.orderStatus === 'CANCELLED') return fresh;
    if (!CUSTOMER_CANCELABLE.has(String(fresh.orderStatus)) && !isAdminRole(requesterRole)) throw new Error('Order cannot be cancelled at this stage.');

    const subs = await SubOrderModel.find({ orderId: fresh._id }).session(s || null).exec();
    for (const sub of subs as any[]) {
      if (!['CANCELLED', 'DELIVERED', 'RETURNED', 'REFUNDED'].includes(String(sub.orderStatus))) {
        sub.orderStatus = 'CANCELLED';
        sub.cancelReason = reason;
        sub.cancelledAt = nowDate();
        pushHistory(sub, 'CANCELLED', isAdminRole(requesterRole) ? 'admin' : 'customer', requesterId, reason || 'Cancelled');
        await sub.save(s ? { session: s } : undefined);
        await ShipmentModel.updateMany({ subOrderId: String(sub._id) }, { $set: { status: 'FAILED' }, $push: { statusHistory: { status: 'CANCELLED', note: reason || 'Order cancelled', actorRole: isAdminRole(requesterRole) ? 'admin' : 'customer', actorId: requesterId, timestamp: nowDate() } } }, s ? { session: s } : undefined);
      }
    }

    // restore stock if it was decremented (COD orders finalize at creation; paid online orders finalize at payment)
    const wasFinalized = fresh.paymentMethod === 'COD' || fresh.paymentStatus === 'PAID' || fresh.paymentStatus === 'REFUNDED';
    if (wasFinalized) {
      const items = (fresh.items || []).map((it: any) => ({ productId: String(it.productId), variantId: it.variantId, quantity: it.quantity }));
      await restoreStock(items, s || null);
    }

    fresh.orderStatus = 'CANCELLED';
    fresh.cancelReason = reason;
    fresh.cancelledAt = nowDate();
    pushHistory(fresh, 'CANCELLED', isAdminRole(requesterRole) ? 'admin' : 'customer', requesterId, reason || 'Cancelled');
    await fresh.save(s ? { session: s } : undefined);

    // financial reversals for cancelled suborders (idempotent)
    for (const sub of subs as any[]) {
      try { await applyRefundReversalForSubOrder(String(sub._id), { session: s || null, reason: reason || 'order_cancelled' }); } catch {}
    }

    // refund if paid
    if (fresh.paymentStatus === 'PAID' || fresh.paymentStatus === 'PARTIALLY_REFUNDED') {
      try { await refundOrderPayment(String(fresh._id), { reason: reason || 'order_cancelled', actorId: requesterId, idempotencyKey: `cancel:${String(fresh._id)}` }); } catch { /* best-effort */ }
      fresh.paymentStatus = 'REFUNDED';
      await fresh.save(s ? { session: s } : undefined);
    }
    return fresh;
  };

  try {
    let result: any;
    if (session) await session.withTransaction(async () => { result = await run(session); }); else result = await run(null);
    return getOrderById(requesterId, isAdminRole(requesterRole) ? USER_ROLES.ADMIN : USER_ROLES.CUSTOMER, String((result || order)._id));
  } finally {
    if (session) await session.endSession();
  }
}

export async function getOrderTracking(requesterId: string, requesterRole: string, orderId: string) {
  const view = await getOrderById(requesterId, requesterRole, orderId);
  if (!view) throw new Error('Order not found.');
  return {
    orderId: view.id,
    orderNumber: view.orderNumber,
    orderStatus: view.orderStatus,
    paymentStatus: view.paymentStatus,
    statusHistory: view.statusHistory || [],
    shipments: view.shipments || [],
    estimatedDelivery: view.estimatedDelivery,
    deliveredAt: view.deliveredAt,
  };
}

export async function updateOrderStatus(requesterId: string, requesterRole: string, orderId: string, input: { status: string; note?: string; trackingNumber?: string; trackingUrl?: string; carrier?: string; currentLocation?: string; estimatedDelivery?: string; subOrderId?: string }) {
  const order = await findOrderByIdOrNumber(orderId);
  if (!order) throw new Error('Order not found.');
  const isAdmin = isAdminRole(requesterRole);
  const isVendor = isVendorRole(requesterRole);
  if (!isAdmin && !isVendor) throw new Error('Forbidden');

  const targetStatus = String(input.status).toUpperCase();
  if (isVendor && !VENDOR_ALLOWED.has(targetStatus)) throw new Error('Vendor not permitted to set this status.');

  const subs = await SubOrderModel.find({ orderId: order._id }).exec();
  let targetSubs = subs as any[];
  if (isVendor) {
    targetSubs = targetSubs.filter((s) => String(s.sellerId) === requesterId);
    if (!targetSubs.length) throw new Error('Forbidden');
  }
  if (input.subOrderId) {
    targetSubs = targetSubs.filter((s) => String(s._id) === input.subOrderId || String(s.subOrderNumber) === input.subOrderId);
    if (!targetSubs.length) throw new Error('Suborder not found for this order.');
  }

  for (const sub of targetSubs) {
    const from = String(sub.orderStatus);
    if (!canTransition(from, targetStatus, requesterRole)) {
      throw new Error(`Invalid status transition: ${from} -> ${targetStatus}`);
    }
    sub.orderStatus = targetStatus;
    if (targetStatus === 'DELIVERED') sub.deliveredAt = nowDate();
    if (targetStatus === 'CANCELLED') { sub.cancelledAt = nowDate(); sub.cancelReason = input.note; }
    pushHistory(sub, targetStatus, requesterRole, requesterId, input.note);
    await sub.save();

    const shipmentUpdate: any = { status: targetStatus === 'PACKED' ? 'PACKED' : targetStatus };
    if (input.trackingNumber) shipmentUpdate.trackingNumber = input.trackingNumber;
    if (input.trackingUrl) shipmentUpdate.trackingUrl = input.trackingUrl;
    if (input.carrier) shipmentUpdate.carrier = input.carrier;
    if (input.currentLocation) shipmentUpdate.currentLocation = input.currentLocation;
    if (input.estimatedDelivery) shipmentUpdate.estimatedDelivery = new Date(input.estimatedDelivery);
    if (targetStatus === 'SHIPPED') shipmentUpdate.shippedAt = nowDate();
    if (targetStatus === 'OUT_FOR_DELIVERY') shipmentUpdate.outForDeliveryAt = nowDate();
    if (targetStatus === 'DELIVERED') shipmentUpdate.deliveredAt = nowDate();

    // Shiprocket integration: auto-create shipment/AWB when marking as SHIPPED (best-effort)
    if (targetStatus === 'SHIPPED' && isShiprocketConfigured()) {
      try {
        const existingShipment: any = await ShipmentModel.findOne({ subOrderId: String(sub._id) }).lean().exec();
        const hasTracking = !!(existingShipment?.awbCode || existingShipment?.trackingNumber || shipmentUpdate.trackingNumber || shipmentUpdate.awbCode);
        if (!hasTracking) {
          const shipAddr = await AddressModel.findById((order as any).shippingAddress).lean().exec();
          const sellerUser = await UserModel.findById(String(sub.sellerId)).lean().exec();
          let vendorDoc: any = null;
          try { vendorDoc = await VendorModel.findOne({ userId: String(sub.sellerId) }).lean().exec(); } catch {}
          const sr = await createShiprocketShipmentForSubOrder({
            order: (typeof order.toObject === 'function' ? order.toObject() : order),
            subOrder: (typeof sub.toObject === 'function' ? sub.toObject() : sub),
            shippingAddress: shipAddr,
            seller: sellerUser,
            vendor: vendorDoc,
          });
          if (sr) {
            if (sr.awbCode) shipmentUpdate.awbCode = String(sr.awbCode);
            if (sr.awbCode && !shipmentUpdate.trackingNumber) shipmentUpdate.trackingNumber = String(sr.awbCode);
            if (sr.trackingUrl && !shipmentUpdate.trackingUrl) shipmentUpdate.trackingUrl = String(sr.trackingUrl);
            if (sr.courierName && !shipmentUpdate.carrier) shipmentUpdate.carrier = String(sr.courierName);
            if (sr.courierName) shipmentUpdate.courierName = String(sr.courierName);
            if (sr.shiprocketOrderId) shipmentUpdate.shiprocketOrderId = String(sr.shiprocketOrderId);
            if (sr.shiprocketShipmentId) shipmentUpdate.shiprocketShipmentId = String(sr.shiprocketShipmentId);
            if (sr.labelUrl) shipmentUpdate.labelUrl = String(sr.labelUrl);
            if (sr.manifestUrl) shipmentUpdate.manifestUrl = String(sr.manifestUrl);
            if (sr.pickupScheduledAt) shipmentUpdate.pickupScheduledAt = new Date(sr.pickupScheduledAt);
            shipmentUpdate.lastShiprocketSyncAt = nowDate();
            shipmentUpdate.shiprocketMeta = { ...(existingShipment?.shiprocketMeta || {}), lastCreate: sr.raw || null };
          }
        }
      } catch (srErr) {
        logger.warn('Shiprocket integration skipped for suborder status update', { subOrderId: String(sub._id), orderId: String(order._id), error: (srErr as Error)?.message });
      }
    }

    await ShipmentModel.findOneAndUpdate(
      { subOrderId: String(sub._id) },
      { $set: shipmentUpdate, $push: { statusHistory: { status: shipmentUpdate.status, note: input.note, actorRole: requesterRole, actorId: requesterId, timestamp: nowDate() } } },
      { upsert: true, new: true },
    ).exec();
  }

  const allSubs = await SubOrderModel.find({ orderId: order._id }).lean().exec();
  const aggregated = aggregateOrderStatus(allSubs.map((s: any) => String(s.orderStatus)));
  if (canTransition(String(order.orderStatus), aggregated, isAdmin ? requesterRole : 'admin') || aggregated !== order.orderStatus) {
    order.orderStatus = aggregated as any;
  }
  if (aggregated === 'DELIVERED') order.deliveredAt = nowDate();
  if (aggregated === 'CANCELLED') { order.cancelledAt = nowDate(); if (input.note) order.cancelReason = input.note; }
  pushHistory(order, aggregated, requesterRole, requesterId, input.note || `Status updated (${targetStatus})`);
  await order.save();

  // Notify seller(s) with invoice when order is confirmed
  if (aggregated === 'CONFIRMED') {
    try {
      const { notifyUser } = await import('@/backend/services/notificationService');
      const invoice = await getInvoice(String(order._id), requesterId, requesterRole);

      // Group items by seller for per-seller notification
      const sellersMap = new Map();
      for (const item of order.items || []) {
        const sid = String(item.sellerId);
        if (!sid) continue;
        if (!sellersMap.has(sid)) {
          sellersMap.set(sid, { sellerId: sid, items: [], subtotal: 0 });
        }
        const s = sellersMap.get(sid);
        s.items.push(item);
        s.subtotal += Number(item.price || 0) * Number(item.quantity || 0);
      }

      for (const [sellerId, sellerInfo] of sellersMap) {
        await notifyUser({
          recipientUserId: sellerId,
          recipientRole: 'vendor',
          type: 'NEW_VENDOR_ORDER',
          category: 'ORDER',
          title: 'New Order Received',
          message: `Order #${order.orderNumber} has been confirmed. Invoice ${invoice.invoiceNumber} has been generated for your products.`,
          link: `/seller/orders/${order.orderNumber || order._id}`,
          metadata: {
            orderId: String(order._id),
            orderNumber: order.orderNumber,
            invoiceNumber: invoice.invoiceNumber,
            invoice: {
              invoiceNumber: invoice.invoiceNumber,
              issuedAt: invoice.issuedAt,
              orderNumber: invoice.orderNumber,
              orderId: invoice.orderId,
              customer: invoice.customer,
              paymentMethod: invoice.paymentMethod,
              paymentStatus: invoice.paymentStatus,
              items: sellerInfo.items,
              pricing: { ...invoice.pricing, subtotal: sellerInfo.subtotal },
              placedAt: invoice.placedAt,
            },
            items: sellerInfo.items,
            subtotal: sellerInfo.subtotal,
          },
          channels: { inApp: true, email: true },
        });
      }
    } catch {}
  }

  // if cancelled/refunded by admin, handle stock/refund best-effort
  if (isAdmin && (aggregated === 'CANCELLED' || targetStatus === 'CANCELLED')) {
    const wasFinalized = order.paymentMethod === 'COD' || order.paymentStatus === 'PAID' || order.paymentStatus === 'REFUNDED';
    if (wasFinalized) await restoreStock((order.items || []).map((it: any) => ({ productId: String(it.productId), variantId: it.variantId, quantity: it.quantity })));
    if (order.paymentStatus === 'PAID' || order.paymentStatus === 'PARTIALLY_REFUNDED') {
      try { await refundOrderPayment(String(order._id), { reason: input.note || 'admin_cancelled', actorId: requesterId, idempotencyKey: `admin-cancel:${String(order._id)}` }); } catch {}
    }
  }

  return getOrderById(requesterId, requesterRole, String(order._id));
}

export async function createReturnRequest(requesterId: string, input: { orderId: string; subOrderId?: string; productId: string; quantity?: number; reason: string; type?: 'RETURN' | 'REPLACEMENT'; notes?: string }) {
  const order = await findOrderByIdOrNumber(input.orderId);
  if (!order) throw new Error('Order not found.');
  if (String(order.customerId) !== requesterId) throw new Error('Forbidden');
  if (String(order.orderStatus) !== 'DELIVERED' && String(order.orderStatus) !== 'RETURN_REQUESTED') {
    throw new Error('Returns/replacements are allowed only for delivered orders.');
  }
  const item = (order.items || []).find((it: any) => String(it.productId) === input.productId);
  if (!item) throw new Error('Product not found in this order.');
  const requestedQty = Math.max(1, Number(input.quantity || 1));
  if (requestedQty > Number(item.quantity || 1)) {
    throw new Error(`You can request return/replacement for up to ${Number(item.quantity || 1)} unit(s) of this item.`);
  }

  const subOrder = await SubOrderModel.findOne({ orderId: order._id, sellerId: item.sellerId }).exec();
  if (input.subOrderId && subOrder && String(subOrder._id) !== String(input.subOrderId) && String(subOrder.subOrderNumber) !== String(input.subOrderId)) {
    throw new Error('Suborder does not match the selected product.');
  }

  // Return policy / eligibility: default 7-day window from delivery (safe for existing data), product-level override if available.
  const product: any = await ProductModel.findById(item.productId).select('name isReturnable returnable returnWindowDays returnPolicyDays returnPolicy').lean().exec();
  const isReturnable = !(product && (product.isReturnable === false || product.returnable === false));
  if (!isReturnable) throw new Error('This product is not eligible for return or replacement.');
  const windowDaysRaw = Number(product?.returnWindowDays ?? product?.returnPolicyDays ?? 7);
  const returnWindowDays = Number.isFinite(windowDaysRaw) && windowDaysRaw > 0 ? Math.min(365, Math.floor(windowDaysRaw)) : 7;
  const deliveredAt = order.deliveredAt ? new Date(order.deliveredAt) : (subOrder?.deliveredAt ? new Date(subOrder.deliveredAt) : null);
  if (deliveredAt && !Number.isNaN(deliveredAt.getTime())) {
    const deadline = deliveredAt.getTime() + returnWindowDays * 24 * 60 * 60 * 1000;
    if (Date.now() > deadline) {
      throw new Error(`Return/replacement window has expired for this item (${returnWindowDays} day${returnWindowDays === 1 ? '' : 's'} from delivery).`);
    }
  }

  // Prevent duplicate active requests and over-requesting quantity for the same item.
  const existingRequests = await ReturnRequestModel.find({ orderId: order._id, productId: input.productId, customerId: requesterId }).lean().exec();
  const activeStatuses = new Set(['PENDING', 'APPROVED', 'PROCESSING']);
  const hasActive = (existingRequests || []).some((r: any) => activeStatuses.has(String(r.status || '').toUpperCase()));
  if (hasActive) throw new Error('A return/replacement request is already in progress for this item.');
  const consumedQty = (existingRequests || []).reduce((sum: number, r: any) => {
    const st = String(r.status || '').toUpperCase();
    if (st === 'REJECTED' || st === 'CANCELLED') return sum;
    return sum + Math.max(0, Number(r.quantity || 0));
  }, 0);
  const remainingQty = Math.max(0, Number(item.quantity || 0) - consumedQty);
  if (remainingQty <= 0) throw new Error('This item has already been fully requested for return/replacement.');
  if (requestedQty > remainingQty) {
    throw new Error(`Only ${remainingQty} unit(s) of this item are eligible for return/replacement.`);
  }

  const qty = requestedQty;
  const refundAmount = round2(Number(item.price) * qty);
  const type = (input.type || 'RETURN') === 'REPLACEMENT' ? 'REPLACEMENT' : 'RETURN';
  const reason = String(input.reason || '').trim();
  if (reason.length < 3) throw new Error('Please provide a valid reason for return/replacement.');

  const rr = await new ReturnRequestModel({
    returnNumber: generateReturnNumber(),
    orderId: order._id,
    subOrderId: subOrder ? String(subOrder._id) : input.subOrderId,
    sellerId: String(item.sellerId),
    customerId: requesterId,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    productId: item.productId,
    productName: item.title || product?.name || 'Product',
    quantity: qty,
    type,
    reason,
    status: 'PENDING',
    statusHistory: [{ status: 'PENDING', note: input.notes || reason, actorRole: 'customer', actorId: requesterId, timestamp: nowDate() }],
    requestDate: nowDate(),
    refundAmount: type === 'REPLACEMENT' ? 0 : refundAmount,
    refundStatus: type === 'REPLACEMENT' ? 'NOT_APPLICABLE' : 'PENDING',
    notes: input.notes,
  }).save();

  if (String(order.orderStatus) === 'DELIVERED') {
    order.orderStatus = 'RETURN_REQUESTED' as any;
    pushHistory(order, 'RETURN_REQUESTED', 'customer', requesterId, reason);
    await order.save();
  }
  if (subOrder && String(subOrder.orderStatus) === 'DELIVERED') {
    subOrder.orderStatus = 'RETURN_REQUESTED' as any;
    pushHistory(subOrder, 'RETURN_REQUESTED', 'customer', requesterId, reason);
    await subOrder.save();
  }

  try {
    const { notifyUser } = await import('@/backend/services/notificationService');
    await notifyUser({ recipientUserId: String(item.sellerId), recipientRole: 'vendor', type: 'RETURN_REQUEST', category: 'RETURN', title: 'New return/replacement request', message: `${order.orderNumber}: ${item.title || 'Product'} (${type}) requested by customer.`, link: '/seller/returns', metadata: { returnId: String(rr._id), orderId: String(order._id), orderNumber: order.orderNumber, type } });
  } catch {}

  return rr.toObject();
}

export async function getMyReturns(requesterId: string, requesterRole: string) {
  const q: any = {};
  if (isVendorRole(requesterRole)) q.sellerId = requesterId;
  else if (!isAdminRole(requesterRole)) q.customerId = requesterId;
  return ReturnRequestModel.find(q).sort({ createdAt: -1 }).lean().exec();
}

export async function updateReturnRequest(requesterId: string, requesterRole: string, id: string, input: { status: string; note?: string; refundAmount?: number }) {
  const rr: any = await ReturnRequestModel.findById(id).exec();
  if (!rr) throw new Error('Return request not found.');
  const isAdmin = isAdminRole(requesterRole);
  const isVendor = isVendorRole(requesterRole);
  if (isVendor && String(rr.sellerId) !== requesterId) throw new Error('Forbidden');
  if (!isAdmin && !isVendor) {
    // customer cannot arbitrarily update status
    throw new Error('Forbidden');
  }

  const allowedByVendor = new Set(['APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'REPLACED']);
  const next = String(input.status).toUpperCase();
  if (isVendor && !allowedByVendor.has(next)) throw new Error('Vendor not permitted to set this status.');

  const prevStatus = String(rr.status || '').toUpperCase();
  if (prevStatus === next) return rr.toObject();

  rr.status = next;
  if (typeof input.refundAmount === 'number' && Number.isFinite(input.refundAmount)) {
    rr.refundAmount = Math.max(0, round2(Number(input.refundAmount)));
  }
  if (['COMPLETED', 'REJECTED', 'REFUNDED', 'REPLACED'].includes(next)) rr.resolvedAt = nowDate();
  if (!rr.statusHistory) rr.statusHistory = [];
  rr.statusHistory.push({ status: next, note: input.note, actorRole: requesterRole, actorId: requesterId, timestamp: nowDate() });

  const order = await OrderModel.findById(rr.orderId).exec();
  const sub = rr.subOrderId ? await SubOrderModel.findById(rr.subOrderId).exec() : await SubOrderModel.findOne({ orderId: rr.orderId, sellerId: rr.sellerId }).exec();

  if (next === 'APPROVED' || next === 'PROCESSING') {
    rr.refundStatus = rr.type === 'REPLACEMENT' ? 'NOT_APPLICABLE' : 'PENDING';
    if (sub && !['CANCELLED', 'REFUNDED', 'RETURNED'].includes(String(sub.orderStatus))) {
      (sub as any).orderStatus = 'RETURN_REQUESTED';
      pushHistory(sub, 'RETURN_REQUESTED', requesterRole, requesterId, input.note || `Return ${next.toLowerCase()}`);
      await sub.save();
    }
    if (order && String(order.orderStatus) === 'DELIVERED') {
      (order as any).orderStatus = 'RETURN_REQUESTED';
      pushHistory(order, 'RETURN_REQUESTED', requesterRole, requesterId, input.note || `Return ${next.toLowerCase()}`);
      await order.save();
    }
  }

  // Complete/refund return flow: restore stock once, reverse vendor ledger once (idempotent), and process payment refund for prepaid orders.
  if ((next === 'COMPLETED' || next === 'REFUNDED') && rr.type === 'RETURN') {
    const shouldFinalize = !(rr as any).stockRestored || String(rr.refundStatus || '').toUpperCase() !== 'PROCESSED';
    if (shouldFinalize) {
      if (!(rr as any).stockRestored) {
        await restoreStock([{ productId: String(rr.productId), quantity: Number(rr.quantity || 1) }]);
        (rr as any).stockRestored = true;
      }
      try { await applyRefundReversalForSubOrder(String((sub as any)?._id || rr.subOrderId || ''), { reason: input.note || 'return_completed' }); } catch {}
      const isPrepaidPaid = order && String(order.paymentMethod || '').toUpperCase() !== 'COD' && (String(order.paymentStatus || '').toUpperCase() === 'PAID' || String(order.paymentStatus || '').toUpperCase() === 'PARTIALLY_REFUNDED');
      if (isPrepaidPaid && order) {
        try { await refundOrderPayment(String(order._id), { reason: input.note || 'return_completed', actorId: requesterId, idempotencyKey: `return:${String(rr._id)}` }); } catch {}
        (order as any).paymentStatus = 'REFUNDED';
        await order.save();
        if (sub) { (sub as any).paymentStatus = 'REFUNDED'; await sub.save(); }
        rr.refundStatus = 'PROCESSED';
      } else {
        rr.refundStatus = 'COMPLETED';
        // COD/manual refund settlement path (no online gateway capture to reverse here)
      }
    }
  }

  if (next === 'COMPLETED' || next === 'REFUNDED' || next === 'REPLACED') {
    if (sub) {
      (sub as any).orderStatus = next === 'REPLACED' ? 'DELIVERED' : 'RETURNED';
      pushHistory(sub, (sub as any).orderStatus, requesterRole, requesterId, input.note);
      await sub.save();
    }
    if (order) {
      const subs = await SubOrderModel.find({ orderId: order._id }).lean().exec();
      const hasOtherActiveReturns = await ReturnRequestModel.exists({ orderId: order._id, _id: { $ne: rr._id }, status: { $in: ['PENDING', 'APPROVED', 'PROCESSING'] } });
      const agg = hasOtherActiveReturns ? 'RETURN_REQUESTED' : aggregateOrderStatus(subs.map((s: any) => String(s.orderStatus)));
      (order as any).orderStatus = agg;
      pushHistory(order, agg, requesterRole, requesterId, input.note);
      await order.save();
    }
  }

  if (next === 'REJECTED') {
    rr.refundStatus = rr.type === 'REPLACEMENT' ? 'NOT_APPLICABLE' : 'REJECTED';
    const hasOtherActiveReturns = await ReturnRequestModel.exists({ orderId: rr.orderId, _id: { $ne: rr._id }, status: { $in: ['PENDING', 'APPROVED', 'PROCESSING'] } });
    if (sub) {
      (sub as any).orderStatus = hasOtherActiveReturns ? 'RETURN_REQUESTED' : 'DELIVERED';
      pushHistory(sub, (sub as any).orderStatus, requesterRole, requesterId, input.note || 'Return rejected');
      await sub.save();
    }
    if (order) {
      const subs = await SubOrderModel.find({ orderId: order._id }).lean().exec();
      const agg = hasOtherActiveReturns ? 'RETURN_REQUESTED' : aggregateOrderStatus(subs.map((s: any) => String(s.orderStatus)));
      (order as any).orderStatus = agg === 'RETURN_REQUESTED' || hasOtherActiveReturns ? 'RETURN_REQUESTED' : agg;
      pushHistory(order, (order as any).orderStatus, requesterRole, requesterId, input.note || 'Return rejected');
      await order.save();
    }
  }

  await rr.save();

  try {
    const { notifyUser } = await import('@/backend/services/notificationService');
    await notifyUser({
      recipientUserId: String(rr.customerId),
      recipientRole: 'customer',
      type: next === 'REJECTED' ? 'REFUND_UPDATE' : 'RETURN_REQUEST',
      category: next === 'REJECTED' ? 'PAYMENT' : 'RETURN',
      title: `Return request ${next.toLowerCase().replace(/_/g, ' ')}`,
      message: `Your ${String(rr.type || 'return').toLowerCase()} request ${rr.returnNumber || ''} is now ${next.toLowerCase().replace(/_/g, ' ')}.`,
      link: order ? `/orders/${(order as any).orderNumber || String((order as any)._id)}` : '/orders',
      metadata: { returnId: String(rr._id), status: next },
    });
  } catch {}

  return rr.toObject();
}

export async function getInvoice(orderId: string, requesterId: string, requesterRole: string) {
  const view: any = await getOrderById(requesterId, requesterRole, orderId);
  if (!view) throw new Error('Order not found.');
  // getOrderById already enforces vendor access (vendor must own a sub-order in this order)
  return {
    invoiceNumber: view.invoice?.invoiceNumber || `INV-${view.orderNumber}`,
    issuedAt: view.placedAt || view.createdAt,
    orderNumber: view.orderNumber,
    orderId: view.id,
    customer: { name: view.customerName, email: view.customerEmail, phone: view.customerPhone },
    shippingAddress: view.shippingAddress,
    paymentMethod: view.paymentMethod,
    paymentStatus: view.paymentStatus,
    items: view.items,
    pricing: view.pricing,
    placedAt: view.placedAt,
  };
}
