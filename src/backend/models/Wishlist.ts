/**
 * Wishlist Mongoose Model
 * Wishlist model per user with product references.
 */

import mongoose, { Schema, Model } from 'mongoose';
import type { IWishlistDocument } from '@/backend/types';



const wishlistItemSchema = new Schema(
  {
    id: { type: String, required: true },
    productId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'Product',
      required: true,
    },
    productName: {
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
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const wishlistSchema = new Schema<IWishlistDocument>(
  {
    userId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: [true, 'User reference is required.'],
      unique: true,
      index: true,
    },
    items: {
      type: [wishlistItemSchema],
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
wishlistSchema.index({ userId: 1 }, { unique: true });
wishlistSchema.index({ 'items.productId': 1 });

const WishlistModel: Model<IWishlistDocument> =
  (mongoose.models.Wishlist as Model<IWishlistDocument> | undefined) ||
  mongoose.model<IWishlistDocument>('Wishlist', wishlistSchema);

export default WishlistModel;
export { WishlistModel };

