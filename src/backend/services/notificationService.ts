import mongoose from 'mongoose';
import { NotificationModel, UserModel } from '@/backend/models';
import { AdminAuditLogModel } from '@/backend/models/AdminAuditLog';
import { logger } from '@/backend/utils/logger';
import { NOTIFICATION_CATEGORIES, NOTIFICATION_TYPES } from '@/backend/constants/notifications';
import { env } from '@/backend/config/env';

type Recipient = { userId?: string; role?: 'customer' | 'vendor' | 'admin' | 'super_admin'; email?: string; phone?: string };

export interface CreateNotificationInput {
  recipientUserId: string;
  recipientRole?: 'customer' | 'vendor' | 'admin' | 'super_admin';
  type: string;
  category?: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  dedupeKey?: string;
  channels?: { inApp?: boolean; email?: boolean; sms?: boolean };
}

function toObjectId(id: string) {
  return mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : id;
}

function inferCategory(type: string): string {
  const t = type.toUpperCase();
  if (t.includes('ORDER') || t.includes('SHIP') || t.includes('DELIVER') || t.includes('CANCEL')) return NOTIFICATION_CATEGORIES.ORDER;
  if (t.includes('PAYMENT') || t.includes('REFUND')) return NOTIFICATION_CATEGORIES.PAYMENT;
  if (t.includes('PAYOUT')) return NOTIFICATION_CATEGORIES.PAYOUT;
  if (t.includes('VENDOR')) return NOTIFICATION_CATEGORIES.VENDOR;
  if (t.includes('INVENTORY') || t.includes('LOW_STOCK') || t.includes('STOCK')) return NOTIFICATION_CATEGORIES.INVENTORY;
  if (t.includes('ADMIN')) return NOTIFICATION_CATEGORIES.ADMIN;
  if (t.includes('RETURN')) return NOTIFICATION_CATEGORIES.RETURN;
  if (t.includes('PRODUCT')) return NOTIFICATION_CATEGORIES.PRODUCT;
  return NOTIFICATION_CATEGORIES.SYSTEM;
}

export async function createInAppNotification(input: CreateNotificationInput) {
  const recipientRole = input.recipientRole;
  const payload: any = {
    type: input.type,
    category: input.category || inferCategory(input.type),
    title: input.title.slice(0, 200),
    message: input.message.slice(0, 1000),
    time: new Date(),
    status: 'UNREAD',
    link: input.link,
    metadata: { ...(input.metadata || {}), dedupeKey: input.dedupeKey },
  };
  if (recipientRole === 'vendor') payload.sellerId = toObjectId(input.recipientUserId);
  else payload.customerId = toObjectId(input.recipientUserId); // admins/customers stored in customerId field for user-specific access

  if (input.dedupeKey) {
    const existing = await NotificationModel.findOne({
      $or: [{ sellerId: input.recipientUserId }, { customerId: input.recipientUserId }],
      'metadata.dedupeKey': input.dedupeKey,
      type: input.type,
    }).lean().exec();
    if (existing) return existing;
  }
  const doc = await NotificationModel.create(payload);
  return doc.toObject ? doc.toObject() : doc;
}

export async function getUserForNotification(userId: string) {
  if (!userId || !mongoose.isValidObjectId(userId)) return null;
  return UserModel.findById(userId).select('_id email phone name role').lean().exec() as Promise<any>;
}

export async function deliverExternalChannels(recipient: Recipient, event: { type: string; subject: string; text: string; html?: string }, channels?: { email?: boolean; sms?: boolean }) {
  const results: any = { email: { attempted: false, delivered: false, provider: env.notificationEmailProvider || 'none', reason: 'not_requested' }, sms: { attempted: false, delivered: false, provider: env.notificationSmsProvider || 'none', reason: 'not_requested' } };

  if (channels?.email) {
    results.email.attempted = true;
    if (!env.notificationEmailProvider || !env.notificationEmailFrom || !recipient.email) {
      results.email.reason = !env.notificationEmailProvider ? 'email_provider_not_configured' : !env.notificationEmailFrom ? 'email_from_not_configured' : 'recipient_email_missing';
    } else {
      // Provider integration hook: intentionally not faking delivery.
      results.email.reason = 'provider_integration_not_configured_for_runtime';
      logger.info('Email notification skipped (no live provider adapter executed)', { to: recipient.email, type: event.type, provider: env.notificationEmailProvider });
    }
  }

  if (channels?.sms) {
    results.sms.attempted = true;
    if (!env.notificationSmsProvider || !recipient.phone) {
      results.sms.reason = !env.notificationSmsProvider ? 'sms_provider_not_configured' : 'recipient_phone_missing';
    } else {
      results.sms.reason = 'provider_integration_not_configured_for_runtime';
      logger.info('SMS notification skipped (no live provider adapter executed)', { to: recipient.phone, type: event.type, provider: env.notificationSmsProvider });
    }
  }
  return results;
}

