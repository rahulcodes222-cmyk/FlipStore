import mongoose, { Schema, Model } from 'mongoose';

export interface IStaticPage {
  slug: string;
  title: string;
  content: string; // HTML content
  image?: string;
  images?: string[];
  isActive: boolean;
  updatedBy?: mongoose.Types.ObjectId | string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IStaticPageDocument extends IStaticPage, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

const staticPageSchema = new Schema<IStaticPageDocument>(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, default: '' },
    image: { type: String, default: '' },
    images: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    updatedBy: { type: Schema.Types.ObjectId as any, ref: 'User', default: null },
  },
  { timestamps: true },
);

staticPageSchema.index({ slug: 1 }, { unique: true });

const MODEL_NAME = 'StaticPage';
if (process.env.NODE_ENV !== 'production' && mongoose.models[MODEL_NAME]) {
  mongoose.deleteModel(MODEL_NAME);
}

const StaticPageModel: Model<IStaticPageDocument> =
  (mongoose.models[MODEL_NAME] as Model<IStaticPageDocument>) ||
  mongoose.model<IStaticPageDocument>(MODEL_NAME, staticPageSchema);

export default StaticPageModel;
export { StaticPageModel };
