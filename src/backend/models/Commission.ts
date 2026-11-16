/**
 * Commission Mongoose Model (Part 13)
 */
import mongoose, { Schema, Model } from 'mongoose';
import type { ICommissionDocument } from '@/backend/types';

const commissionSchema = new Schema<ICommissionDocument>(
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sellerId: { type: Schema.Types.ObjectId as any, ref: 'User', required: true, index: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    orderId: { type: Schema.Types.ObjectId as any, ref: 'Order', required: true, index: true },
    subOrderId: { type: String, trim: true, index: true },
    orderItemId: { type: String, trim: true, index: true },
    productId: { type: String, trim: true, index: true },
    configId: { type: String, trim: true },
    ruleScope: { type: String, enum: ['GLOBAL', 'SELLER', 'CATEGORY', 'DEFAULT'], default: 'DEFAULT' },
    sellingPrice: { type: Number, required: true, min: 0 },
    commissionPercentage: { type: Number, required: true, min: 0, max: 100 },
    commissionAmount: { type: Number, required: true, min: 0 },
    sellerNetAmount: { type: Number, required: true, min: 0 },
    grossAmountPaise: { type: Number, min: 0, default: 0 },
    commissionAmountPaise: { type: Number, min: 0, default: 0 },
    sellerNetAmountPaise: { type: Number, min: 0, default: 0 },
    refundedCommissionPaise: { type: Number, min: 0, default: 0 },
    refundedSellerNetPaise: { type: Number, min: 0, default: 0 },
    currency: { type: String, enum: ['INR'], default: 'INR' },
    status: { type: String, enum: ['PENDING','EARNED','AVAILABLE','PAID','FAILED','REVERSED','REFUNDED'], default: 'PENDING', index: true },
    calculationKey: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

commissionSchema.index({ sellerId: 1, status: 1 });
commissionSchema.index({ sellerId: 1, createdAt: -1 });
commissionSchema.index({ orderId: 1, subOrderId: 1 });
commissionSchema.index({ calculationKey: 1 }, { unique: true, sparse: true });

const CommissionModel: Model<ICommissionDocument> =
  (mongoose.models.Commission as Model<ICommissionDocument> | undefined) ||
  mongoose.model<ICommissionDocument>('Commission', commissionSchema);

export default CommissionModel;
export { CommissionModel };
