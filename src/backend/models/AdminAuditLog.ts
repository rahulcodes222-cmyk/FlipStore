import mongoose, { Schema, Model } from 'mongoose';

export type AuditActorRole = 'customer' | 'vendor' | 'admin' | 'super_admin' | 'system';
export interface IAdminAuditLogDocument {
  _id: string;
  actorId?: string;
  actorRole: AuditActorRole;
  actorEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  targetUserId?: string;
  targetRole?: string;
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
  status: 'SUCCESS' | 'FAILURE';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const auditSchema = new Schema<IAdminAuditLogDocument>(
  {
    actorId: { type: Schema.Types.ObjectId as any, ref: 'User', index: true },
    actorRole: { type: String, enum: ['customer', 'vendor', 'admin', 'super_admin', 'system'], required: true, index: true },
    actorEmail: { type: String, trim: true, lowercase: true },
    action: { type: String, required: true, trim: true, index: true },
    resourceType: { type: String, required: true, trim: true, index: true },
    resourceId: { type: String, trim: true, index: true },
    targetUserId: { type: String, trim: true, index: true },
    targetRole: { type: String, trim: true },
    method: { type: String, trim: true },
    path: { type: String, trim: true },
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    status: { type: String, enum: ['SUCCESS', 'FAILURE'], default: 'SUCCESS', index: true },
    severity: { type: String, enum: ['INFO', 'WARNING', 'CRITICAL'], default: 'INFO', index: true },
    message: { type: String, trim: true, maxlength: 1000 },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

auditSchema.index({ createdAt: -1 });
auditSchema.index({ actorId: 1, createdAt: -1 });
auditSchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });

const AdminAuditLogModel: Model<IAdminAuditLogDocument> =
  (mongoose.models.AdminAuditLog as Model<IAdminAuditLogDocument> | undefined) ||
  mongoose.model<IAdminAuditLogDocument>('AdminAuditLog', auditSchema);

export default AdminAuditLogModel;
export { AdminAuditLogModel };
