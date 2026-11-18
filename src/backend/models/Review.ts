/**
 * Review Mongoose Model
 * Product review model linked to product, user, and order.
 */

import mongoose, { Schema, Model } from 'mongoose';
import type { IReviewDocument } from '@/backend/types';



const reviewSchema = new Schema<IReviewDocument>(
  {
    productId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'Product',
      required: [true, 'Product reference is required.'],
      index: true,
    },
    orderId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'Order',
      index: true,
    },
    userId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: [true, 'User reference is required.'],
      index: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userAvatar: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required.'],
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    sellerReply: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    replyAt: {
      type: Date,
    },
    images: {
      type: [String],
      default: [],
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
reviewSchema.index({ productId: 1 });
reviewSchema.index({ orderId: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ productId: 1, status: 1 });
reviewSchema.index({ productId: 1, rating: -1 });
// Allow one review per purchased order (repeat orders can be reviewed again).
reviewSchema.index({ userId: 1, orderId: 1 }, { unique: true, sparse: true });

const ReviewModel: Model<IReviewDocument> =
  (mongoose.models.Review as Model<IReviewDocument> | undefined) ||
  mongoose.model<IReviewDocument>('Review', reviewSchema);

export default ReviewModel;
export { ReviewModel };

