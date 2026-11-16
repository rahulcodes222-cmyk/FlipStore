/**
 * Shipment Mongoose Model
 * Shipment tracking model linked to order and suborder.
 */

import mongoose, { Schema, Model } from 'mongoose';
import type { IShipmentDocument } from '@/backend/types';



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

const shipmentSchema = new Schema<IShipmentDocument>(
  {
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
    sellerId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: true,
      index: true,
    },
    trackingNumber: {
      type: String,
      trim: true,
    },
    trackingUrl: {
      type: String,
      trim: true,
    },
    carrier: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'RETURNED'],
      default: 'PENDING',
      index: true,
    },
    currentLocation: { type: String, trim: true },
    shippedAt: {
      type: Date,
    },
    outForDeliveryAt: { type: Date },
    deliveredAt: {
      type: Date,
    },
    estimatedDelivery: {
      type: Date,
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);

// Indexes
shipmentSchema.index({ orderId: 1 });
shipmentSchema.index({ subOrderId: 1 });
shipmentSchema.index({ sellerId: 1 });
shipmentSchema.index({ status: 1 });
shipmentSchema.index({ trackingNumber: 1 });
shipmentSchema.index({ sellerId: 1, status: 1 });

const ShipmentModel: Model<IShipmentDocument> =
  (mongoose.models.Shipment as Model<IShipmentDocument> | undefined) ||
  mongoose.model<IShipmentDocument>('Shipment', shipmentSchema);

export default ShipmentModel;
export { ShipmentModel };

