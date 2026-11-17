import mongoose from 'mongoose';
import { UserModel, VendorModel, SellerStoreModel } from '@/backend/models';
import { hashPassword, validatePasswordStrength } from '@/backend/utils/password';
import { generateSlug } from '@/backend/utils/slug';
import { normalizeVendorApplicationStatus, canVendorAccessDashboard, VENDOR_APPLICATION_STATUSES } from '@/backend/constants';
import type { VendorRegisterInput, VendorApplicationUpdateInput, VendorStoreUpdateInput, AdminVendorStatusInput } from '@/backend/validations/vendor.schema';

const Vendor = VendorModel as any;

type VendorStatus = 'Draft' | 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Suspended';

function maskAccountNumber(accountNumber?: string | null): { masked?: string; last4?: string } {
  if (!accountNumber) return {};
  const digits = String(accountNumber).replace(/\s+/g, '');
  if (!digits) return {};
  const last4 = digits.slice(-4);
  const masked = digits.length <= 4 ? '****' : `${'*'.repeat(Math.max(0, digits.length - 4))}${last4}`;
  return { masked, last4 };
}

function toLegacyApproval(status: VendorStatus): 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' {
  if (status === 'Approved') return 'APPROVED';
  if (status === 'Rejected') return 'REJECTED';
  if (status === 'Suspended') return 'SUSPENDED';
  return 'PENDING';
}

function canTransition(from: VendorStatus, to: VendorStatus): boolean {
  if (from === to) return true;
  const allowed: Record<VendorStatus, VendorStatus[]> = {
    'Draft': ['Draft', 'Pending'],
    'Pending': ['Pending', 'Under Review', 'Approved', 'Rejected', 'Suspended'],
    'Under Review': ['Under Review', 'Approved', 'Rejected', 'Suspended', 'Pending'],
    'Approved': ['Approved', 'Suspended'],
    'Rejected': ['Rejected', 'Under Review', 'Pending'],
    'Suspended': ['Suspended', 'Approved', 'Rejected', 'Under Review'],
  };
  return allowed[from]?.includes(to) ?? false;
}

function assertValidStatus(status: string): asserts status is VendorStatus {
  if (!(VENDOR_APPLICATION_STATUSES as readonly string[]).includes(status)) {
    throw new Error('Invalid vendor status.');
  }
}

async function uniqueStoreSlug(base: string): Promise<string> {
  let slug = generateSlug(base || 'store') || 'store';
  const baseSlug = slug;
  let i = 1;
  while (true) {
    const exists = await Vendor.exists({ storeSlug: slug });
    if (!exists) return slug;
    i += 1;
    slug = `${baseSlug}-${i}`;
  }
}

