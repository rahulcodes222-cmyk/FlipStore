/**
 * Payment Mongoose Model
 * Payment transaction model linked to orders and suborders.
 */

import mongoose, { Schema, Model } from 'mongoose';
import type { IPaymentDocument } from '@/backend/types';



const paymentSchema = new Schema<IPaymentDocument>(
  {
    transactionId: {
      type: String,
      required: [true, 'Transaction ID is required.'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    orderId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'Order',
      required: true,
      index: true,
    },
    subOrderId: {
      type: String,
      trim: true,
      index: true,
    },
    customerId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    grossAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    commission: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    netAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['COD', 'UPI', 'CARD', 'NET_BANKING'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    gateway: {
      type: String,
      trim: true,
      default: 'RAZORPAY',
    },
    gatewayOrderId: {
      type: String,
      trim: true,
      index: true,
    },
    gatewayPaymentId: {
      type: String,
      trim: true,
      index: true,
    },
    gatewaySignature: {
      type: String,
      trim: true,
    },
    idempotencyKey: {
      type: String,
      trim: true,
      index: true,
    },
    refundAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    refundedAt: {
      type: Date,
    },
    failureReason: {
      type: String,
      trim: true,
    },
    gatewayResponse: {
      type: Schema.Types.Mixed,
      default: {},
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
paymentSchema.index({ transactionId: 1 }, { unique: true });
paymentSchema.index({ orderId: 1 }, { unique: true });
paymentSchema.index({ subOrderId: 1 });
paymentSchema.index({ customerId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ gatewayOrderId: 1 }, { sparse: true });
paymentSchema.index({ gatewayPaymentId: 1 }, { sparse: true });
paymentSchema.index({ idempotencyKey: 1 }, { sparse: true });
paymentSchema.index({ customerId: 1, status: 1 });

const PaymentModel: Model<IPaymentDocument> =
  (mongoose.models.Payment as Model<IPaymentDocument> | undefined) ||
  mongoose.model<IPaymentDocument>('Payment', paymentSchema);

export default PaymentModel;
export { PaymentModel };

