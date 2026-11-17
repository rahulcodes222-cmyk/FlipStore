import mongoose from 'mongoose';

export type ApprovalStatus = 'Draft' | 'Pending Approval' | 'Under Review' | 'Approved' | 'Rejected' | 'Changes Requested';
export type PublicationStatus = 'Active' | 'Inactive';

export const APPROVAL_STATUSES: ApprovalStatus[] = ['Draft', 'Pending Approval', 'Under Review', 'Approved', 'Rejected', 'Changes Requested'];
export const PUBLICATION_STATUSES: PublicationStatus[] = ['Active', 'Inactive'];

export function normalizeApprovalStatus(v: any): ApprovalStatus {
  const s = String(v || '').trim().toLowerCase().replace(/[_-]+/g, ' ');
  if (!s) return 'Draft';
  if (s === 'draft') return 'Draft';
  if (s === 'pending' || s === 'pending approval' || s === 'submitted') return 'Pending Approval';
  if (s === 'under review' || s === 'review' || s === 'in review') return 'Under Review';
  if (s === 'approved') return 'Approved';
  if (s === 'rejected') return 'Rejected';
  if (s === 'changes requested' || s === 'request changes' || s === 'requested changes') return 'Changes Requested';
  return 'Draft';
}

export function normalizePublicationStatus(v: any): PublicationStatus {
  const s = String(v || '').trim().toLowerCase();
  if (s === 'active' || s === 'enabled' || s === 'published') return 'Active';
  return 'Inactive';
}

export function deriveLegacyStatus(approvalStatus: ApprovalStatus, publicationStatus: PublicationStatus, stock: number): 'DRAFT' | 'PUBLISHED' | 'OUT_OF_STOCK' | 'REJECTED' {
  if (approvalStatus === 'Rejected') return 'REJECTED';
  if (approvalStatus === 'Approved' && publicationStatus === 'Active') return stock <= 0 ? 'OUT_OF_STOCK' : 'PUBLISHED';
  return 'DRAFT';
}

export function syncProductApprovalState(product: any) {
  const hasNewFields = product?.approvalStatus != null || product?.productStatus != null;
  const legacyStatus = String(product?.status || 'DRAFT').toUpperCase();
  let approvalStatus: ApprovalStatus = normalizeApprovalStatus(product?.approvalStatus);
  let publicationStatus: PublicationStatus = normalizePublicationStatus(product?.productStatus);

  if (!hasNewFields) {
    if (legacyStatus === 'PUBLISHED') { approvalStatus = 'Approved'; publicationStatus = 'Active'; }
    else if (legacyStatus === 'REJECTED') { approvalStatus = 'Rejected'; publicationStatus = 'Inactive'; }
    else { approvalStatus = 'Draft'; publicationStatus = 'Inactive'; }
  } else {
    if (product?.approvalStatus == null) approvalStatus = legacyStatus === 'PUBLISHED' ? 'Approved' : legacyStatus === 'REJECTED' ? 'Rejected' : 'Draft';
    if (product?.productStatus == null) publicationStatus = legacyStatus === 'PUBLISHED' ? 'Active' : 'Inactive';
  }

  // Enforce invariant: only approved products can be active
  if (approvalStatus !== 'Approved') publicationStatus = 'Inactive';

  const effectiveStock = Number(product?.stock || 0);
  product.approvalStatus = approvalStatus;
  product.productStatus = publicationStatus;
  product.status = deriveLegacyStatus(approvalStatus, publicationStatus, effectiveStock);
  if (!Array.isArray(product.approvalHistory)) product.approvalHistory = [];
  return product;
}

export function isPubliclyVisibleProduct(product: any): boolean {
  syncProductApprovalState(product);
  const stock = Number(product?.stock || 0);
  return product.approvalStatus === 'Approved' && product.productStatus === 'Active' && stock > 0;
}

export function publicProductVisibilityMongoFilter() {
  // Legacy compatibility: existing published products without new approval fields remain visible until migrated.
  return {
    stock: { $gt: 0 },
    $or: [
      { approvalStatus: 'Approved', productStatus: 'Active' },
      { approvalStatus: { $exists: false }, status: 'PUBLISHED' },
      { approvalStatus: null, status: 'PUBLISHED' },
    ],
  } as Record<string, any>;
}

export function buildApprovalHistoryEntry(input: {
  action: string;
  fromApprovalStatus?: string;
  toApprovalStatus?: string;
  fromProductStatus?: string;
  toProductStatus?: string;
  reason?: string;
  comment?: string;
  actorId?: string;
  actorRole?: string;
  actorName?: string;
  metadata?: Record<string, unknown>;
}) {
  return {
    action: input.action,
    fromApprovalStatus: input.fromApprovalStatus,
    toApprovalStatus: input.toApprovalStatus,
    fromProductStatus: input.fromProductStatus,
    toProductStatus: input.toProductStatus,
    reason: input.reason,
    comment: input.comment,
    actorId: input.actorId && mongoose.isValidObjectId(input.actorId) ? new mongoose.Types.ObjectId(input.actorId) : undefined,
    actorRole: input.actorRole,
    actorName: input.actorName,
    metadata: input.metadata || {},
    createdAt: new Date(),
  };
}