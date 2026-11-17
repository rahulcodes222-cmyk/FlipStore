/**
 * Backend TypeScript Types
 * Shared types for the backend layer
 */

import type { UserRole } from '@/backend/constants/roles';
import type {
  PaymentMethod,
  PaymentStatus,
  OrderStatus,
  ProductStatus,
  StockStatus,
  ReturnStatus,
  ReviewStatus,
  SellerOrderStatus,
  OrderPaymentStatus,
  NotificationType,
  NotificationStatus,
  NotificationCategory,
  CouponStatus,
  PayoutStatus,
  PaymentTransactionStatus,
  SellerVerificationStatus,
  SellerStoreStatus,
} from '@/types';

/**
 * API Response Envelope
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: Record<string, string[]>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasMore?: boolean;
  };
  timestamp: string;
  requestId?: string;
}

/**
 * Paginated API Response
 */
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Auth Types
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export interface LoginPayload {
  emailOrPhone: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: UserRole;
  businessName?: string;
  businessType?: string;
}

export interface VendorRegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword?: string;
  businessName: string;
  businessType: string;
  businessDescription?: string;
  businessEmail?: string;
  businessPhone?: string;
  gstNumber?: string;
  panNumber?: string;
  address?: Record<string, unknown>;
  storeName?: string;
  storeDescription?: string;
  businessCategory?: string;
  bankDetails?: {
    accountHolderName?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  };
  documents?: Array<{
    type: string;
    fileName?: string;
    fileUrl?: string;
    mimeType?: string;
  }>;
}

/**
 * JWTPayload
 */
export interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Password Hash Result
 */
export interface HashResult {
  hash: string;
  salt: string;
}

/**
 * Request Context (attached by auth middleware)
 */
export interface AuthenticatedRequest {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
  requestId: string;
  url: string;
}

/**
 * Database Model Types (Mongoose)
 */
export interface IUserDocument {
  _id: string;
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  avatar?: string;
  addresses: IAddressDocument[];
  defaultAddressId?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  passwordResetToken?: string;
  passwordResetExpiresAt?: Date;
  emailVerificationToken?: string;
  emailVerificationExpiresAt?: Date;
  vendorId?: string;
  vendorApplicationStatus?: string;
  isVendorApproved?: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  hasRole(minRole: UserRole): boolean;
  save(): Promise<IUserDocument>;
}

export interface ISellerDocument extends IUserDocument {
  sellerId: string;
  storeName: string;
  storeSlug: string;
}

/**
 * Address Model Type
 */