export async function notifyUser(input: CreateNotificationInput) {
  try {
    const inAppEnabled = input.channels?.inApp !== false;
    let notification: any = null;
    if (inAppEnabled) notification = await createInAppNotification(input);
    let delivery: any = null;
    if (input.channels?.email || input.channels?.sms) {
      const user = await getUserForNotification(input.recipientUserId);
      delivery = await deliverExternalChannels(
        { userId: input.recipientUserId, role: input.recipientRole, email: user?.email, phone: user?.phone },
        { type: input.type, subject: input.title, text: input.message },
        { email: !!input.channels?.email, sms: !!input.channels?.sms },
      );
    }
    return { notification, delivery };
  } catch (error) {
    logger.warn('Notification dispatch failed (non-fatal)', { type: input.type, recipientUserId: input.recipientUserId, error });
    return { notification: null, delivery: null, error };
  }
}

export async function notifyAdmins(input: Omit<CreateNotificationInput, 'recipientUserId' | 'recipientRole'>) {
  try {
    const admins = await UserModel.find({ role: { $in: ['admin', 'super_admin'] }, isActive: { $ne: false } }).select('_id role').lean().exec();
    const out = [] as any[];
    for (const a of admins as any[]) {
      out.push(await notifyUser({ ...input, recipientUserId: String(a._id), recipientRole: a.role }));
    }
    return out;
  } catch (error) {
    logger.warn('Admin notification dispatch failed (non-fatal)', { type: input.type, error });
    return [];
  }
}

export async function listNotificationsForUser(userId: string, role: string, query: { page: number; limit: number; status?: string; category?: string; type?: string }) {
  const filter: any = {};
  if (role === 'vendor') filter.sellerId = toObjectId(userId);
  else filter.customerId = toObjectId(userId);
  if (query.status) filter.status = query.status;
  if (query.category) filter.category = query.category;
  if (query.type) filter.type = query.type;
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
  const skip = (page - 1) * limit;
  const [rows, total, unreadCount] = await Promise.all([
    NotificationModel.find(filter).sort({ time: -1, createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
    NotificationModel.countDocuments(filter).exec(),
    NotificationModel.countDocuments({ ...filter, status: 'UNREAD' }).exec(),
  ]);
  const data = rows.map((n: any) => ({
    id: String(n._id),
    type: n.type,
    category: n.category,
    title: n.title,
    message: n.message,
    time: n.time || n.createdAt,
    status: n.status,
    readAt: n.readAt,
    link: n.link,
    metadata: n.metadata,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  }));
  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1, hasMore: page * limit < total }, unreadCount };
}

function ownerFilter(userId: string, role: string) {
  if (role === 'vendor') return { sellerId: toObjectId(userId) } as any;
  return { customerId: toObjectId(userId) } as any;
}

export async function markNotificationRead(userId: string, role: string, id: string) {
  if (!mongoose.isValidObjectId(id)) return null;
  return NotificationModel.findOneAndUpdate(
    { _id: id, ...ownerFilter(userId, role) },
    { $set: { status: 'READ', readAt: new Date() } },
    { new: true },
  ).lean().exec();
}

export async function markAllNotificationsRead(userId: string, role: string) {
  const res = await NotificationModel.updateMany(
    { ...ownerFilter(userId, role), status: { $ne: 'READ' } },
    { $set: { status: 'READ', readAt: new Date() } },
  ).exec();
  return { modified: (res as any).modifiedCount ?? (res as any).nModified ?? 0 };
}

export async function deleteNotificationForUser(userId: string, role: string, id: string) {
  if (!mongoose.isValidObjectId(id)) return false;
  const res = await NotificationModel.deleteOne({ _id: id, ...ownerFilter(userId, role) }).exec();
  return ((res as any).deletedCount ?? 0) > 0;
}

export async function writeAuditLog(input: {
  actorId?: string; actorRole?: string; actorEmail?: string; action: string; resourceType: string; resourceId?: string;
  targetUserId?: string; targetRole?: string; method?: string; path?: string; ip?: string; userAgent?: string;
  status?: 'SUCCESS' | 'FAILURE'; severity?: 'INFO' | 'WARNING' | 'CRITICAL'; message?: string;
  before?: Record<string, unknown>; after?: Record<string, unknown>; metadata?: Record<string, unknown>;
}) {
  try {
    await AdminAuditLogModel.create({
      actorId: input.actorId && mongoose.isValidObjectId(input.actorId) ? new mongoose.Types.ObjectId(input.actorId) : undefined,
      actorRole: (input.actorRole as any) || 'system',
      actorEmail: input.actorEmail,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      targetUserId: input.targetUserId,
      targetRole: input.targetRole,
      method: input.method,
      path: input.path,
      ip: input.ip,
      userAgent: input.userAgent,
      status: input.status || 'SUCCESS',
      severity: input.severity || 'INFO',
      message: input.message,
      before: input.before,
      after: input.after,
      metadata: input.metadata,
    } as any);
  } catch (error) {
    logger.warn('Audit log write failed', { action: input.action, resourceType: input.resourceType, error });
  }
}

export { NOTIFICATION_TYPES, NOTIFICATION_CATEGORIES };
