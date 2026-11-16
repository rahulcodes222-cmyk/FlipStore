/**
 * Payout Mongoose Model (Part 13)
 */
import mongoose, { Schema, Model } from 'mongoose';
import type { IPayoutDocument } from '@/backend/types';

const payoutSchema = new Schema<IPayoutDocument>(
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sellerId: { type: Schema.Types.ObjectId as any, ref: 'User', required: true, index: true },
    payoutNumber: { type: String, trim: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    amountPaise: { type: Number, min: 0, default: 0 },
    currency: { type: String, enum: ['INR'], default: 'INR' },
    date: { type: Date, default: Date.now },
    requestedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    processedAt: { type: Date },
    completedAt: { type: Date },
    status: {
      type: String,
      enum: ['PENDING','UNDER_REVIEW','APPROVED','PROCESSING','COMPLETED','REJECTED','FAILED','PAID','CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    bankAccount: { type: String, required: true, trim: true },
    bankName: { type: String, required: true, trim: true },
    accountHolderName: { type: String, trim: true },
    ifscCodeMasked: { type: String, trim: true },
    bankVerificationStatus: { type: String, enum: ['UNVERIFIED','PENDING','VERIFIED','FAILED'], default: 'UNVERIFIED' },
    bankVerifiedAt: { type: Date },
    bankVerifiedBy: { type: String, trim: true },
    referenceId: { type: String, trim: true, index: true },
    transactionReference: { type: String, trim: true, index: true },
    provider: { type: String, trim: true },
    providerPayoutId: { type: String, trim: true },
    reconciliationStatus: { type: String, enum: ['NOT_REQUIRED','PENDING','CONFIRMED','FAILED'], default: 'PENDING' },
    reconciledAt: { type: Date },
    reconciledBy: { type: String, trim: true },
    requestNote: { type: String, trim: true },
    adminNote: { type: String, trim: true },
    rejectionReason: { type: String, trim: true },
    failureReason: { type: String, trim: true },
    reviewedBy: { type: String, trim: true },
    idempotencyKey: { type: String, trim: true },
    statusHistory: {
      type: [new Schema({ status: String, note: String, actorId: String, actorRole: String, timestamp: { type: Date, default: Date.now } }, { _id: false })],
      default: [],
    },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

payoutSchema.index({ sellerId: 1, createdAt: -1 });
payoutSchema.index({ sellerId: 1, status: 1 });
payoutSchema.index({ status: 1, createdAt: -1 });
payoutSchema.index({ payoutNumber: 1 }, { unique: true, sparse: true });
payoutSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

const PayoutModel: Model<IPayoutDocument> =
  (mongoose.models.Payout as Model<IPayoutDocument> | undefined) ||
  mongoose.model<IPayoutDocument>('Payout', payoutSchema);

export default PayoutModel;
export { PayoutModel };
