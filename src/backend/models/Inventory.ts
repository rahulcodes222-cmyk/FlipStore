/**
 * Inventory Mongoose Model
 * Inventory tracking per product per seller with stock levels.
 */

import mongoose, { Schema, Model } from 'mongoose';
import type { IInventoryDocument } from '@/backend/types';



const inventorySchema = new Schema<IInventoryDocument>(
  {
    productId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'Product',
      required: [true, 'Product reference is required.'],
      index: true,
    },
    sellerId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: [true, 'Seller reference is required.'],
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required.'],
      trim: true,
      uppercase: true,
      index: true,
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required.'],
      min: 0,
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      required: [true, 'Low stock threshold is required.'],
      min: 0,
    },
    reservedStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'],
      default: 'IN_STOCK',
      index: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
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
inventorySchema.index({ productId: 1 });
inventorySchema.index({ sellerId: 1 });
inventorySchema.index({ sku: 1 });
inventorySchema.index({ status: 1 });
inventorySchema.index({ sellerId: 1, status: 1 });
inventorySchema.index({ productId: 1, sellerId: 1 });

const InventoryModel: Model<IInventoryDocument> =
  (mongoose.models.Inventory as Model<IInventoryDocument> | undefined) ||
  mongoose.model<IInventoryDocument>('Inventory', inventorySchema);

export default InventoryModel;
export { InventoryModel };

