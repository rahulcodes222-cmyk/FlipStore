/**
 * Core TypeScript Interfaces for Indian E-commerce
 * Inspired by Flipkart & Amazon India
 */

export interface Product {
  id: string;
  title: string;
  slug: string;
  brandId: string;
  brandName: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  description: string;
  shortDescription: string;
  highlights: string[];
  specifications: Record<string, Record<string, string>>;
  price: number; // Current selling price in INR
  mrp: number; // Maximum Retail Price
  discountPercentage: number;
  rating: number; // e.g. 4.4
  ratingCount: number; // e.g. 48,290
  reviewCount: number; // e.g. 3,450
  images: string[];
  thumbnail: string;
  stock: number;
  inStock: boolean;
  isAssured: boolean; // Flipkart Plus / Assured badge
  isFreeDelivery: boolean;
  estimatedDeliveryDays: number;
  seller: {
    id: string;
    name: string;
    rating: number;
  };
  tags?: string[]; // e.g., ["Bestseller", "Top Deal", "Trending"]
  variants?: {
    color?: string[];
    storage?: string[];
    size?: string[];
  };
  returnPolicy?: string;
  returnWindowDays?: number;
  isReturnable?: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  icon?: string;
  parentId?: string | null;
  itemCount?: number;
  isFeatured: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
  isPopular: boolean;
}

export interface Address {
  id: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  pincode: string;
  locality: string;
  street: string;
  city: string;
  state: string;
  landmark?: string;
  type: 'home' | 'work';
  isDefault: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  avatar?: string;
  addresses: Address[];
  defaultAddressId?: string;
  createdAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  selectedVariants?: Record<string, string>;
  addedAt: string;
}

export interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
  addedAt: string;
}

export type PaymentMethod = 'COD' | 'UPI' | 'CARD' | 'NET_BANKING';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
// Part 10: full order lifecycle (kept compatible with existing UI values)
export type OrderStatus =
  | 'PENDING'
  | 'PLACED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'REFUNDED';

export interface OrderStatusHistoryEntry {
  status: OrderStatus | string;
  note?: string;
  actorRole?: string;
  actorId?: string;
  timestamp: string;
}

export interface OrderShipment {
  subOrderId?: string;
  sellerId?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  status?: string;
  shippedAt?: string;
  outForDeliveryAt?: string;
  deliveredAt?: string;
  estimatedDelivery?: string;
  lastLocation?: string;
  history?: OrderStatusHistoryEntry[];
}

export interface OrderItem {
  id?: string;
  productId: string;
  title: string;
  thumbnail: string;
  price: number;
  mrp: number;
  quantity: number;
  selectedVariants?: Record<string, string>;
}

export interface OrderPricing {
  totalMrp: number;
  discount: number;
  couponDiscount: number;
  deliveryCharges: number;
  totalAmount: number;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  description: string;
  validTill: string;
  isActive: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  pricing: OrderPricing;
  appliedCoupon?: Coupon;
  appliedCouponId?: string;
  placedAt: string;
  estimatedDelivery: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  statusHistory?: OrderStatusHistoryEntry[];
  shipments?: OrderShipment[];
  tracking?: { shipments?: OrderShipment[]; statusHistory?: OrderStatusHistoryEntry[] };
  returns?: any[];
  invoice?: { invoiceNumber: string; issuedAt: string; downloadable?: boolean };
}

export interface Review {
  id: string;
  productId: string;
  productName?: string;
  orderId?: string;
  userId: string;
  userName: string;
  userLocation: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  helpfulCount: number;
  images?: string[];
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  discountText?: string;
  badgeText?: string;
  ctaText?: string;
  bgColor?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  targetUrl: string;
  categorySlug?: string;
  position: 'hero' | 'promo' | 'slider' | 'strip';
  isActive: boolean;
}

/**
 * Filter and query interfaces for future backend readiness
 */