export interface IAddressDocument {
  _id: string;
  id: string;
  userId: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  pincode: string;
  locality: string;
  street: string;
  city: string;
  state: string;
  landmark?: string;
  type: 'home' | 'work' | 'business';
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Category Model Type
 */
export interface ICategoryDocument {
  _id: string;
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  icon?: string;
  parentId?: string | null;
  parent?: ICategoryDocument | null;
  itemCount?: number;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Brand Model Type
 */
export interface IBrandDocument {
  _id: string;
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  isPopular: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product approval workflow types
 */
export type ProductApprovalStatus = 'Draft' | 'Pending Approval' | 'Under Review' | 'Approved' | 'Rejected' | 'Changes Requested';
export type ProductPublicationStatus = 'Active' | 'Inactive';

export interface IProductApprovalHistoryEntry {
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
  createdAt?: Date | string;
}

/**
 * Product Model Type
 */
export interface IProductDocument {
  _id: string;
  id: string;
  sellerId: string;
  name: string;
  slug: string;
  sku: string;
  barcode?: string;
  category: string;
  categoryId?: string;
  subcategory?: string;
  brand?: string;
  brandId?: string;
  description: string;
  shortDescription?: string;
  highlights?: string[];
  specifications: Record<string, string>;
  price: number;
  mrp: number;
  discountPercentage: number;
  taxPercentage: number;
  stock: number;
  lowStockThreshold: number;
  status: ProductStatus; // legacy/compat
  approvalStatus?: ProductApprovalStatus;
  productStatus?: ProductPublicationStatus;
  rejectionReason?: string;
  adminComment?: string;
  submittedAt?: Date | string;
  reviewedAt?: Date | string;
  reviewedBy?: string;
  approvedAt?: Date | string;
  approvedBy?: string;
  changesRequestedAt?: Date | string;
  rejectedAt?: Date | string;
  approvalHistory?: IProductApprovalHistoryEntry[];
  images: IProductImage[];
  variants: IProductVariantDocument[];
  seoTitle?: string;
  seoDescription?: string;
  unitsSold: number;
  totalRevenue: number;
  rating: number;
  reviewCount: number;
  isAssured: boolean;
  isFreeDelivery: boolean;
  estimatedDeliveryDays: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product Image Type
 */
export interface IProductImage {
  id: string;
  url: string;
  alt?: string;
  isPrimary: boolean;
}

/**
 * Product Variant Model Type
 */
export interface IProductVariantDocument {
  _id: string;
  id: string;
  productId: string;
  sku: string;
  size?: string;
  color?: string;
  price: number;
  mrp: number;
  stock: number;
  weight?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Cart Model Type
 */
export interface ICartDocument {
  _id: string;
  id: string;
  userId: string;
  items: ICartItem[];
  updatedAt: Date;
}

/**
 * Cart Item Type
 */
export interface ICartItem {
  id: string;
  productId: string;
  variantId?: string;
  productName: string;
  thumbnail?: string;
  price: number;
  mrp: number;
  quantity: number;
  selectedVariants?: Record<string, string>;
  addedAt: Date;
}

/**
 * Wishlist Model Type
 */
export interface IWishlistDocument {
  _id: string;
  id: string;
  userId: string;
  items: IWishlistItem[];
  updatedAt: Date;
}

/**
 * Wishlist Item Type
 */
export interface IWishlistItem {
  id: string;
  productId: string;
  productName: string;
  thumbnail?: string;
  price: number;
  addedAt: Date;
}

/**
 * Order Model Type
 */
export interface IOrderStatusHistoryEntry {
  status: string;
  note?: string;
  actorRole?: string;
  actorId?: string;
  timestamp: Date;
}

export interface IOrderDocument {
  _id: string;
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: IOrderItem[];
  subOrderIds?: string[];
  shippingAddress: IAddressDocument | string;
  paymentMethod: PaymentMethod;
  paymentStatus: OrderPaymentStatus;
  orderStatus: SellerOrderStatus | string;
  pricing: IOrderPricing;
  appliedCouponId?: string;
  statusHistory?: IOrderStatusHistoryEntry[];
  cancelReason?: string;
  cancelledAt?: Date;
  placedAt: Date;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Order Item Type
 */
export interface IOrderItem {
  id: string;
  productId: string;
  variantId?: string;
  title: string;
  thumbnail?: string;
  price: number;
  mrp: number;
  quantity: number;
  selectedVariants?: Record<string, string>;
  sellerId: string;
}

/**
 * Order Pricing Type
 */
export interface IOrderPricing {
  totalMrp: number;
  discount: number;
  couponDiscount: number;
  deliveryCharges: number;
  totalAmount: number;
}

/**
 * SubOrder Model Type
 */
export interface ISubOrderDocument {
  _id: string;
  id: string;
  subOrderNumber: string;
  orderId: string;
  sellerId: string;
  sellerName: string;
  items: IOrderItem[];
  shippingAddress: IAddressDocument | string;
  paymentMethod: PaymentMethod;
  paymentStatus: OrderPaymentStatus;
  orderStatus: SellerOrderStatus | string;
  pricing: IOrderPricing;
  commission: ICommissionBreakdown;
  statusHistory?: IOrderStatusHistoryEntry[];
  cancelReason?: string;
  cancelledAt?: Date;
  placedAt: Date;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Commission Breakdown Type
 */
export interface ICommissionBreakdown {
  sellingPrice: number;
  commissionPercentage: number;
  commissionAmount: number;
  sellerNetAmount: number;
}

/**
 * Payment Model Type
 */
export interface IPaymentDocument {
  _id: string;
  id: string;
  transactionId: string;
  orderId: string;
  subOrderId?: string;
  customerId: string;
  customerName: string;
  paymentDate: Date;
  grossAmount: number;
  commission: number;
  netAmount: number;
  paymentMethod: PaymentMethod;
  status: PaymentTransactionStatus;
  gateway?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
  idempotencyKey?: string;
  refundAmount?: number;
  refundedAt?: Date;
  failureReason?: string;
  gatewayResponse?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Review Model Type
 */
export interface IReviewDocument {
  _id: string;
  id: string;
  productId: string;
  orderId?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  sellerReply?: string;
  replyAt?: Date;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Coupon Model Type
 */
export interface ICouponDocument {
  _id: string;
  id: string;
  sellerId?: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  startDate: Date;
  expiryDate: Date;
  usageLimit: number;
  usedCount: number;
  status: CouponStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Vendor Model Type (Part 11 onboarding/approval)
 */
export interface IVendorBankDetails {
  accountHolderName?: string;
  bankName?: string;
  accountNumberMasked?: string;
  accountLast4?: string;
  ifscCode?: string;
  upiId?: string;
  branchName?: string;
  updatedAt?: Date | string;
}

export interface IVendorDocumentUpload {
  id: string;
  type: string;
  fileName?: string;
  fileUrl?: string;
  mimeType?: string;
  status?: string;
  uploadedAt?: Date | string;
}

export interface IVendorAuditLogEntry {
  action: string;
  fromStatus?: string;
  toStatus?: string;
  note?: string;
  actorId?: string;
  actorRole?: string;
  actorName?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date | string;
}

export interface IVendorStoreProfile {
  storeName?: string;
  storeSlug?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export interface IVendorDocument {
  _id: string;
  id: string;
  userId: string;
  sellerId: string;
  storeName: string;
  storeSlug: string;
  businessDetails: IBusinessDetails;
  gstNumber?: string;
  panNumber?: string;
  applicationStatus?: 'Draft' | 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Suspended';
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  rejectionReason?: string;
  suspensionReason?: string;
  adminNotes?: string;
  submittedAt?: Date | string;
  approvedAt?: Date | string;
  rejectedAt?: Date | string;
  suspendedAt?: Date | string;
  lastReviewedAt?: Date | string;
  storeProfile?: IVendorStoreProfile;
  bankDetails?: IVendorBankDetails;
  documents?: IVendorDocumentUpload[];
  auditLog?: IVendorAuditLogEntry[];
  commissionRate: number;
  rating: number;
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  availableBalance: number;
  totalEarnings: number;
  pendingOrders: number;
  cancelledOrders: number;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Business Details Type
 */
export interface IBusinessDetails {
  businessName?: string;
  businessType?: string;
  businessDescription?: string;
  businessEmail?: string;
  businessPhone?: string;
  category?: string;
  address?: IAddressDocument | Record<string, unknown>;
}

/**
 * SellerStore Model Type
 */
export interface ISellerStoreDocument {
  _id: string;
  id: string;
  sellerId: string;
  storeName: string;
  storeSlug: string;
  storeDescription?: string;
  storeLogo?: string;
  storeBanner?: string;
  businessCategory?: string;
  businessType?: string;
  businessEmail?: string;
  businessPhone?: string;
  address?: IAddressDocument | Record<string, unknown>;
  panNumber?: string;
  gstNumber?: string;
  businessRegistration?: string;
  bankAccountHolder?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  verificationStatus: SellerVerificationStatus | string;
  storeStatus: SellerStoreStatus;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Inventory Model Type
 */
export interface IInventoryDocument {
  _id: string;
  id: string;
  productId: string;
  sellerId: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
  reservedStock: number;
  availableStock: number;
  status: StockStatus;
  lastUpdated: Date;
}

/**
 * Notification Model Type
 */
export interface INotificationDocument {
  _id: string;
  id: string;
  sellerId?: string;
  customerId?: string;
  userId?: string;
  audienceRole?: 'customer' | 'vendor' | 'admin' | 'super_admin';
  type: string;
  category: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  time: Date;
  status: NotificationStatus;
  readAt?: Date;
  link?: string;
  metadata?: Record<string, unknown>;
  dedupeKey?: string;
  channels?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ReturnRequest Model Type
 */
export interface IReturnRequestDocument {
  _id: string;
  id: string;
  returnNumber: string;
  orderId: string;
  subOrderId?: string;
  sellerId?: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  productId: string;
  productName: string;
  quantity: number;
  type?: 'RETURN' | 'REPLACEMENT';
  reason: string;
  status: ReturnStatus | string;
  requestDate: Date;
  resolvedAt?: Date;
  refundAmount: number;
  refundStatus?: string;
  statusHistory?: IOrderStatusHistoryEntry[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Commission Model Type (Part 13)
 */
export interface ICommissionDocument {
  _id: string;
  id: string;
  sellerId: string;
  orderId: string;
  subOrderId?: string;
  orderItemId?: string;
  productId?: string;
  configId?: string;
  ruleScope?: 'GLOBAL' | 'SELLER' | 'CATEGORY' | 'DEFAULT';
  sellingPrice: number;
  commissionPercentage: number;
  commissionAmount: number;
  sellerNetAmount: number;
  grossAmountPaise?: number;
  commissionAmountPaise?: number;
  sellerNetAmountPaise?: number;
  refundedCommissionPaise?: number;
  refundedSellerNetPaise?: number;
  currency?: 'INR';
  status: 'PENDING' | 'EARNED' | 'AVAILABLE' | 'PAID' | 'FAILED' | 'REVERSED' | 'REFUNDED' | string;
  calculationKey?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Payout Model Type (Part 13)
 */
export type VendorPayoutStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'FAILED';
export interface IPayoutDocument {
  _id: string;
  id: string;
  sellerId: string;
  payoutNumber?: string;
  amount: number;
  amountPaise?: number;
  currency?: 'INR';
  date: Date;
  requestedAt?: Date;
  reviewedAt?: Date;
  processedAt?: Date;
  completedAt?: Date;
  status: VendorPayoutStatus | PayoutStatus | string;
  bankAccount: string;
  bankName: string;
  accountHolderName?: string;
  ifscCodeMasked?: string;
  bankVerificationStatus?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'FAILED';
  bankVerifiedAt?: Date;
  bankVerifiedBy?: string;
  referenceId?: string;
  transactionReference?: string;
  provider?: string;
  providerPayoutId?: string;
  reconciliationStatus?: 'NOT_REQUIRED' | 'PENDING' | 'CONFIRMED' | 'FAILED';
  reconciledAt?: Date;
  reconciledBy?: string;
  requestNote?: string;
  adminNote?: string;
  rejectionReason?: string;
  failureReason?: string;
  reviewedBy?: string;
  idempotencyKey?: string;
  statusHistory?: Array<{ status?: string; note?: string; actorId?: string; actorRole?: string; timestamp?: Date | string }>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Shipment Model Type
 */
export interface IShipmentDocument {
  _id: string;
  id: string;
  orderId: string;
  subOrderId?: string;
  sellerId: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  status: 'PENDING' | 'PACKED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED' | 'RETURNED' | string;
  currentLocation?: string;
  shippedAt?: Date;
  outForDeliveryAt?: Date;
  deliveredAt?: Date;
  estimatedDelivery?: Date;
  statusHistory?: IOrderStatusHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export type { UserRole };
export type { HttpStatusCode } from '@/backend/constants';
