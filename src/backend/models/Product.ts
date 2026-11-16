/**
 * Product Mongoose Model
 * Core product model with sellerId for multi-vendor isolation.
 */

import mongoose, { Schema, Model } from 'mongoose';
import type { IProductDocument } from '@/backend/types';



const productSchema = new Schema<IProductDocument>(
  {
    sellerId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: [true, 'Seller reference is required.'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required.'],
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required.'],
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format.'],
    },
    sku: {
      type: String,
      required: [true, 'SKU is required.'],
      trim: true,
      uppercase: true,
    },
    barcode: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required.'],
      trim: true,
      index: true,
    },
    categoryId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'Category',
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    brandId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'Brand',
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required.'],
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    highlights: {
      type: [String],
      default: [],
    },
    specifications: {
      type: Map,
      of: String,
      default: {},
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
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    taxPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required.'],
      min: 0,
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 0,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'OUT_OF_STOCK', 'REJECTED'],
      default: 'DRAFT',
      index: true,
    },
    images: {
      type: [
        {
          id: { type: String, required: true },
          url: { type: String, required: true },
          alt: { type: String },
          isPrimary: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
    variants: {
      type: [
        {
          id: { type: String, required: true },
          productId: { type: String },
          sku: { type: String, required: true },
          size: { type: String },
          color: { type: String },
          price: { type: Number, required: true },
          mrp: { type: Number, required: true },
          stock: { type: Number, required: true },
          weight: { type: String },
        },
      ],
      default: [],
    },
    seoTitle: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    seoDescription: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    unitsSold: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isAssured: {
      type: Boolean,
      default: false,
    },
    isFreeDelivery: {
      type: Boolean,
      default: false,
    },
    estimatedDeliveryDays: {
      type: Number,
      default: 3,
      min: 0,
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
productSchema.index({ sellerId: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ sku: 1 }, { unique: true });
productSchema.index({ category: 1 });
productSchema.index({ categoryId: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ brandId: 1 });
productSchema.index({ status: 1 });
productSchema.index({ isAssured: 1 });
productSchema.index({ isFreeDelivery: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ unitsSold: -1 });
productSchema.index({ name: 'text', description: 'text', shortDescription: 'text' });
productSchema.index({ sellerId: 1, status: 1 });
productSchema.index({ sellerId: 1, category: 1 });

const ProductModel: Model<IProductDocument> =
  (mongoose.models.Product as Model<IProductDocument> | undefined) ||
  mongoose.model<IProductDocument>('Product', productSchema);

export default ProductModel;
export { ProductModel };

