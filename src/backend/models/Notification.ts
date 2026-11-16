/**
 * Notification Mongoose Model (Part 15)
 * User-specific in-app notifications with pagination/read/delete support.
 */
import mongoose, { Schema, Model } from 'mongoose';
import type { INotificationDocument } from '@/backend/types';

const notificationSchema = new Schema<INotificationDocument>(
  {
    sellerId: { type: Schema.Types.ObjectId as any, ref: 'User', index: true },
    customerId: { type: Schema.Types.ObjectId as any, ref: 'User', index: true },
    userId: { type: Schema.Types.ObjectId as any, ref: 'User', index: true },
    audienceRole: { type: String, enum: ['customer', 'vendor', 'admin', 'super_admin'], index: true },
    type: { type: String, required: true, index: true, trim: true, maxlength: 80 },
    category: { type: String, required: true, index: true, trim: true, maxlength: 50 },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    time: { type: Date, default: Date.now, index: true },
    status: { type: String, enum: ['UNREAD', 'READ', 'PROCESSING'], default: 'UNREAD', index: true },
    readAt: { type: Date },
    link: { type: String, trim: true, maxlength: 500 },
    metadata: { type: Schema.Types.Mixed, default: {} },
    dedupeKey: { type: String, trim: true, index: true, sparse: true },
    channels: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, toJSON: { virtuals: true } },
);

notificationSchema.index({ sellerId: 1, status: 1, time: -1 });
notificationSchema.index({ customerId: 1, status: 1, time: -1 });
notificationSchema.index({ userId: 1, status: 1, time: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ dedupeKey: 1, userId: 1 }, { sparse: true });

const NotificationModel: Model<INotificationDocument> =
  (mongoose.models.Notification as Model<INotificationDocument> | undefined) ||
  mongoose.model<INotificationDocument>('Notification', notificationSchema);

export default NotificationModel;
export { NotificationModel };
