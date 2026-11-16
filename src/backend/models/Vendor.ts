/**
 * Vendor Mongoose Model
 * Vendor profile linked to User with onboarding/application and approval workflow.
 */

import mongoose, { Schema, Model } from 'mongoose';
import type { IVendorDocument } from '@/backend/types';

const vendorAddressSchema = new Schema(
  {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    alternatePhone: { type: String, trim: true },
    pincode: { type: String, trim: true },
    locality: { type: String, trim: true },
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    landmark: { type: String, trim: true },
    type: { type: String, trim: true },
    isDefault: { type: Boolean, default: true },
  },
  { _id: false },
);

const vendorDocumentSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    fileName: { type: String, trim: true },
    fileUrl: { type: String, trim: true },
    mimeType: { type: String, trim: true },
    status: { type: String, trim: true, default: 'uploaded' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const vendorAuditLogSchema = new Schema(
  {
    action: { type: String, required: true, trim: true },
    fromStatus: { type: String, trim: true },
    toStatus: { type: String, trim: true },
    note: { type: String, trim: true },
    actorId: { type: String, trim: true },
    actorRole: { type: String, trim: true },
    actorName: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const vendorSchema = new Schema<IVendorDocument>(
  {
    userId: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: [true, 'User reference is required.'],
      unique: true,
      index: true,
    },
    sellerId: {
      type: String,
      required: [true, 'Seller ID is required.'],
      trim: true,
      uppercase: true,
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
    },
    businessDetails: {
      businessName: { type: String, trim: true },
      businessType: { type: String, trim: true },
      businessDescription: { type: String, trim: true },
      businessEmail: { type: String, trim: true, lowercase: true },
      businessPhone: { type: String, trim: true },
      category: { type: String, trim: true },
      address: { type: vendorAddressSchema },
    },
    gstNumber: { type: String, trim: true },
    panNumber: { type: String, trim: true },
    applicationStatus: {
      type: String,
      enum: ['Draft', 'Pending', 'Under Review', 'Approved', 'Rejected', 'Suspended'],
      default: 'Draft',
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'],
      default: 'PENDING',
      index: true,
    },
    rejectionReason: { type: String, trim: true },
    suspensionReason: { type: String, trim: true },
    adminNotes: { type: String, trim: true },
    submittedAt: { type: Date },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    suspendedAt: { type: Date },
    lastReviewedAt: { type: Date },
    storeProfile: {
      storeName: { type: String, trim: true },
      storeSlug: { type: String, trim: true, lowercase: true },
      description: { type: String, trim: true },
      logoUrl: { type: String, trim: true },
      bannerUrl: { type: String, trim: true },
      supportEmail: { type: String, trim: true, lowercase: true },
      supportPhone: { type: String, trim: true },
    },
    bankDetails: {
      accountHolderName: { type: String, trim: true },
      bankName: { type: String, trim: true },
      accountNumberMasked: { type: String, trim: true },
      accountLast4: { type: String, trim: true },
      ifscCode: { type: String, trim: true, uppercase: true },
      upiId: { type: String, trim: true },
      branchName: { type: String, trim: true },
      updatedAt: { type: Date },
    },
    documents: { type: [vendorDocumentSchema], default: [] },
    auditLog: { type: [vendorAuditLogSchema], default: [] },
    commissionRate: {
      type: Number,
      required: [true, 'Commission rate is required.'],
      min: 0,
      max: 100,
      default: 5,
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalSales: { type: Number, default: 0, min: 0 },
    totalOrders: { type: Number, default: 0, min: 0 },
    totalProducts: { type: Number, default: 0, min: 0 },
    availableBalance: { type: Number, default: 0, min: 0 },
    totalEarnings: { type: Number, default: 0, min: 0 },
    pendingOrders: { type: Number, default: 0, min: 0 },
    cancelledOrders: { type: Number, default: 0, min: 0 },
    joinedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  },
);

vendorSchema.index({ userId: 1 }, { unique: true });
vendorSchema.index({ sellerId: 1 }, { unique: true });
vendorSchema.index({ storeSlug: 1 }, { unique: true });
vendorSchema.index({ applicationStatus: 1 });
vendorSchema.index({ approvalStatus: 1 });
vendorSchema.index({ rating: -1 });
vendorSchema.index({ totalSales: -1 });

const VendorModel: Model<IVendorDocument> =
  (mongoose.models.Vendor as Model<IVendorDocument> | undefined) ||
  mongoose.model<IVendorDocument>('Vendor', vendorSchema);

export default VendorModel;
export { VendorModel };

