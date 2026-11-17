import mongoose from 'mongoose';
import { ProductModel, UserModel, VendorModel } from '@/backend/models';
import { buildApprovalHistoryEntry, syncProductApprovalState, type ApprovalStatus } from '@/backend/utils/productApproval';
import { notifyUser, writeAuditLog } from '@/backend/services/notificationService';
import { NOTIFICATION_TYPES } from '@/backend/constants/notifications';

function toId(v: any): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v._id) return String(v._id);
  return String(v);
}

function assertValidId(id: string, label = 'ID') {
  const v = String(id || '').trim();
  if (!v || v === 'undefined' || v === 'null' || !mongoose.isValidObjectId(v)) throw new Error(`Invalid ${label}.`);
  return v;
}

function mapSellerInfo(user: any, vendor: any) {
  return {
    id: user?._id ? String(user._id) : vendor?.userId ? String(vendor.userId) : '',
    name: user?.name || vendor?.storeName || 'Seller',
    email: user?.email || vendor?.businessDetails?.businessEmail || '',
    storeName: vendor?.storeName || vendor?.businessDetails?.businessName || '',
    sellerCode: vendor?.sellerId || '',
  };
}

function toAdminApprovalProduct(p: any, seller?: any) {
  syncProductApprovalState(p);
  const images = Array.isArray(p.images) ? p.images : [];
  const primary = images.find((i: any) => i?.isPrimary) || images[0];
  return {
    id: String(p._id || p.id),
    sellerId: toId(p.sellerId),
    seller: seller || null,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    category: p.category,
    subcategory: p.subcategory || '',
    brand: p.brand || '',
    description: p.description || '',
    shortDescription: p.shortDescription || '',
    highlights: Array.isArray(p.highlights) ? p.highlights : [],
    specifications: p.specifications instanceof Map ? Object.fromEntries(p.specifications) : (p.specifications || {}),
    price: Number(p.price || 0),
    mrp: Number(p.mrp || 0),
    discountPercentage: Number(p.discountPercentage || 0),
    taxPercentage: Number(p.taxPercentage || 0),
    stock: Number(p.stock || 0),
    lowStockThreshold: Number(p.lowStockThreshold || 0),
    status: p.status,
    approvalStatus: p.approvalStatus,
    productStatus: p.productStatus,
    rejectionReason: p.rejectionReason || '',
    adminComment: p.adminComment || '',
    submittedAt: p.submittedAt || null,
    reviewedAt: p.reviewedAt || null,
    reviewedBy: p.reviewedBy ? toId(p.reviewedBy) : null,
    approvedAt: p.approvedAt || null,
    approvedBy: p.approvedBy ? toId(p.approvedBy) : null,
    changesRequestedAt: p.changesRequestedAt || null,
    rejectedAt: p.rejectedAt || null,
    thumbnail: primary?.url || '',
    images: images.map((img: any) => ({ id: img.id, url: img.url, alt: img.alt, isPrimary: !!img.isPrimary })),
    variants: Array.isArray(p.variants) ? p.variants : [],
    approvalHistory: Array.isArray(p.approvalHistory) ? p.approvalHistory.map((h: any) => ({
      action: h.action,
      fromApprovalStatus: h.fromApprovalStatus,
      toApprovalStatus: h.toApprovalStatus,
      fromProductStatus: h.fromProductStatus,
      toProductStatus: h.toProductStatus,
      reason: h.reason,
      comment: h.comment,
      actorId: h.actorId ? toId(h.actorId) : undefined,
      actorRole: h.actorRole,
      actorName: h.actorName,
      metadata: h.metadata || {},
      createdAt: h.createdAt,
    })) : [],
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

async function loadSellerMaps(sellerIds: string[]) {
  const unique = Array.from(new Set(sellerIds.filter((id) => mongoose.isValidObjectId(id))));
  if (!unique.length) return new Map<string, any>();
  const [users, vendors] = await Promise.all([
    UserModel.find({ _id: { $in: unique } }).select('_id name email role').lean().exec(),
    VendorModel.find({ userId: { $in: unique } }).select('userId storeName sellerId businessDetails').lean().exec(),
  ]);
  const userById = new Map((users as any[]).map((u) => [String(u._id), u]));
  const vendorByUserId = new Map((vendors as any[]).map((v) => [String(v.userId), v]));
  const map = new Map<string, any>();
  for (const id of unique) map.set(id, mapSellerInfo(userById.get(id), vendorByUserId.get(id)));
  return map;
}

function tabToApprovalStatuses(tab?: string): ApprovalStatus[] | undefined {
  if (!tab || tab === 'all') return undefined;
  if (tab === 'pending') return ['Pending Approval'];
  if (tab === 'under_review') return ['Under Review'];
  if (tab === 'approved') return ['Approved'];
  if (tab === 'rejected') return ['Rejected'];
  if (tab === 'changes_requested') return ['Changes Requested'];
  if (tab === 'draft') return ['Draft'];
  return undefined;
}

export async function listAdminProductApprovals(query: any) {
  const filter: any = {};
  const tabStatuses = tabToApprovalStatuses(query?.tab);
  if (query?.approvalStatus) filter.approvalStatus = query.approvalStatus;
  else if (tabStatuses) filter.approvalStatus = { $in: tabStatuses };
  if (query?.productStatus) filter.productStatus = query.productStatus;
  if (query?.sellerId && mongoose.isValidObjectId(query.sellerId)) filter.sellerId = query.sellerId;
  if (query?.category) filter.category = query.category;
  if (query?.status) {
    const s = String(query.status);
    if (['DRAFT', 'PUBLISHED', 'OUT_OF_STOCK', 'REJECTED'].includes(s.toUpperCase())) filter.status = s.toUpperCase();
  }
  if (query?.search) {
    const q = String(query.search).trim();
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { sku: { $regex: q, $options: 'i' } },
        { slug: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
      ];
    }
  }

  const page = Math.max(1, Number(query?.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query?.limit || 20)));
  let sort: any = { createdAt: -1 };
  switch (query?.sortBy) {
    case 'oldest': sort = { createdAt: 1 }; break;
    case 'name_asc': sort = { name: 1 }; break;
    case 'name_desc': sort = { name: -1 }; break;
    case 'submitted_asc': sort = { submittedAt: 1, createdAt: 1 }; break;
    case 'submitted_desc': sort = { submittedAt: -1, createdAt: -1 }; break;
    default: sort = { createdAt: -1 };
  }

  const [rows, total, countsAgg] = await Promise.all([
    ProductModel.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean().exec(),
    ProductModel.countDocuments(filter).exec(),
    ProductModel.aggregate([{ $group: { _id: '$approvalStatus', count: { $sum: 1 } } }]).exec(),
  ]);

  // Backfill/sync legacy docs in returned page so existing published products remain visible in admin list
  const docs = await Promise.all(rows.map(async (r: any) => {
    if (!r.approvalStatus || !r.productStatus) {
      try {
        const doc: any = await ProductModel.findById(r._id).exec();
        if (doc) { syncProductApprovalState(doc); await doc.save(); return doc.toObject(); }
      } catch {}
    }
    return r;
  }));

  const sellerMap = await loadSellerMaps(docs.map((d: any) => toId(d.sellerId)));
  const data = docs.map((d: any) => toAdminApprovalProduct(d, sellerMap.get(toId(d.sellerId)) || null));
  const counts: Record<string, number> = { all: 0, draft: 0, pending: 0, under_review: 0, approved: 0, rejected: 0, changes_requested: 0 };
  for (const c of countsAgg as any[]) {
    counts.all += Number(c.count || 0);
    const k = String(c._id || '');
    if (k === 'Draft') counts.draft = Number(c.count || 0);
    if (k === 'Pending Approval') counts.pending = Number(c.count || 0);
    if (k === 'Under Review') counts.under_review = Number(c.count || 0);
    if (k === 'Approved') counts.approved = Number(c.count || 0);
    if (k === 'Rejected') counts.rejected = Number(c.count || 0);
    if (k === 'Changes Requested') counts.changes_requested = Number(c.count || 0);
  }

  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1, hasMore: page * limit < total },
    counts,
  };
}

