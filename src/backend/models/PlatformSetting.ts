import mongoose, { Schema, Model } from 'mongoose';

export interface IPlatformDeliverySettings {
  standardDeliveryCharge: number;
  freeDeliveryAboveAmount: number;
}

export interface IPlatformSetting {
  key: string;
  delivery: IPlatformDeliverySettings;
  updatedBy?: mongoose.Types.ObjectId | string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPlatformSettingDocument extends IPlatformSetting, mongoose.Document {
  _id: mongoose.Types.ObjectId;
}

const deliverySchema = new Schema<IPlatformDeliverySettings>(
  {
    standardDeliveryCharge: { type: Number, default: 40, min: 0 },
    freeDeliveryAboveAmount: { type: Number, default: 499, min: 0 },
  },
  { _id: false },
);

const platformSettingSchema = new Schema<IPlatformSettingDocument>(
  {
    key: { type: String, required: true, unique: true, trim: true, default: 'global' },
    delivery: { type: deliverySchema, default: () => ({}) },
    updatedBy: { type: Schema.Types.ObjectId as any, ref: 'User', default: null },
  },
  { timestamps: true },
);

platformSettingSchema.index({ key: 1 }, { unique: true });

const PlatformSettingModel: Model<IPlatformSettingDocument> =
  (mongoose.models.PlatformSetting as Model<IPlatformSettingDocument> | undefined) ||
  mongoose.model<IPlatformSettingDocument>('PlatformSetting', platformSettingSchema);

export default PlatformSettingModel;
export { PlatformSettingModel };
