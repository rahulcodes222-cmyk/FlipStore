/**
 * CommissionConfig Mongoose Model
 */
import mongoose, { Schema, Model } from 'mongoose';

export interface ICommissionConfigDocument {
  _id: string; id: string;
  name: string;
  scope: 'GLOBAL' | 'SELLER' | 'CATEGORY';
  sellerId?: string;
  category?: string;
  commissionPercentage: number;
  fixedFeePaise?: number;
  isActive: boolean;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  priority: number;
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date; updatedAt: Date;
}

const commissionConfigSchema = new Schema<ICommissionConfigDocument>(
  {
    name: { type: String, required: true, trim: true },
    scope: { type: String, enum: ['GLOBAL', 'SELLER', 'CATEGORY'], default: 'GLOBAL', index: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sellerId: { type: Schema.Types.ObjectId as any, ref: 'User', index: true },
    category: { type: String, trim: true, index: true },
    commissionPercentage: { type: Number, required: true, min: 0, max: 100 },
    fixedFeePaise: { type: Number, min: 0, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    effectiveFrom: { type: Date },
    effectiveTo: { type: Date },
    priority: { type: Number, default: 100 },
    notes: { type: String, trim: true },
    createdBy: { type: String, trim: true },
    updatedBy: { type: String, trim: true },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

commissionConfigSchema.index({ scope: 1, isActive: 1, priority: -1 });
commissionConfigSchema.index({ sellerId: 1, isActive: 1, priority: -1 });
commissionConfigSchema.index({ category: 1, isActive: 1, priority: -1 });

const CommissionConfigModel: Model<ICommissionConfigDocument> =
  (mongoose.models.CommissionConfig as Model<ICommissionConfigDocument> | undefined) ||
  mongoose.model<ICommissionConfigDocument>('CommissionConfig', commissionConfigSchema);

export default CommissionConfigModel;
export { CommissionConfigModel };