function buildSellerId(): string {
  return `SEL${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
}

export function sanitizeVendorForResponse(vendor: any) {
  const bank = vendor?.bankDetails || {};
  const obj = vendor?.toObject ? vendor.toObject({ virtuals: true }) : vendor;
  return {
    id: String(obj._id || obj.id),
    userId: String(obj.userId?._id || obj.userId),
    sellerId: obj.sellerId,
    storeName: obj.storeName,
    storeSlug: obj.storeSlug,
    businessDetails: obj.businessDetails || {},
    gstNumber: obj.gstNumber || '',
    panNumber: obj.panNumber || '',
    applicationStatus: normalizeVendorApplicationStatus(obj.applicationStatus || obj.approvalStatus),
    approvalStatus: obj.approvalStatus,
    rejectionReason: obj.rejectionReason,
    suspensionReason: obj.suspensionReason,
    adminNotes: obj.adminNotes,
    submittedAt: obj.submittedAt,
    approvedAt: obj.approvedAt,
    rejectedAt: obj.rejectedAt,
    suspendedAt: obj.suspendedAt,
    lastReviewedAt: obj.lastReviewedAt,
    storeProfile: obj.storeProfile || {},
    bankDetails: bank?.accountLast4 || bank?.accountNumberMasked ? {
      accountHolderName: bank.accountHolderName || '',
      bankName: bank.bankName || '',
      accountNumberMasked: bank.accountNumberMasked || (bank.accountLast4 ? `****${bank.accountLast4}` : undefined),
      accountLast4: bank.accountLast4,
      ifscCode: bank.ifscCode || '',
      upiId: bank.upiId || '',
      branchName: bank.branchName || '',
      updatedAt: bank.updatedAt,
    } : undefined,
    documents: Array.isArray(obj.documents) ? obj.documents.map((d: any) => ({
      id: d.id,
      type: d.type,
      fileName: d.fileName,
      fileUrl: d.fileUrl,
      mimeType: d.mimeType,
      status: d.status,
      uploadedAt: d.uploadedAt,
    })) : [],
    auditLog: Array.isArray(obj.auditLog) ? obj.auditLog.map((a: any) => ({
      action: a.action,
      fromStatus: a.fromStatus,
      toStatus: a.toStatus,
      note: a.note,
      actorId: a.actorId,
      actorRole: a.actorRole,
      actorName: a.actorName,
      createdAt: a.createdAt,
    })) : [],
    rating: obj.rating ?? 0,
    totalSales: obj.totalSales ?? 0,
    totalOrders: obj.totalOrders ?? 0,
    totalProducts: obj.totalProducts ?? 0,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

function buildBankDetails(input?: any) {
  if (!input) return undefined;
  const { masked, last4 } = maskAccountNumber(input.accountNumber);
  const hasAny = masked || input.accountHolderName || input.bankName || input.ifscCode || input.upiId || input.branchName;
  if (!hasAny) return undefined;
  return {
    accountHolderName: input.accountHolderName || '',
    bankName: input.bankName || '',
    accountNumberMasked: masked,
    accountLast4: last4,
    ifscCode: input.ifscCode || '',
    upiId: input.upiId || '',
    branchName: input.branchName || '',
    updatedAt: new Date(),
  };
}

function normalizeDocuments(docs?: Array<{ type: string; fileName?: string; fileUrl?: string; mimeType?: string }>) {
  if (!Array.isArray(docs)) return undefined;
  const now = new Date();
  return docs
    .filter((d) => d && d.type && (d.fileUrl || d.fileName))
    .map((d, idx) => ({
      id: `doc_${Date.now()}_${idx}`,
      type: d.type,
      fileName: d.fileName,
      fileUrl: d.fileUrl,
      mimeType: d.mimeType,
      status: 'uploaded',
      uploadedAt: now,
    }));
}

export async function registerVendorApplication(data: VendorRegisterInput) {
  const existingByEmail = await (UserModel as any).findByEmail?.(data.email) ?? await UserModel.findOne({ email: data.email.toLowerCase() });
  if (existingByEmail) throw new Error('An account with this email already exists.');
  const existingByPhone = await (UserModel as any).findByPhone?.(data.phone) ?? await UserModel.findOne({ phone: data.phone });
  if (existingByPhone) throw new Error('An account with this phone number already exists.');

  const passwordValidation = validatePasswordStrength(data.password);
  if (!passwordValidation.isValid) throw new Error(passwordValidation.errors.join(' '));

  const passwordHash = await hashPassword(data.password);
  const initialStatus: VendorStatus = data.submit ? 'Pending' : 'Draft';
  const storeName = (data.storeName || data.businessName).trim();
  const storeSlug = await uniqueStoreSlug(data.storeSlug || storeName);

  let createdUser: any = null;
  let vendor: any = null;

  try {
    createdUser = await UserModel.create({
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      passwordHash,
      role: 'vendor',
      isEmailVerified: false,
      isPhoneVerified: false,
      isActive: true,
      vendorApplicationStatus: initialStatus,
      isVendorApproved: false,
    });

    const sellerId = buildSellerId();
    vendor = await Vendor.create({
      userId: createdUser._id,
      sellerId,
      storeName,
      storeSlug,
      businessDetails: {
        businessName: data.businessName,
        businessType: data.businessType,
        businessDescription: data.businessDescription || '',
        businessEmail: data.businessEmail || data.email,
        businessPhone: data.businessPhone || data.phone,
        category: data.businessCategory || '',
        address: data.address || undefined,
      },
      gstNumber: data.gstNumber,
      panNumber: data.panNumber,
      applicationStatus: initialStatus,
      approvalStatus: toLegacyApproval(initialStatus),
      submittedAt: initialStatus === 'Pending' ? new Date() : undefined,
      storeProfile: {
        storeName,
        storeSlug,
        description: (data as any).storeDescription || data.businessDescription || '',
        supportEmail: data.businessEmail || data.email,
        supportPhone: data.businessPhone || data.phone,
      },
      bankDetails: buildBankDetails(data.bankDetails),
      documents: normalizeDocuments(data.documents) || [],
      auditLog: [{
        action: initialStatus === 'Pending' ? 'application_submitted' : 'application_created',
        fromStatus: undefined,
        toStatus: initialStatus,
        note: initialStatus === 'Pending' ? 'Vendor submitted application for review.' : 'Vendor application saved as draft.',
        actorId: String(createdUser._id),
        actorRole: 'vendor',
        actorName: data.name,
        createdAt: new Date(),
      }],
      joinedAt: new Date(),
    });

    try {
      await (SellerStoreModel as any).findOneAndUpdate(
        { sellerId: createdUser._id },
        {
          sellerId: createdUser._id,
          storeName,
          storeSlug,
          storeDescription: (data as any).storeDescription || data.businessDescription || '',
          businessCategory: data.businessCategory || '',
          businessType: data.businessType,
          businessEmail: data.businessEmail || data.email,
          businessPhone: data.businessPhone || data.phone,
          address: data.address,
          panNumber: data.panNumber,
          gstNumber: data.gstNumber,
          bankAccountHolder: data.bankDetails?.accountHolderName,
          bankName: data.bankDetails?.bankName,
          ifscCode: data.bankDetails?.ifscCode,
          verificationStatus: initialStatus,
          storeStatus: 'ACTIVE',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    } catch {
      // ignore
    }

    (createdUser as any).vendorId = vendor._id;
    (createdUser as any).vendorApplicationStatus = initialStatus;
    (createdUser as any).isVendorApproved = false;
    await createdUser.save();

    return { user: createdUser, vendor: sanitizeVendorForResponse(vendor), applicationStatus: initialStatus };
  } catch (err) {
    try { if (vendor?._id) await Vendor.deleteOne({ _id: vendor._id }); } catch {}
    try { if (createdUser?._id) { await (SellerStoreModel as any).deleteOne({ sellerId: createdUser._id }); await UserModel.deleteOne({ _id: createdUser._id }); } } catch {}
    throw err;
  }
}

export async function getVendorApplicationByUserId(userId: string) {
  const vendor: any = await Vendor.findOne({ userId: new mongoose.Types.ObjectId(userId) } as any).exec();
  if (!vendor) throw new Error('Vendor application not found.');
  return sanitizeVendorForResponse(vendor);
}

export async function updateVendorApplication(userId: string, data: VendorApplicationUpdateInput) {
  const vendor: any = await Vendor.findOne({ userId: new mongoose.Types.ObjectId(userId) } as any).exec();
  if (!vendor) throw new Error('Vendor application not found.');
  const currentStatus = normalizeVendorApplicationStatus(vendor.applicationStatus);
  if (currentStatus === 'Under Review') {
    throw new Error('Application is under review and cannot be edited right now.');
  }

  const nextStatus: VendorStatus = data.submit ? 'Pending' : (currentStatus === 'Rejected' ? 'Draft' : currentStatus);
  if (!canTransition(currentStatus, nextStatus)) throw new Error('Invalid application status transition.');

  if (data.storeName || data.businessName) {
    vendor.storeName = (data.storeName || data.businessName || vendor.storeName).trim();
    vendor.storeProfile = { ...(vendor.storeProfile || {}), storeName: vendor.storeName };
  }
  const bd = vendor.businessDetails || {};
  vendor.businessDetails = {
    ...bd,
    ...(data.businessName !== undefined ? { businessName: data.businessName } : {}),
    ...(data.businessType !== undefined ? { businessType: data.businessType } : {}),
    ...(data.businessDescription !== undefined ? { businessDescription: data.businessDescription } : {}),
    ...(data.businessEmail !== undefined ? { businessEmail: data.businessEmail } : {}),
    ...(data.businessPhone !== undefined ? { businessPhone: data.businessPhone } : {}),
    ...(data.businessCategory !== undefined ? { category: data.businessCategory } : {}),
    ...(data.address !== undefined ? { address: data.address } : {}),
  };
  if (data.gstNumber !== undefined) vendor.gstNumber = data.gstNumber;
  if (data.panNumber !== undefined) vendor.panNumber = data.panNumber;
  if (data.bankDetails) {
    const updatedBank = buildBankDetails(data.bankDetails);
    if (updatedBank) vendor.bankDetails = { ...(vendor.bankDetails || {}), ...updatedBank, updatedAt: new Date() };
  }
  if (data.documents) {
    const docs = normalizeDocuments(data.documents) || [];
    vendor.documents = [...(vendor.documents || []), ...docs];
  }

  if (data.submit && currentStatus !== 'Pending') {
    vendor.submittedAt = new Date();
  }
  vendor.applicationStatus = nextStatus;
  vendor.approvalStatus = toLegacyApproval(nextStatus);
  if (nextStatus === 'Pending') {
    vendor.rejectionReason = undefined;
  }

  const logs = Array.isArray(vendor.auditLog) ? vendor.auditLog : [];
  logs.push({
    action: data.submit ? 'application_submitted' : 'application_updated',
    fromStatus: currentStatus,
    toStatus: nextStatus,
    note: data.submit ? 'Vendor resubmitted application for review.' : 'Vendor updated application details.',
    actorId: String(userId),
    actorRole: 'vendor',
    createdAt: new Date(),
  });
  vendor.auditLog = logs;

  await vendor.save();
  await UserModel.updateOne({ _id: userId }, { vendorApplicationStatus: nextStatus, isVendorApproved: nextStatus === 'Approved' });
  return sanitizeVendorForResponse(vendor);
}

export async function getVendorStoreByUserId(userId: string) {
  const vendor: any = await Vendor.findOne({ userId: new mongoose.Types.ObjectId(userId) } as any).exec();
  if (!vendor) throw new Error('Vendor store not found.');

  let user: any = null;
  try {
    user = await UserModel.findById(userId).select('name email phone avatar createdAt').lean().exec();
  } catch {}

  const appStatus = normalizeVendorApplicationStatus(vendor.applicationStatus);
  const storeProfile = vendor.storeProfile || {};
  const businessDetails = vendor.businessDetails || {};

  return {
    sellerId: vendor.sellerId,
    vendorId: String(vendor._id || vendor.id),
    name: user?.name || '',
    email: user?.email || businessDetails.businessEmail || '',
    phone: user?.phone || businessDetails.businessPhone || '',
    avatar: user?.avatar || storeProfile.logoUrl || '',
    joinedAt: vendor.joinedAt || vendor.createdAt || user?.createdAt,
    storeName: vendor.storeName,
    storeSlug: vendor.storeSlug,
    storeDescription: storeProfile.description || businessDetails.businessDescription || '',
    storeLogo: storeProfile.logoUrl || '',
    storeBanner: storeProfile.bannerUrl || '',
    businessCategory: businessDetails.category || '',
    businessType: businessDetails.businessType || '',
    businessEmail: businessDetails.businessEmail || storeProfile.supportEmail || user?.email || '',
    businessPhone: businessDetails.businessPhone || storeProfile.supportPhone || user?.phone || '',
    supportEmail: storeProfile.supportEmail || businessDetails.businessEmail || '',
    supportPhone: storeProfile.supportPhone || businessDetails.businessPhone || '',
    gstNumber: vendor.gstNumber || '',
    panNumber: vendor.panNumber || '',
    address: businessDetails.address || null,
    bankDetails: vendor.bankDetails?.accountLast4 || vendor.bankDetails?.accountNumberMasked ? {
      accountHolderName: vendor.bankDetails.accountHolderName || '',
      bankName: vendor.bankDetails.bankName || '',
      accountNumberMasked: vendor.bankDetails.accountNumberMasked || (vendor.bankDetails.accountLast4 ? `****${vendor.bankDetails.accountLast4}` : ''),
      accountLast4: vendor.bankDetails.accountLast4 || '',
      ifscCode: vendor.bankDetails.ifscCode || '',
      upiId: vendor.bankDetails.upiId || '',
      branchName: vendor.bankDetails.branchName || '',
    } : null,
    documents: Array.isArray(vendor.documents) ? vendor.documents.map((d: any) => ({
      id: d.id,
      type: d.type,
      fileName: d.fileName,
      fileUrl: d.fileUrl,
      mimeType: d.mimeType,
      status: d.status,
      uploadedAt: d.uploadedAt,
    })) : [],
    storeProfile,
    businessDetails,
    applicationStatus: appStatus,
    verificationStatus: appStatus,
    storeStatus: 'ACTIVE',
    canAccessDashboard: canVendorAccessDashboard(vendor.applicationStatus),
  };
}

export async function updateVendorStore(userId: string, data: VendorStoreUpdateInput) {
  const vendor: any = await Vendor.findOne({ userId: new mongoose.Types.ObjectId(userId) } as any).exec();
  if (!vendor) throw new Error('Vendor store not found.');
  const storeName = (data.storeName || vendor.storeName).trim();
  if (data.storeSlug && data.storeSlug !== vendor.storeSlug) {
    const existing = await Vendor.findOne({ storeSlug: data.storeSlug, _id: { $ne: vendor._id } } as any).exec();
    if (existing) throw new Error('Store slug is already in use.');
    vendor.storeSlug = data.storeSlug.toLowerCase().trim();
  } else if (data.storeName && data.storeName !== vendor.storeName) {
    vendor.storeSlug = await uniqueStoreSlug(storeName);
  }
  vendor.storeName = storeName;
  vendor.storeProfile = {
    ...(vendor.storeProfile || {}),
    storeName,
    storeSlug: vendor.storeSlug,
    ...(data.description !== undefined || data.storeDescription !== undefined ? { description: data.description ?? data.storeDescription } : {}),
    ...(data.logoUrl !== undefined || data.storeLogo !== undefined ? { logoUrl: data.logoUrl ?? data.storeLogo } : {}),
    ...(data.bannerUrl !== undefined || data.storeBanner !== undefined ? { bannerUrl: data.bannerUrl ?? data.storeBanner } : {}),
    ...(data.supportEmail !== undefined ? { supportEmail: data.supportEmail } : {}),
    ...(data.supportPhone !== undefined ? { supportPhone: data.supportPhone } : {}),
  };
  if (data.businessCategory !== undefined) {
    vendor.businessDetails = { ...(vendor.businessDetails || {}), category: data.businessCategory };
  }
  await vendor.save();
  try {
    await (SellerStoreModel as any).updateOne({ sellerId: userId }, {
      storeName: vendor.storeName,
      storeSlug: vendor.storeSlug,
      storeDescription: vendor.storeProfile?.description || '',
      storeLogo: vendor.storeProfile?.logoUrl || '',
      storeBanner: vendor.storeProfile?.bannerUrl || '',
      businessCategory: vendor.businessDetails?.category || '',
      verificationStatus: normalizeVendorApplicationStatus(vendor.applicationStatus),
    });
  } catch {}
  return getVendorStoreByUserId(userId);
}

export async function listVendorsForAdmin(params: { status?: string; page?: number; limit?: number; search?: string }) {
  const query: any = {};
  if (params.status) {
    query.applicationStatus = normalizeVendorApplicationStatus(params.status);
  }
  if (params.search) {
    const s = params.search.trim();
    query.$or = [
      { storeName: { $regex: s, $options: 'i' } },
      { sellerId: { $regex: s, $options: 'i' } },
      { 'businessDetails.businessName': { $regex: s, $options: 'i' } },
      { 'businessDetails.businessEmail': { $regex: s, $options: 'i' } },
    ];
  }
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Vendor.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).exec(),
    Vendor.countDocuments(query).exec(),
  ]);
  return {
    vendors: items.map(sanitizeVendorForResponse),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function updateVendorStatusByAdmin(vendorId: string, admin: { id: string; role: string; name?: string }, input: AdminVendorStatusInput) {
  const vendor: any = await Vendor.findById(vendorId).exec();
  if (!vendor) throw new Error('Vendor not found.');
  const from = normalizeVendorApplicationStatus(vendor.applicationStatus);
  const to = normalizeVendorApplicationStatus(input.status);
  assertValidStatus(to);
  if (!canTransition(from, to)) {
    throw new Error(`Cannot change vendor status from ${from} to ${to}.`);
  }
  vendor.applicationStatus = to;
  vendor.approvalStatus = toLegacyApproval(to);
  vendor.lastReviewedAt = new Date();
  if (to === 'Approved') {
    vendor.approvedAt = new Date();
    vendor.rejectionReason = undefined;
    vendor.suspensionReason = undefined;
  }
  if (to === 'Rejected') {
    vendor.rejectedAt = new Date();
    vendor.rejectionReason = input.reason || input.note || vendor.rejectionReason;
  }
  if (to === 'Suspended') {
    vendor.suspendedAt = new Date();
    vendor.suspensionReason = input.reason || input.note || vendor.suspensionReason;
  }
  if (input.note) vendor.adminNotes = input.note;

  const logs = Array.isArray(vendor.auditLog) ? vendor.auditLog : [];
  logs.push({
    action: 'status_changed',
    fromStatus: from,
    toStatus: to,
    note: input.note || input.reason || `Status changed to ${to}`,
    actorId: admin.id,
    actorRole: admin.role,
    actorName: admin.name,
    createdAt: new Date(),
  });
  vendor.auditLog = logs;
  await vendor.save();

  await UserModel.updateOne(
    { _id: vendor.userId },
    { vendorApplicationStatus: to, isVendorApproved: to === 'Approved' },
  );
  try {
    await (SellerStoreModel as any).updateOne({ sellerId: vendor.userId }, { verificationStatus: to });
  } catch {}

  return sanitizeVendorForResponse(vendor);
}