/**
 * Address Mongoose Model
 * Standalone address model referenced by User, Order, and SellerStore.
 */

import mongoose, { Schema, Model } from 'mongoose';
import type { IAddressDocument } from '@/backend/types';



const addressSchema = new Schema<IAddressDocument>(
  {
    userId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'User',
      required: [true, 'User reference is required.'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required.'],
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'PIN code is required.'],
      trim: true,
      match: [/^[1-9][0-9]{5}$/, 'Invalid PIN code.'],
    },
    locality: {
      type: String,
      required: [true, 'Locality is required.'],
      trim: true,
    },
    street: {
      type: String,
      required: [true, 'Street is required.'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required.'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required.'],
      trim: true,
    },
    landmark: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['home', 'work', 'business'],
      default: 'home',
    },
    isDefault: {
      type: Boolean,
      default: false,
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
addressSchema.index({ userId: 1 });
addressSchema.index({ userId: 1, isDefault: 1 });
addressSchema.index({ pincode: 1 });

const AddressModel: Model<IAddressDocument> =
  (mongoose.models.Address as Model<IAddressDocument> | undefined) ||
  mongoose.model<IAddressDocument>('Address', addressSchema);

export default AddressModel;
export { AddressModel };

