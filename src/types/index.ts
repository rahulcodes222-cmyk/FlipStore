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
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';
export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
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
  placedAt: string;
  estimatedDelivery: string;
  deliveredAt?: string;
}

export interface Review {
  id: string;
  productId: string;
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
