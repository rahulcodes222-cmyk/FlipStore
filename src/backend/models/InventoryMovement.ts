import mongoose, { Schema, Model } from 'mongoose';

export interface IInventoryMovementDocument {
  _id: string;
  id: string;
  sellerId: string;
  productId: string;
  variantId?: string;
  sku?: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RESERVED' | 'RELEASED';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  referenceType?: string;
  referenceId?: string;
  actorId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryMovementSchema = new Schema<IInventoryMovementDocument>(
  {
    sellerId: { type: String, required: true, index: true },
    productId: { type: Schema.Types.ObjectId as any, ref: 'Product', required: true, index: true },
    variantId: { type: String, trim: true },
    sku: { type: String, trim: true, uppercase: true },
    type: { type: String, enum: ['IN', 'OUT', 'ADJUSTMENT', 'RESERVED', 'RELEASED'], required: true, index: true },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true, min: 0 },
    newStock: { type: Number, required: true, min: 0 },
    reason: { type: String, trim: true, maxlength: 500 },
    referenceType: { type: String, trim: true },
    referenceId: { type: String, trim: true },
    actorId: { type: String, trim: true },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

inventoryMovementSchema.index({ sellerId: 1, createdAt: -1 });
inventoryMovementSchema.index({ productId: 1, createdAt: -1 });
inventoryMovementSchema.index({ sellerId: 1, productId: 1, createdAt: -1 });

const InventoryMovementModel: Model<IInventoryMovementDocument> =
  (mongoose.models.InventoryMovement as Model<IInventoryMovementDocument> | undefined) ||
  mongoose.model<IInventoryMovementDocument>('InventoryMovement', inventoryMovementSchema);

export default InventoryMovementModel;
export { InventoryMovementModel };
