/**
 * Cart Mongoose Model
 * Shopping cart model per user with item references.
 */

import mongoose, { Schema, Model } from 'mongoose';
import type { ICartDocument } from '@/backend/types';



const cartItemSchema = new Schema(
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
    mrp: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    selectedVariants: {
      type: Map,
      of: String,
      default: {},
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const cartSchema = new Schema<ICartDocument>(
  {
    userId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: [true, 'User reference is required.'],
      unique: true,
    },
    items: {
      type: [cartItemSchema],
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

// Indexes (userId unique index is created by field definition)
cartSchema.index({ 'items.productId': 1 });

const CartModel: Model<ICartDocument> =
  (mongoose.models.Cart as Model<ICartDocument> | undefined) ||
  mongoose.model<ICartDocument>('Cart', cartSchema);

export default CartModel;
export { CartModel };

