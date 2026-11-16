/**
 * ReturnRequest Mongoose Model
 * Return/refund request model linked to order and suborder.
 */

import mongoose, { Schema, Model } from 'mongoose';
import type { IReturnRequestDocument } from '@/backend/types';



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

const returnRequestSchema = new Schema<IReturnRequestDocument>(
  {
    returnNumber: {
      type: String,
      required: [true, 'Return number is required.'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    orderId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'Order',
      required: [true, 'Order reference is required.'],
      index: true,
    },
    subOrderId: {
      type: String,
      trim: true,
      index: true,
    },
    sellerId: {
      type: String,
      trim: true,
      index: true,
    },
    customerId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: [true, 'Customer reference is required.'],
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    productId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'Product',
      required: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required.'],
      min: 1,
    },
    type: {
      type: String,
      enum: ['RETURN', 'REPLACEMENT'],
      default: 'RETURN',
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required.'],
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'REFUNDED', 'REPLACED'],
      default: 'PENDING',
      index: true,
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
    },
    refundAmount: {
      type: Number,
      required: [true, 'Refund amount is required.'],
      min: 0,
    },
    refundStatus: { type: String, trim: true },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
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
returnRequestSchema.index({ returnNumber: 1 }, { unique: true });
returnRequestSchema.index({ orderId: 1 });
returnRequestSchema.index({ subOrderId: 1 });
returnRequestSchema.index({ customerId: 1 });
returnRequestSchema.index({ productId: 1 });
returnRequestSchema.index({ status: 1 });
returnRequestSchema.index({ requestDate: -1 });
returnRequestSchema.index({ customerId: 1, status: 1 });

const ReturnRequestModel: Model<IReturnRequestDocument> =
  (mongoose.models.ReturnRequest as Model<IReturnRequestDocument> | undefined) ||
  mongoose.model<IReturnRequestDocument>('ReturnRequest', returnRequestSchema);

export default ReturnRequestModel;
export { ReturnRequestModel };

