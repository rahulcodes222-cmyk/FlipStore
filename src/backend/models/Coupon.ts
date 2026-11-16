/**
 * Coupon Mongoose Model
 * Seller-specific coupon model with usage tracking.
 */

import mongoose, { Schema, Model } from 'mongoose';
import type { ICouponDocument } from '@/backend/types';



const couponSchema = new Schema<ICouponDocument>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Coupon code is required.'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    discountType: {
      type: String,
      enum: ['PERCENTAGE', 'FLAT'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required.'],
      min: 0,
    },
    minOrderValue: {
      type: Number,
      required: [true, 'Minimum order value is required.'],
      min: 0,
    },
    maxDiscount: {
      type: Number,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      required: [true, 'Usage limit is required.'],
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'DISABLED', 'DRAFT'],
      default: 'ACTIVE',
      index: true,
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
couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ sellerId: 1 });
couponSchema.index({ status: 1 });
couponSchema.index({ expiryDate: 1 });
couponSchema.index({ sellerId: 1, status: 1 });

const CouponModel: Model<ICouponDocument> =
  (mongoose.models.Coupon as Model<ICouponDocument> | undefined) ||
  mongoose.model<ICouponDocument>('Coupon', couponSchema);

export default CouponModel;
export { CouponModel };
