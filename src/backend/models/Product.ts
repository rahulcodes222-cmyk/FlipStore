/**
 * Product Mongoose Model
 * Core product model with sellerId for multi-vendor isolation.
 * Extended for Seller Product Approval & Admin Verification workflow.
 */

import mongoose, { Schema, Model } from 'mongoose';
import type { IProductDocument } from '@/backend/types';

const productApprovalHistorySchema = new Schema(
  {
    action: { type: String, required: true, trim: true }, // DRAFT_SAVED|SUBMITTED|UNDER_REVIEW|APPROVED|REJECTED|CHANGES_REQUESTED|RESUBMITTED|ACTIVATED|DEACTIVATED
    fromApprovalStatus: { type: String, trim: true },
    toApprovalStatus: { type: String, trim: true },
    fromProductStatus: { type: String, trim: true },
    toProductStatus: { type: String, trim: true },
    reason: { type: String, trim: true },
    comment: { type: String, trim: true },
    actorId: { type: Schema.Types.ObjectId as any, ref: 'User' },
    actorRole: { type: String, trim: true },
    actorName: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const productSchema = new Schema<IProductDocument>(
  {
    sellerId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: [true, 'Seller reference is required.'],
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
    },
    categoryId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'Category',
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
    // Legacy/compat publication-ish field kept for existing code paths
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'OUT_OF_STOCK', 'REJECTED'],
      default: 'DRAFT',
    },
    // Product approval workflow (seller/admin review)
    approvalStatus: {
      type: String,
      enum: ['Draft', 'Pending Approval', 'Under Review', 'Approved', 'Rejected', 'Changes Requested'],
      default: 'Draft',
      index: true,
    },
    // Publication/listing state separate from approval (seller cannot self-approve but may toggle active after approval where allowed)
    productStatus: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Inactive',
      index: true,
    },
    rejectionReason: { type: String, trim: true },
    adminComment: { type: String, trim: true },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId as any, ref: 'User' },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId as any, ref: 'User' },
    changesRequestedAt: { type: Date },
    rejectedAt: { type: Date },
    approvalHistory: { type: [productApprovalHistorySchema], default: [] },
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
    // Return policy set by the seller; used to validate customer return eligibility.
    returnPolicy: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    returnWindowDays: {
      type: Number,
      default: 7,
      min: 0,
      max: 365,
    },
    isReturnable: {
      type: Boolean,
      default: true,
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
productSchema.index({ sellerId: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ category: 1 });
productSchema.index({ categoryId: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ brandId: 1 });
productSchema.index({ status: 1 });
productSchema.index({ approvalStatus: 1 });
productSchema.index({ productStatus: 1 });
productSchema.index({ isAssured: 1 });
productSchema.index({ isFreeDelivery: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ unitsSold: -1 });
productSchema.index({ name: 'text', description: 'text', shortDescription: 'text' });
productSchema.index({ sellerId: 1, status: 1 });
productSchema.index({ sellerId: 1, approvalStatus: 1 });
productSchema.index({ sellerId: 1, category: 1 });
productSchema.index({ approvalStatus: 1, productStatus: 1 });

const ProductModel: Model<IProductDocument> =
  (mongoose.models.Product as Model<IProductDocument> | undefined) ||
  mongoose.model<IProductDocument>('Product', productSchema);

export default ProductModel;
export { ProductModel };