export async function getAdminProductApprovalById(productId: string) {
  const id = assertValidId(productId, 'product ID');
  let product: any = await ProductModel.findById(id).lean().exec();
  if (!product) throw new Error('Product not found.');
  if (!product.approvalStatus || !product.productStatus) {
    const doc: any = await ProductModel.findById(id).exec();
    if (doc) { syncProductApprovalState(doc); await doc.save(); product = doc.toObject(); }
  }
  const sellerMap = await loadSellerMaps([toId(product.sellerId)]);
  return toAdminApprovalProduct(product, sellerMap.get(toId(product.sellerId)) || null);
}

async function getProductForReview(productId: string) {
  const id = assertValidId(productId, 'product ID');
  const product: any = await ProductModel.findById(id).exec();
  if (!product) throw new Error('Product not found.');
  syncProductApprovalState(product);
  return product;
}

async function actorName(userId: string) {
  if (!userId || !mongoose.isValidObjectId(userId)) return undefined;
  const u: any = await UserModel.findById(userId).select('name role').lean().exec();
  return u?.name;
}

export async function approveProductByAdmin(productId: string, adminId: string, input: { adminComment?: string; activate?: boolean; notifySeller?: boolean }) {
  const product = await getProductForReview(productId);
  const fromApproval = String(product.approvalStatus || 'Draft') as ApprovalStatus;
  const fromPublication = String(product.productStatus || 'Inactive');
  const now = new Date();
  const activate = input.activate !== false;

  product.approvalStatus = 'Approved';
  // keep approved product inactive if explicitly requested or out of stock? allow activate flag; stock visibility still enforced publicly
  product.productStatus = activate ? 'Active' : 'Inactive';
  product.reviewedAt = now;
  product.reviewedBy = new mongoose.Types.ObjectId(adminId);
  product.approvedAt = now;
  product.approvedBy = new mongoose.Types.ObjectId(adminId);
  product.rejectionReason = '';
  product.adminComment = input.adminComment || product.adminComment || '';
  product.changesRequestedAt = undefined;
  product.rejectedAt = undefined;
  product.approvalHistory = [...(product.approvalHistory || []), buildApprovalHistoryEntry({
    action: 'APPROVED',
    fromApprovalStatus: fromApproval,
    toApprovalStatus: 'Approved',
    fromProductStatus: fromPublication,
    toProductStatus: product.productStatus,
    comment: input.adminComment,
    actorId: adminId,
    actorRole: 'admin',
    actorName: await actorName(adminId),
  })];
  syncProductApprovalState(product);
  await product.save();

  await writeAuditLog({ actorId: adminId, actorRole: 'admin', action: 'admin_product_approved', resourceType: 'product', resourceId: String(product._id), before: { approvalStatus: fromApproval, productStatus: fromPublication }, after: { approvalStatus: 'Approved', productStatus: product.productStatus }, metadata: { sellerId: toId(product.sellerId), activate } }).catch(() => {});
  if (input.notifySeller !== false) {
    await notifyUser({
      recipientUserId: toId(product.sellerId),
      recipientRole: 'vendor',
      type: NOTIFICATION_TYPES.PRODUCT_APPROVED,
      category: 'PRODUCT',
      title: 'Product approved',
      message: `"${product.name}" has been approved${product.productStatus === 'Active' ? ' and is now active' : ''}.`,
      link: '/seller/products',
      metadata: { productId: String(product._id), approvalStatus: 'Approved', productStatus: product.productStatus },
      dedupeKey: `product-approved:${String(product._id)}:${now.toISOString()}`,
    }).catch(() => {});
  }
  const sellerMap = await loadSellerMaps([toId(product.sellerId)]);
  return toAdminApprovalProduct(product.toObject ? product.toObject() : product, sellerMap.get(toId(product.sellerId)) || null);
}

