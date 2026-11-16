/**
 * FinancialLedger Mongoose Model (immutable append-only).
 */
import mongoose, { Schema, Model } from 'mongoose';

export type LedgerEntryType =
  | 'EARNING_CREDIT'
  | 'COMMISSION_DEBIT'
  | 'REFUND_DEBIT'
  | 'PAYOUT_REQUEST_DEBIT'
  | 'PAYOUT_REJECT_CREDIT'
  | 'PAYOUT_FAIL_CREDIT'
  | 'ADJUSTMENT_CREDIT'
  | 'ADJUSTMENT_DEBIT';

export interface IFinancialLedgerDocument {
  _id: string;
  id: string;
  sellerId: string;
  type: LedgerEntryType;
  direction: 'CREDIT' | 'DEBIT';
  status: 'PENDING' | 'AVAILABLE' | 'COMPLETED' | 'REVERSED';
  amountPaise: number;
  currency: 'INR';
  balanceBucket: 'GROSS' | 'PENDING' | 'AVAILABLE' | 'PAYOUT' | 'COMMISSION' | 'REFUND' | 'ADJUSTMENT';
  orderId?: string;
  subOrderId?: string;
  paymentId?: string;
  commissionId?: string;
  payoutId?: string;
  refundId?: string;
  referenceType?: string;
  referenceId?: string;
  idempotencyKey?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const financialLedgerSchema = new Schema<IFinancialLedgerDocument>(
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sellerId: { type: Schema.Types.ObjectId as any, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['EARNING_CREDIT','COMMISSION_DEBIT','REFUND_DEBIT','PAYOUT_REQUEST_DEBIT','PAYOUT_REJECT_CREDIT','PAYOUT_FAIL_CREDIT','ADJUSTMENT_CREDIT','ADJUSTMENT_DEBIT'],
      required: true,
      index: true,
    },
    direction: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
    status: { type: String, enum: ['PENDING', 'AVAILABLE', 'COMPLETED', 'REVERSED'], default: 'PENDING', index: true },
    amountPaise: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['INR'], default: 'INR' },
    balanceBucket: { type: String, enum: ['GROSS','PENDING','AVAILABLE','PAYOUT','COMMISSION','REFUND','ADJUSTMENT'], required: true, index: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    orderId: { type: Schema.Types.ObjectId as any, ref: 'Order', index: true },
    subOrderId: { type: String, index: true },
    paymentId: { type: String, index: true },
    commissionId: { type: String, index: true },
    payoutId: { type: String, index: true },
    refundId: { type: String, index: true },
    referenceType: { type: String, trim: true },
    referenceId: { type: String, trim: true },
    idempotencyKey: { type: String, trim: true },
    description: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

financialLedgerSchema.index({ sellerId: 1, createdAt: -1 });
financialLedgerSchema.index({ sellerId: 1, type: 1, createdAt: -1 });
financialLedgerSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
financialLedgerSchema.index({ referenceType: 1, referenceId: 1, type: 1 });

function immutableGuard(this: any) {
  if (!this.isNew) throw new Error('Financial ledger entries are immutable.');
}
financialLedgerSchema.pre('validate', immutableGuard);
financialLedgerSchema.pre('save', immutableGuard);

const FinancialLedgerModel: Model<IFinancialLedgerDocument> =
  (mongoose.models.FinancialLedger as Model<IFinancialLedgerDocument> | undefined) ||
  mongoose.model<IFinancialLedgerDocument>('FinancialLedger', financialLedgerSchema);

export default FinancialLedgerModel;
export { FinancialLedgerModel };
