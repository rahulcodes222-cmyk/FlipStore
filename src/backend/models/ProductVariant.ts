/**
 * ProductVariant Mongoose Model
 * Variant model for product SKU, size, color, price, stock.
 */

import mongoose, { Schema, Model } from 'mongoose';
import type { IProductVariantDocument } from '@/backend/types';



const productVariantSchema = new Schema<IProductVariantDocument>(
  {
    productId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'Product',
      required: [true, 'Product reference is required.'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required.'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    size: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required.'],
      min: 0,
    },
    mrp: {
      type: Number,
      required: [true, 'MRP is required.'],
      min: 0,
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required.'],
      min: 0,
      default: 0,
    },
    weight: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);

// Indexes (sku unique index is created by field definition)
productVariantSchema.index({ productId: 1 });
productVariantSchema.index({ size: 1, color: 1 });

const ProductVariantModel: Model<IProductVariantDocument> =
  (mongoose.models.ProductVariant as Model<IProductVariantDocument> | undefined) ||
  mongoose.model<IProductVariantDocument>('ProductVariant', productVariantSchema);

export default ProductVariantModel;
export { ProductVariantModel };

