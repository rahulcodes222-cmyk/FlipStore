/**
 * SellerStore Mongoose Model
 * Store profile model linked to seller with branding and verification status.
 */

import mongoose, { Schema, Model } from 'mongoose';
import type { ISellerStoreDocument } from '@/backend/types';

const sellerStoreSchema = new Schema<ISellerStoreDocument>(
  {
    sellerId: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: [true, 'Seller reference is required.'],
      unique: true,
      index: true,
    },
    storeName: {
      type: String,
      required: [true, 'Store name is required.'],
      trim: true,
      maxlength: 200,
    },
    storeSlug: {
      type: String,
      required: [true, 'Store slug is required.'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format.'],
      index: true,
    },
    storeDescription: { type: String, trim: true, maxlength: 1000 },
    storeLogo: { type: String, trim: true },
    storeBanner: { type: String, trim: true },
    businessCategory: { type: String, trim: true },
    businessType: { type: String, trim: true },
    businessEmail: { type: String, trim: true, lowercase: true },
    businessPhone: { type: String, trim: true },
    address: {
      name: { type: String },
      phone: { type: String },
      alternatePhone: { type: String },
      pincode: { type: String },
      locality: { type: String },
      street: { type: String },
      city: { type: String },
      state: { type: String },
      landmark: { type: String },
      type: { type: String },
      isDefault: { type: Boolean },
    },
    panNumber: { type: String, trim: true },
    gstNumber: { type: String, trim: true },
    businessRegistration: { type: String, trim: true },
    bankAccountHolder: { type: String, trim: true },
    bankName: { type: String, trim: true },
    accountNumber: { type: String, trim: true, select: false }, // sensitive; avoid exposing
    ifscCode: { type: String, trim: true },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED', 'Draft', 'Pending', 'Under Review', 'Approved', 'Rejected', 'Suspended'],
      default: 'PENDING',
      index: true,
    },
    storeStatus: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'VACATION'],
      default: 'ACTIVE',
      index: true,
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  },
);

// Indexes
sellerStoreSchema.index({ sellerId: 1 }, { unique: true });
sellerStoreSchema.index({ storeSlug: 1 }, { unique: true });
sellerStoreSchema.index({ verificationStatus: 1 });
sellerStoreSchema.index({ storeStatus: 1 });
sellerStoreSchema.index({ rating: -1 });

const SellerStoreModel: Model<ISellerStoreDocument> =
  (mongoose.models.SellerStore as Model<ISellerStoreDocument> | undefined) ||
  mongoose.model<ISellerStoreDocument>('SellerStore', sellerStoreSchema);

export default SellerStoreModel;
export { SellerStoreModel };