export async function rejectProductByAdmin(productId: string, adminId: string, input: { reason: string; adminComment?: string; notifySeller?: boolean }) {
  const reason = String(input.reason || '').trim();
  if (!reason) throw new Error('Rejection reason is required.');
  const product = await getProductForReview(productId);
  const fromApproval = String(product.approvalStatus || 'Draft') as ApprovalStatus;
  const fromPublication = String(product.productStatus || 'Inactive');
  const now = new Date();
  product.approvalStatus = 'Rejected';
  product.productStatus = 'Inactive';
  product.rejectionReason = reason;
  product.adminComment = input.adminComment || '';
  product.reviewedAt = now;
  product.reviewedBy = new mongoose.Types.ObjectId(adminId);
  product.rejectedAt = now;
  product.changesRequestedAt = undefined;
  product.approvalHistory = [...(product.approvalHistory || []), buildApprovalHistoryEntry({
    action: 'REJECTED',
    fromApprovalStatus: fromApproval,
    toApprovalStatus: 'Rejected',
    fromProductStatus: fromPublication,
    toProductStatus: 'Inactive',
    reason,
    comment: input.adminComment,
    actorId: adminId,
    actorRole: 'admin',
    actorName: await actorName(adminId),
  })];
  syncProductApprovalState(product);
  await product.save();

  await writeAuditLog({ actorId: adminId, actorRole: 'admin', action: 'admin_product_rejected', resourceType: 'product', resourceId: String(product._id), before: { approvalStatus: fromApproval, productStatus: fromPublication }, after: { approvalStatus: 'Rejected', productStatus: 'Inactive' }, metadata: { sellerId: toId(product.sellerId), reason } }).catch(() => {});
  if (input.notifySeller !== false) {
    await notifyUser({
      recipientUserId: toId(product.sellerId),
      recipientRole: 'vendor',
      type: NOTIFICATION_TYPES.PRODUCT_REJECTED,
      category: 'PRODUCT',
      title: 'Product rejected',
      message: `"${product.name}" was rejected. Reason: ${reason}`,
      link: '/seller/products',
      metadata: { productId: String(product._id), approvalStatus: 'Rejected', reason },
      dedupeKey: `product-rejected:${String(product._id)}:${now.toISOString()}`,
    }).catch(() => {});
  }
  const sellerMap = await loadSellerMaps([toId(product.sellerId)]);
  return toAdminApprovalProduct(product.toObject ? product.toObject() : product, sellerMap.get(toId(product.sellerId)) || null);
}