export interface ProductFilterParams {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  minDiscount?: number;
  inStock?: boolean;
  isAssured?: boolean;
  search?: string;
  sortBy?: 'popularity' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'discount';
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Seller Dashboard Types
 * Multi-vendor seller foundation (Flipkart Seller Hub inspired)
 */

export type SellerRole = 'SELLER';
export type SellerVerificationStatus =
  | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED'
  | 'Draft' | 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Suspended';
export type SellerStoreStatus = 'ACTIVE' | 'INACTIVE' | 'VACATION';
export type NotificationType =
  | 'NEW_ORDER'
  | 'LOW_STOCK'
  | 'PAYMENT_UPDATE'
  | 'PAYOUT_INITIATED'
  | 'RETURN_REQUEST'
  | 'PRODUCT_APPROVAL'
  | 'REVIEW'
  | 'STORE_UPDATE';
export type NotificationStatus = 'UNREAD' | 'READ' | 'PROCESSING';
export type OrderPaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type SellerOrderStatus =
  | 'PENDING'
  | 'PLACED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'REFUNDED';

export interface SellerAddress {
  id: string;
  name: string;
  phone: string;
  pincode: string;
  locality: string;
  street: string;
  city: string;
  state: string;
  landmark?: string;
  type: 'home' | 'work' | 'business';
  isDefault: boolean;
}

export interface Seller {
  id: string;
  sellerId: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: SellerRole;
  avatar?: string;
  storeName: string;
  storeSlug: string;
  storeDescription?: string;
  storeLogo?: string;
  storeBanner?: string;
  businessCategory?: string;
  businessType?: string;
  businessEmail?: string;
  businessPhone?: string;
  address?: SellerAddress;
  panNumber?: string;
  gstNumber?: string;
  businessRegistration?: string;
  bankAccountHolder?: string;
  bankName?: string;
  accountNumber?: string; // masked only if present
  ifscCode?: string;
  verificationStatus: SellerVerificationStatus;
  applicationStatus?: SellerVerificationStatus;
  storeStatus: SellerStoreStatus;
  rating: number;
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  availableBalance: number; // INR
  totalEarnings: number; // INR
  pendingOrders: number;
  cancelledOrders: number;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SellerStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrders: number;
  cancelledOrders: number;
  availableBalance: number;
  totalEarnings: number;
}

export interface SellerOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerAvatar?: string;
  productName: string;
  productImage?: string;
  orderDate: string;
  quantity: number;
  totalAmount: number;
  paymentStatus: OrderPaymentStatus;
  orderStatus: SellerOrderStatus;
}

export interface TopProduct {
  id: string;
  name: string;
  image: string;
  unitsSold: number;
  revenue: number;
  stock: number;
  inStock: boolean;
}

export interface LowStockProduct {
  id: string;
  name: string;
  image: string;
  stock: number;
  threshold: number;
}

export interface SalesDataPoint {
  name: string;
  sales: number;
  orders: number;
  revenue: number;
}

export interface RevenueDataPoint {
  name: string;
  revenue: number;
}

export interface Notification {
  id: string;
  type: NotificationType | string;
  title: string;
  message: string;
  time: string;
  status: NotificationStatus;
  readAt?: string;
  link?: string;
  category?: NotificationCategory | string;
  metadata?: Record<string, unknown>;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  updatedAt: string;
}

export interface SellerRegisterFormStep1 {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
}

export interface SellerRegisterFormStep2 {
  businessName: string;
  businessType: string;
  businessCategory: string;
  businessDescription: string;
  businessEmail: string;
  businessPhone: string;
}

