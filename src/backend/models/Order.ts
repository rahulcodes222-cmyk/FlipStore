/**
 * Order Mongoose Model
 * Order model with customerId and multi-vendor sub-order support.
 * Multi-vendor orders are split into seller-specific suborders.
 */

import mongoose, { Schema, Model } from 'mongoose';
import type { IOrderDocument } from '@/backend/types';



const orderItemSchema = new Schema(
  {
    id: { type: String, required: true },
    productId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'Product',
      required: true,
    },
    variantId: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnail: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    mrp: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    selectedVariants: {
      type: Map,
      of: String,
      default: {},
    },
    sellerId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  { _id: false },
);

const orderPricingSchema = new Schema(
  {
    totalMrp: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    couponDiscount: { type: Number, required: true, min: 0, default: 0 },
    deliveryCharges: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const statusHistorySchema = new Schema(
  {
    status: { type: String, required: true, trim: true },
    note: { type: String, trim: true },
    actorRole: { type: String, trim: true },
    actorId: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: {
      type: String,
      required: [true, 'Order number is required.'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    customerId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: [true, 'Customer reference is required.'],
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    items: {
      type: [orderItemSchema],
      default: [],
    },
    subOrderIds: {
      type: [String],
      default: [],
    },
    shippingAddress: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'Address',
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'UPI', 'CARD', 'NET_BANKING'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    orderStatus: {
      type: String,
      enum: [
        'PENDING',
        'PLACED',
        'CONFIRMED',
        'PROCESSING',
        'PACKED',
        'SHIPPED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
        'RETURN_REQUESTED',
        'RETURNED',
        'REFUNDED',
      ],
      default: 'PLACED',
      index: true,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    pricing: {
      type: orderPricingSchema,
      required: true,
    },
    appliedCouponId: {
      type: String,
      trim: true,
    },
    cancelReason: {
      type: String,
      trim: true,
    },
    cancelledAt: {
      type: Date,
    },
    placedAt: {
      type: Date,
      default: Date.now,
    },
    estimatedDelivery: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);

// Indexes
orderSchema.index({ customerId: 1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ placedAt: -1 });
orderSchema.index({ 'items.sellerId': 1 });
orderSchema.index({ customerId: 1, orderStatus: 1 });
orderSchema.index({ customerId: 1, placedAt: -1 });

const OrderModel: Model<IOrderDocument> =
  (mongoose.models.Order as Model<IOrderDocument> | undefined) ||
  mongoose.model<IOrderDocument>('Order', orderSchema);

export default OrderModel;
export { OrderModel };