export async function requestProductChangesByAdmin(productId: string, adminId: string, input: { comment: string; adminComment?: string; notifySeller?: boolean }) {
  const comment = String(input.comment || '').trim();
  if (!comment) throw new Error('Change request comment is required.');
  const product = await getProductForReview(productId);
  const fromApproval = String(product.approvalStatus || 'Draft') as ApprovalStatus;
  const fromPublication = String(product.productStatus || 'Inactive');
  const now = new Date();
  product.approvalStatus = 'Changes Requested';
  product.productStatus = 'Inactive';
  product.adminComment = comment;
  product.rejectionReason = '';
  product.reviewedAt = now;
  product.reviewedBy = new mongoose.Types.ObjectId(adminId);
  product.changesRequestedAt = now;
  product.approvalHistory = [...(product.approvalHistory || []), buildApprovalHistoryEntry({
    action: 'CHANGES_REQUESTED',
    fromApprovalStatus: fromApproval,
    toApprovalStatus: 'Changes Requested',
    fromProductStatus: fromPublication,
    toProductStatus: 'Inactive',
    comment,
    actorId: adminId,
    actorRole: 'admin',
    actorName: await actorName(adminId),
  })];
  syncProductApprovalState(product);
  await product.save();

  await writeAuditLog({ actorId: adminId, actorRole: 'admin', action: 'admin_product_changes_requested', resourceType: 'product', resourceId: String(product._id), before: { approvalStatus: fromApproval, productStatus: fromPublication }, after: { approvalStatus: 'Changes Requested', productStatus: 'Inactive' }, metadata: { sellerId: toId(product.sellerId), comment } }).catch(() => {});
  if (input.notifySeller !== false) {
    await notifyUser({
      recipientUserId: toId(product.sellerId),
      recipientRole: 'vendor',
      type: NOTIFICATION_TYPES.PRODUCT_CHANGES_REQUESTED,
      category: 'PRODUCT',
      title: 'Changes requested for product',
      message: `"${product.name}" needs changes: ${comment}`,
      link: '/seller/products',
      metadata: { productId: String(product._id), approvalStatus: 'Changes Requested', comment },
      dedupeKey: `product-changes:${String(product._id)}:${now.toISOString()}`,
    }).catch(() => {});
  }
  const sellerMap = await loadSellerMaps([toId(product.sellerId)]);
  return toAdminApprovalProduct(product.toObject ? product.toObject() : product, sellerMap.get(toId(product.sellerId)) || null);
}
