/**
 * SubOrder Mongoose Model
 * Seller-specific split of a multi-vendor order.
 * Each suborder contains only one seller's products.
 */

import mongoose, { Schema, Model } from 'mongoose';
import type { ISubOrderDocument } from '@/backend/types';



const subOrderItemSchema = new Schema(
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
  },
  { _id: false },
);

const subOrderPricingSchema = new Schema(
  {
    totalMrp: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    couponDiscount: { type: Number, required: true, min: 0, default: 0 },
    deliveryCharges: { type: Number, required: true, min: 0, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const commissionBreakdownSchema = new Schema(
  {
    sellingPrice: { type: Number, required: true, min: 0 },
    commissionPercentage: { type: Number, required: true, min: 0, max: 100 },
    commissionAmount: { type: Number, required: true, min: 0 },
    sellerNetAmount: { type: Number, required: true, min: 0 },
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

const subOrderSchema = new Schema<ISubOrderDocument>(
  {
    subOrderNumber: {
      type: String,
      required: [true, 'Sub-order number is required.'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    orderId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'Order',
      required: [true, 'Order reference is required.'],
    },
    sellerId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: [true, 'Seller reference is required.'],
    },
    sellerName: {
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: [subOrderItemSchema],
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
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    pricing: {
      type: subOrderPricingSchema,
      required: true,
    },
    commission: {
      type: commissionBreakdownSchema,
      required: true,
    },
    cancelReason: { type: String, trim: true },
    cancelledAt: { type: Date },
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

// Indexes (subOrderNumber unique index is created by field definition)
subOrderSchema.index({ orderId: 1 });
subOrderSchema.index({ sellerId: 1 });
subOrderSchema.index({ paymentStatus: 1 });
subOrderSchema.index({ orderStatus: 1 });
subOrderSchema.index({ placedAt: -1 });
subOrderSchema.index({ sellerId: 1, orderStatus: 1 });
subOrderSchema.index({ sellerId: 1, placedAt: -1 });

const SubOrderModel: Model<ISubOrderDocument> =
  (mongoose.models.SubOrder as Model<ISubOrderDocument> | undefined) ||
  mongoose.model<ISubOrderDocument>('SubOrder', subOrderSchema);

export default SubOrderModel;
export { SubOrderModel };

