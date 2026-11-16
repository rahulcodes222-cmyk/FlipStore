/**
 * Brand Mongoose Model
 * Brand model referenced by Product.
 */

import mongoose, { Schema, Model } from 'mongoose';
import type { IBrandDocument } from '@/backend/types';



const brandSchema = new Schema<IBrandDocument>(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required.'],
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format.'],
    },
    logo: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
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
brandSchema.index({ slug: 1 }, { unique: true });
brandSchema.index({ isPopular: 1 });
brandSchema.index({ isActive: 1 });
brandSchema.index({ name: 'text' });

const BrandModel: Model<IBrandDocument> =
  (mongoose.models.Brand as Model<IBrandDocument> | undefined) ||
  mongoose.model<IBrandDocument>('Brand', brandSchema);

export default BrandModel;
export { BrandModel };
