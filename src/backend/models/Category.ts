/**
 * Category Mongoose Model
 * Hierarchical category model with parent-child references.
 */

import mongoose, { Schema, Model } from 'mongoose';
import type { ICategoryDocument } from '@/backend/types';



const categorySchema = new Schema<ICategoryDocument>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required.'],
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
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    image: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
    },
    parentId: {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Schema.Types.ObjectId as any,
      ref: 'Category',
      default: null,
      index: true,
    },
    itemCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isFeatured: {
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
categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ parentId: 1 });
categorySchema.index({ isFeatured: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ name: 'text', description: 'text' });

const CategoryModel: Model<ICategoryDocument> =
  (mongoose.models.Category as Model<ICategoryDocument> | undefined) ||
  mongoose.model<ICategoryDocument>('Category', categorySchema);

export default CategoryModel;
export { CategoryModel };