export interface SellerRegisterFormStep3 {
  houseNumber: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface SellerRegisterFormStep4 {
  panNumber: string;
  gstNumber: string;
  businessRegistration: string;
  identityFile?: File;
  identityPreview?: string | null;
  panPreview?: string | null;
  gstPreview?: string | null;
  bankProofPreview?: string | null;
  businessRegistrationProofPreview?: string | null;
  fssaiPreview?: string | null;
  trademarkPreview?: string | null;
}

export interface SellerRegisterFormStep5 {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
}

export interface SellerAuthResult {
  seller: Seller;
  token: string;
}

export interface SellerRegisterPayload {
  step1: SellerRegisterFormStep1;
  step2: SellerRegisterFormStep2;
  step3: SellerRegisterFormStep3;
  step4: SellerRegisterFormStep4;
  step5: SellerRegisterFormStep5;
}

/**
 * Seller Product, Inventory, Order, Customer, Review and Return Types
 * Multi-vendor seller management (Part 2)
 */

export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'OUT_OF_STOCK' | 'REJECTED'; // legacy/compat
export type ProductApprovalStatus = 'Draft' | 'Pending Approval' | 'Under Review' | 'Approved' | 'Rejected' | 'Changes Requested';
export type ProductPublicationStatus = 'Active' | 'Inactive';
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
export type ReturnStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'COMPLETED' | 'REFUNDED' | 'REPLACED';
export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type CustomerOrderStatus = 'ALL' | 'NEW' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';

export interface ProductVariant {
  id: string;
  sku: string;
  size?: string;
  color?: string;
  price: number;
  mrp: number;
  stock: number;
  weight?: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string;
  isPrimary: boolean;
}

export interface Specification {
  key: string;
  value: string;
}

export interface ProductApprovalHistoryEntry {
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
  createdAt?: string;
}

export interface SellerProduct {
  id: string;
  sellerId: string;
  name: string;
  slug: string;
  sku: string;
  barcode?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  description: string;
  shortDescription?: string;
  highlights?: string[];
  price: number; // selling price
  mrp: number; // original price
  discountPercentage: number;
  taxPercentage: number;
  stock: number;
  lowStockThreshold: number;
  status: ProductStatus; // legacy/compat
  approvalStatus?: ProductApprovalStatus;
  productStatus?: ProductPublicationStatus;
  rejectionReason?: string;
  adminComment?: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  changesRequestedAt?: string;
  rejectedAt?: string;
  approvalHistory?: ProductApprovalHistoryEntry[];
  images: ProductImage[];
  variants: ProductVariant[];
  specifications: Specification[];
  seoTitle?: string;
  seoDescription?: string;
  unitsSold: number;
  totalRevenue: number;
  rating: number;
  reviewCount: number;
  isAssured: boolean;
  isFreeDelivery: boolean;
  estimatedDeliveryDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  brand?: string;
  status?: ProductStatus;
  stock?: StockStatus;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedProducts {
  data: SellerProduct[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  image?: string;
  category: string;
  stock: number;
  lowStockThreshold: number;
  status: StockStatus;
  reservedStock: number;
  availableStock: number;
  lastUpdated: string;
}

export interface StockHistoryEntry {
  id: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  reason: string;
  referenceId?: string;
  createdAt: string;
}

export interface SellerCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalOrders: number;
  totalSpending: number;
  lastOrderDate: string;
  location?: string;
  avatar?: string;
}

export interface SellerReview {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  sellerReply?: string;
  replyAt?: string;
  createdAt: string;
}

export interface SellerReturn {
  id: string;
  returnNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  reason: string;
  status: ReturnStatus;
  requestDate: string;
  resolvedAt?: string;
  refundAmount: number;
  notes?: string;
}

export interface OrderTimelineEntry {
  id: string;
  status: SellerOrderStatus;
  title: string;
  description: string;
  date: string;
  isCompleted: boolean;
}

export interface SellerOrderDetail {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: Address;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  paymentStatus: OrderPaymentStatus;
  orderStatus: SellerOrderStatus;
  pricing: OrderPricing;
  placedAt: string;
  estimatedDelivery: string;
  deliveredAt?: string;
  timeline: OrderTimelineEntry[];
}

/**
 * Seller Earnings, Payments, Transactions, Coupons, Analytics Types
 * Multi-vendor seller financial management (Part 3)
 */

export type PaymentTransactionStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type PayoutStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'FAILED' | 'PAID' | 'CANCELLED';
export type CouponStatus = 'ACTIVE' | 'EXPIRED' | 'DISABLED' | 'DRAFT';
export type ReportType = 'SALES' | 'ORDERS' | 'INVENTORY' | 'EARNINGS' | 'PAYMENTS';
export type ReportStatus = 'PENDING' | 'READY' | 'FAILED';
export type NotificationCategory = 'ORDER' | 'PAYMENT' | 'INVENTORY' | 'PRODUCT' | 'RETURN' | 'REVIEW' | 'STORE' | 'ACCOUNT' | 'SHIPMENT' | 'VENDOR' | 'PAYOUT' | 'ADMIN' | 'SYSTEM';

export interface EarningsSummary {
  grossSales: number;
  grossRevenue?: number;
  totalRevenue: number;
  platformCommission: number;
  commissionDeductions?: number;
  shippingCharges: number;
  refundDeductions: number;
  netEarnings: number;
  pendingPayments: number;
  pendingEarnings?: number;
  availableBalance: number;
  completedPayouts?: number;
  totalPaid: number;
}

export interface EarningsDataPoint {
  date: string;
  grossSales: number;
  commission: number;
  netEarnings: number;
  orders: number;
}

export interface PaymentTransaction {
  id: string;
  transactionId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  paymentDate: string;
  grossAmount: number;
  commission: number;
  netAmount: number;
  paymentMethod: PaymentMethod;
  status: PaymentTransactionStatus;
}

export interface Payout {
  id: string;
  payoutNumber?: string;
  amount: number;
  amountPaise?: number;
  date: string;
  requestedAt?: string;
  reviewedAt?: string;
  completedAt?: string;
  status: PayoutStatus;
  bankAccount: string; // masked
  bankName: string;
  accountHolderName?: string;
  referenceId?: string;
  transactionReference?: string;
  provider?: string;
  reconciliationStatus?: 'NOT_REQUIRED' | 'PENDING' | 'CONFIRMED' | 'FAILED';
  requestNote?: string;
  adminNote?: string;
  rejectionReason?: string;
  failureReason?: string;
}

export interface SellerCoupon {
  id: string;
  sellerId: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  startDate: string;
  expiryDate: string;
  usageLimit: number;
  usedCount: number;
  status: CouponStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsDataPoint {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
  conversionRate: number;
}

export interface CategorySalesData {
  category: string;
  revenue: number;
  orders: number;
  unitsSold: number;
  sharePercentage: number;
}

export interface ProductPerformanceData {
  productId: string;
  productName: string;
  productImage?: string;
  revenue: number;
  unitsSold: number;
  orders: number;
  conversionRate: number;
  rating: number;
}

export interface SellerPerformance {
  storeRating: number;
  averageCustomerRating: number;
  orderCancellationRate: number;
  returnRate: number;
  onTimeDispatchRate: number;
  productApprovalRate: number;
  customerSatisfaction: number;
  totalOrders: number;
  totalDeliveredOrders: number;
  totalCancelledOrders: number;
  totalReturnedOrders: number;
}

export interface ReportExport {
  id: string;
  type: ReportType;
  status: ReportStatus;
  generatedAt: string;
  downloadUrl?: string;
  recordCount: number;
}

export interface EnhancedNotification extends Notification {
  category: NotificationCategory;
}

export interface SellerSupportTicket extends SupportTicket {
  sellerId: string;
  ticketNumber: string;
  customerName: string;
  orderId?: string;
  orderNumber?: string;
}


