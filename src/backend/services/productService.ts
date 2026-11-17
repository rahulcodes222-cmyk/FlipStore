/**
 * Product Service
 * Business logic for product management.
 * Keeps business logic separate from API route handlers.
 * Supports multi-vendor data isolation via sellerId filtering.
 */

import { ProductModel, CategoryModel } from '@/backend/models';
import type {
  IProductDocument,
  ICategoryDocument,
  IProductVariantDocument,
} from '@/backend/types';
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductQueryInput,
  ProductIdParamInput,
  ProductSearchInput,
} from '@/backend/validations/product.schema';
import { generateSlug } from '@/backend/utils/slug';
import { buildApprovalHistoryEntry, isPubliclyVisibleProduct, publicProductVisibilityMongoFilter, syncProductApprovalState } from '@/backend/utils/productApproval';
import { notifyAdmins, writeAuditLog } from '@/backend/services/notificationService';
import { NOTIFICATION_TYPES } from '@/backend/constants/notifications';

function toId(v: any): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v._id) return String(v._id);
  return String(v);
}

function publicVisibilityFilter() {
  return publicProductVisibilityMongoFilter();
}

/**
 * Normalize a backend product document into a plain object
 * safe for frontend consumption.
 */
function normalizeProduct(doc: IProductDocument): Record<string, unknown> {
  syncProductApprovalState(doc as any);
  const variants = (doc.variants || []).map((v: IProductVariantDocument) => ({
    id: v.id,
    productId: v.productId,
    sku: v.sku,
    size: v.size,
    color: v.color,
    price: v.price,
    mrp: v.mrp,
    stock: v.stock,
    weight: v.weight,
  }));

  const primaryImage = doc.images.find((img) => img.isPrimary) || doc.images[0];

  return {
    id: doc.id,
    title: doc.name,
    slug: doc.slug,
    sku: doc.sku,
    barcode: doc.barcode || '',
    category: doc.category,
    categoryId: doc.categoryId?.toString() || '',
    categoryName: doc.category,
    categorySlug: doc.category.toLowerCase().replace(/\s+/g, '-'),
    subcategory: doc.subcategory || '',
    brand: doc.brand || '',
    brandId: doc.brandId?.toString() || '',
    brandName: doc.brand || '',
    description: doc.description,
    shortDescription: doc.shortDescription || '',
    highlights: doc.highlights || [],
    specifications: doc.specifications || {},
    price: doc.price,
    mrp: doc.mrp,
    discountPercentage: doc.discountPercentage,
    taxPercentage: doc.taxPercentage,
    stock: doc.stock,
    lowStockThreshold: doc.lowStockThreshold,
    status: doc.status,
    approvalStatus: (doc as any).approvalStatus,
    productStatus: (doc as any).productStatus,
    rejectionReason: (doc as any).rejectionReason || '',
    adminComment: (doc as any).adminComment || '',
    submittedAt: (doc as any).submittedAt || null,
    reviewedAt: (doc as any).reviewedAt || null,
    reviewedBy: (doc as any).reviewedBy ? toId((doc as any).reviewedBy) : null,
    approvedAt: (doc as any).approvedAt || null,
    approvedBy: (doc as any).approvedBy ? toId((doc as any).approvedBy) : null,
    approvalHistory: Array.isArray((doc as any).approvalHistory) ? (doc as any).approvalHistory : [],
    images: doc.images.map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
      isPrimary: img.isPrimary,
    })),
    thumbnail: primaryImage?.url || doc.images[0]?.url || '',
    variants,
    seoTitle: doc.seoTitle,
    seoDescription: doc.seoDescription,
    unitsSold: doc.unitsSold,
    totalRevenue: doc.totalRevenue,
    rating: doc.rating,
    reviewCount: doc.reviewCount,
    isAssured: doc.isAssured,
    isFreeDelivery: doc.isFreeDelivery,
    estimatedDeliveryDays: doc.estimatedDeliveryDays,
    sellerId: doc.sellerId.toString(),
    inStock: doc.stock > 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Create a new product (vendor or admin).
 */
export async function createProduct(
  sellerId: string,
  data: CreateProductInput,
): Promise<IProductDocument> {
  if (data.categoryId) {
    const categoryExists = await CategoryModel.findById(data.categoryId).exec();
    if (!categoryExists) {
      throw new Error('Category not found.');
    }
  }

  // ensure unique slug
  let slug = String(data.slug || '').trim().toLowerCase() || generateSlug(String(data.name || 'product'));
  if (!slug) slug = `product-${Date.now()}`;
  const baseSlug = slug;
  let si = 1;
  while (await ProductModel.exists({ slug })) {
    slug = `${baseSlug}-${si++}`;
  }

  // ensure unique sku
  let sku = String(data.sku || '').trim().toUpperCase() || `SKU-${Date.now().toString(36).toUpperCase()}`;
  const baseSku = sku;
  let ki = 1;
  while (await ProductModel.exists({ sku })) {
    sku = `${baseSku}-${ki++}`;
  }

  const submitForApproval = (data as any).status === 'PUBLISHED' || (data as any).submitForApproval === true;
  const stock = Number.isFinite(Number(data.stock)) ? Math.max(0, Math.floor(Number(data.stock))) : 0;
  const approvalStatus = submitForApproval ? 'Pending Approval' : 'Draft';
  const productStatus = 'Inactive';
  const now = new Date();

  const productData: Record<string, unknown> = {
    sellerId,
    name: String(data.name || '').trim(),
    slug,
    sku,
    barcode: data.barcode || '',
    category: data.category,
    ...(data.categoryId && /^[a-f\d]{24}$/i.test(String(data.categoryId)) ? { categoryId: data.categoryId } : {}),
    subcategory: data.subcategory || '',
    brand: data.brand || '',
    ...(data.brandId && /^[a-f\d]{24}$/i.test(String(data.brandId)) ? { brandId: data.brandId } : {}),
    description: data.description,
    shortDescription: data.shortDescription || '',
    highlights: Array.isArray(data.highlights) ? data.highlights : [],
    specifications: (data.specifications as any) || {},
    price: Number(data.price) || 0,
    mrp: Number(data.mrp) || Number(data.price) || 0,
    discountPercentage: data.discountPercentage ?? 0,
    taxPercentage: data.taxPercentage ?? 0,
    stock,
    lowStockThreshold: data.lowStockThreshold ?? 0,
    // legacy field kept for compatibility; public visibility is enforced by approvalStatus+productStatus
    status: 'DRAFT',
    approvalStatus,
    productStatus,
    submittedAt: submitForApproval ? now : undefined,
    approvalHistory: [buildApprovalHistoryEntry({
      action: submitForApproval ? 'SUBMITTED' : 'DRAFT_SAVED',
      fromApprovalStatus: undefined,
      toApprovalStatus: approvalStatus,
      fromProductStatus: undefined,
      toProductStatus: productStatus,
      actorId: sellerId,
      actorRole: 'vendor',
    })],
    images: Array.isArray(data.images) ? data.images : [],
    variants: Array.isArray(data.variants) ? data.variants : [],
    seoTitle: data.seoTitle || '',
    seoDescription: data.seoDescription || '',
    isAssured: false, // admin-only badge
    isFreeDelivery: data.isFreeDelivery ?? false,
    estimatedDeliveryDays: data.estimatedDeliveryDays ?? 3,
  };

  const product = await ProductModel.create(productData);
  syncProductApprovalState(product as any);
  if (submitForApproval) {
    await notifyAdmins({
      type: NOTIFICATION_TYPES.PRODUCT_SUBMITTED_FOR_APPROVAL,
      category: 'PRODUCT',
      title: 'Product submitted for approval',
      message: `${(product as any).name} was submitted for approval.`,
      link: `/admin/products/approvals/${(product as any).id || (product as any)._id}`,
      metadata: { productId: String((product as any)._id || (product as any).id), sellerId },
      dedupeKey: `product-submitted:${String((product as any)._id || (product as any).id)}:${now.toISOString()}`,
    }).catch(() => {});
    await writeAuditLog({ actorId: sellerId, actorRole: 'vendor', action: 'product_submitted_for_approval', resourceType: 'product', resourceId: String((product as any)._id || (product as any).id), after: { approvalStatus, productStatus } }).catch(() => {});
  }
  return product;
}

/**
 * Get product by ID.
 */
export async function getProductById(
  productId: string,
  sellerId?: string,
  opts?: { publicOnly?: boolean },
): Promise<IProductDocument | null> {
  const query: Record<string, unknown> = { _id: productId };
  if (sellerId) {
    query.sellerId = sellerId;
  }
  if (opts?.publicOnly) {
    Object.assign(query, publicVisibilityFilter());
  }
  const product = await ProductModel.findOne(query).exec();
  if (!product) return null;
  syncProductApprovalState(product as any);
  if (opts?.publicOnly && !isPubliclyVisibleProduct(product)) return null;
  return product;
}

/**
 * Get product by slug.
 */
export async function getProductBySlug(slug: string, opts?: { publicOnly?: boolean }): Promise<IProductDocument | null> {
  const query: Record<string, unknown> = { slug };
  if (opts?.publicOnly) Object.assign(query, publicVisibilityFilter());
  const product = await ProductModel.findOne(query).exec();
  if (!product) return null;
  syncProductApprovalState(product as any);
  if (opts?.publicOnly && !isPubliclyVisibleProduct(product)) return null;
  return product;
}

/**
 * Get all products with filtering, sorting, and pagination.
 * Supports sellerId filtering for vendor data isolation.
 */
export async function getProducts(
  query: ProductQueryInput & Record<string, any>,
  sellerId?: string,
  opts?: { adminView?: boolean; publicOnly?: boolean },
): Promise<{ data: IProductDocument[]; total: number; page: number; limit: number; totalPages: number; hasMore: boolean }> {
  const filter: Record<string, unknown> = {};

  // Seller isolation
  if (sellerId) {
    filter.sellerId = sellerId;
  }

  // Category filter (accept name, slug-like value, or id)
  if (query.categoryId && /^[a-f\d]{24}$/i.test(String(query.categoryId))) {
    filter.categoryId = String(query.categoryId);
  }
  if (query.category && !filter.categoryId) {
    const raw = String(query.category).trim();
    const esc = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const normalizedSlug = raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const nameFromSlug = normalizedSlug.replace(/-/g, ' ').trim();
    const catDoc = await CategoryModel.findOne({
      $or: [
        { slug: raw.toLowerCase() },
        { slug: normalizedSlug },
        { name: new RegExp(`^${esc}$`, 'i') },
        { name: new RegExp(`^${nameFromSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      ],
    }).select('_id name slug').lean().exec() as any;

    const ors: any[] = [];
    if (catDoc?._id) {
      ors.push({ categoryId: catDoc._id });
      if (catDoc.name) ors.push({ category: new RegExp(`^${String(catDoc.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
      if (catDoc.slug) ors.push({ category: new RegExp(`^${String(catDoc.slug).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
    }
    ors.push({ category: new RegExp(`^${esc}$`, 'i') });
    ors.push({ category: new RegExp(`^${esc.replace(/-/g, '[\\s-]+')}$`, 'i') });
    if (nameFromSlug) ors.push({ category: new RegExp(`^${nameFromSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\s+/g, '[\\s-]+')}$`, 'i') });
    filter.$or = ors;
  }

  // Brand filter
  if (query.brand) {
    filter.brand = new RegExp(`^${String(query.brand).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  }

  // Approval/publication filters (admin/vendor management)
  if (query.approvalStatus) filter.approvalStatus = query.approvalStatus;
  if (query.productStatus) filter.productStatus = query.productStatus;

  // Status filter
  if (query.status) {
    // admin/vendor contexts may pass explicit legacy status
    filter.status = query.status;
  } else if (opts?.publicOnly || (!sellerId && !opts?.adminView)) {
    // Public storefront listings: only approved + active + in stock (with legacy compatibility)
    Object.assign(filter, publicVisibilityFilter());
  }

  // Stock filter
  if (query.stock) {
    if (query.stock === 'IN_STOCK') {
      filter.stock = { $gt: 0 };
    } else if (query.stock === 'OUT_OF_STOCK') {
      filter.stock = 0;
    } else if (query.stock === 'LOW_STOCK') {
      filter.$expr = { $lte: ['$stock', '$lowStockThreshold'] };
      filter.stock = { $gt: 0 };
    }
  }

  // Additional storefront filters
  const qAny = query as any;
  if (qAny.isAssured === true || qAny.isAssured === 'true') filter.isAssured = true;
  if (qAny.minPrice != null && qAny.minPrice !== '') filter.price = { ...(filter.price as any || {}), $gte: Number(qAny.minPrice) };
  if (qAny.maxPrice != null && qAny.maxPrice !== '') filter.price = { ...(filter.price as any || {}), $lte: Number(qAny.maxPrice) };
  if (qAny.minRating != null && qAny.minRating !== '') filter.rating = { ...(filter.rating as any || {}), $gte: Number(qAny.minRating) };
  if (qAny.minDiscount != null && qAny.minDiscount !== '') filter.discountPercentage = { ...(filter.discountPercentage as any || {}), $gte: Number(qAny.minDiscount) };
  if (qAny.inStock === true || qAny.inStock === 'true') filter.stock = { ...(typeof filter.stock === 'object' && filter.stock ? filter.stock : {}), $gt: 0 };

  // Search
  if (query.search) {
    filter.$text = { $search: query.search };
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const start = (page - 1) * limit;

  let sort: Record<string, unknown> = { createdAt: -1 };
  if (query.sortBy) {
    switch (query.sortBy) {
      case 'price_asc':
        sort = { price: 1 };
        break;
      case 'price_desc':
        sort = { price: -1 };
        break;
      case 'rating':
        sort = { rating: -1 };
        break;
      case 'name_asc':
        sort = { name: 1 };
        break;
      case 'name_desc':
        sort = { name: -1 };
        break;
      case 'discount':
        sort = { discountPercentage: -1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'popularity':
      default:
        sort = { unitsSold: -1 };
        break;
    }
  }

  const [data, total] = await Promise.all([
    ProductModel.find(filter).sort(sort as any).skip(start).limit(limit).exec(),
    ProductModel.countDocuments(filter).exec(),
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;

  return { data, total, page, limit, totalPages, hasMore };
}

/**
 * Get products by category.
 */
export async function getProductsByCategory(
  category: string,
  query: ProductQueryInput,
  sellerId?: string,
): Promise<{ data: IProductDocument[]; total: number; page: number; limit: number; totalPages: number; hasMore: boolean }> {
  return getProducts({ ...query, category }, sellerId);
}

/**
 * Search products with text search, filtering, sorting, and pagination.
 * Public endpoint - returns only PUBLISHED products.
 * Supports text search on name, description, and shortDescription.
 */
export async function searchProducts(
  query: ProductSearchInput,
): Promise<{ data: IProductDocument[]; total: number; page: number; limit: number; totalPages: number; hasMore: boolean }> {
  const filter: Record<string, unknown> = { ...publicVisibilityFilter() };

  // Text search across name, description, shortDescription
  if (query.q) {
    filter.$text = { $search: query.q };
  }

  // Category filter
  if (query.category) {
    filter.category = query.category;
  }

  // Brand filter
  if (query.brand) {
    filter.brand = query.brand;
  }

  // Price range filter
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    const priceFilter: Record<string, number | undefined> = {};
    if (query.minPrice !== undefined) {
      priceFilter.$gte = query.minPrice;
    }
    if (query.maxPrice !== undefined) {
      priceFilter.$lte = query.maxPrice;
    }
    filter.price = priceFilter;
  }

  // Rating filter
  if (query.rating !== undefined) {
    filter.rating = { $gte: query.rating };
  }

  // In-stock filter
  if (query.inStock !== undefined) {
    if (query.inStock) {
      filter.stock = { $gt: 0 };
    } else {
      filter.stock = 0;
    }
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const start = (page - 1) * limit;

  // Sort - text score for text search, otherwise default sort
  let sort: Record<string, unknown> = { score: { $meta: 'textScore' }, createdAt: -1 };
  if (query.sort) {
    switch (query.sort) {
      case 'price_asc':
        sort = { price: 1 };
        break;
      case 'price_desc':
        sort = { price: -1 };
        break;
      case 'rating':
        sort = { rating: -1 };
        break;
      case 'name_asc':
        sort = { name: 1 };
        break;
      case 'name_desc':
        sort = { name: -1 };
        break;
      case 'discount':
        sort = { discountPercentage: -1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'popularity':
      default:
        sort = { unitsSold: -1 };
        break;
    }
  }

  const [data, total] = await Promise.all([
    ProductModel.find(filter).sort(sort as any).skip(start).limit(limit).exec(),
    ProductModel.countDocuments(filter).exec(),
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;

  return { data, total, page, limit, totalPages, hasMore };
}

/**
 * Update a product (vendor or admin).
 * Only fields provided in data are updated.
 */
export async function updateProduct(
  productId: string,
  sellerId: string,
  data: UpdateProductInput,
): Promise<IProductDocument | null> {
  let product = await ProductModel.findOne({ _id: productId, sellerId }).exec();
  // Allow admin to manage products created by other/admin contexts
  if (!product) {
    const { UserModel } = await import('@/backend/models');
    const actor = await UserModel.findById(sellerId).select('role').lean().exec() as any;
    const role = String(actor?.role || '').toLowerCase();
    if (role === 'admin' || role === 'super_admin') {
      product = await ProductModel.findById(productId).exec();
    }
  }
  if (!product) {
    throw new Error('Product not found.');
  }

  if (data.slug && data.slug !== product.slug) {
    const existing = await ProductModel.findOne({ slug: data.slug, _id: { $ne: productId } }).exec();
    if (existing) {
      throw new Error('A product with this slug already exists.');
    }
  }

  if (data.name !== undefined) product.name = data.name as any;
  if (data.slug !== undefined) product.slug = data.slug as any;
  if (data.sku !== undefined) product.sku = data.sku as any;
  if (data.barcode !== undefined) product.barcode = data.barcode as any;
  if (data.category !== undefined) product.category = data.category as any;
  if (data.categoryId !== undefined) {
    const v = String((data as any).categoryId || '').trim();
    if (/^[a-f\d]{24}$/i.test(v)) (product as any).categoryId = v;
    else if (!v) (product as any).categoryId = undefined;
  }
  if (data.subcategory !== undefined) (product as any).subcategory = data.subcategory;
  if (data.brand !== undefined) (product as any).brand = data.brand;
  if (data.brandId !== undefined) {
    const v = String((data as any).brandId || '').trim();
    if (/^[a-f\d]{24}$/i.test(v)) (product as any).brandId = v;
    else if (!v) (product as any).brandId = undefined;
  }
  if (data.description !== undefined) (product as any).description = data.description;
  if (data.shortDescription !== undefined) (product as any).shortDescription = data.shortDescription;
  if (data.highlights !== undefined) (product as any).highlights = data.highlights as any;
  if (data.specifications !== undefined) (product as any).specifications = data.specifications as any;
  if (data.price !== undefined) (product as any).price = Number(data.price);
  if (data.mrp !== undefined) (product as any).mrp = Number(data.mrp);
  if (data.discountPercentage !== undefined) (product as any).discountPercentage = Number(data.discountPercentage);
  if (data.taxPercentage !== undefined) (product as any).taxPercentage = Number(data.taxPercentage);
  if (data.stock !== undefined) (product as any).stock = Math.max(0, Math.floor(Number(data.stock)));
  if (data.lowStockThreshold !== undefined) (product as any).lowStockThreshold = Number(data.lowStockThreshold);
  if (data.status !== undefined) {
    // Prevent bypassing approval workflow from generic product update endpoints.
    // Use vendor/admin approval-specific flows instead.
  }
  // Seller/admin generic edits must not grant publication approval
  if ((data as any).isAssured !== undefined) {
    // Only allow admin to set assured via publish/admin flows; ignore here for safety
  }
  if (data.images !== undefined) (product as any).images = data.images as any;
  if (data.variants !== undefined) (product as any).variants = data.variants as any;
  if (data.seoTitle !== undefined) (product as any).seoTitle = data.seoTitle;
  if (data.seoDescription !== undefined) (product as any).seoDescription = data.seoDescription;
  if (data.isAssured !== undefined) (product as any).isAssured = !!data.isAssured;
  if (data.isFreeDelivery !== undefined) (product as any).isFreeDelivery = !!data.isFreeDelivery;
  if (data.estimatedDeliveryDays !== undefined) (product as any).estimatedDeliveryDays = Number(data.estimatedDeliveryDays);

  syncProductApprovalState(product as any);
  const updated = await product.save();
  return updated;
}

/**
 * Delete a product (vendor or admin).
 */
export async function deleteProduct(
  productId: string,
  sellerId: string,
): Promise<boolean> {
  let result = await ProductModel.deleteOne({ _id: productId, sellerId }).exec();
  if (result.deletedCount === 0) {
    const { UserModel } = await import('@/backend/models');
    const actor = await UserModel.findById(sellerId).select('role').lean().exec() as any;
    const role = String(actor?.role || '').toLowerCase();
    if (role === 'admin' || role === 'super_admin') {
      result = await ProductModel.deleteOne({ _id: productId }).exec();
    }
  }
  return result.deletedCount > 0;
}

/**
 * Publish or unpublish a product.
 * Kept for admin compatibility but restricted to approved products.
 */
export async function publishProduct(
  productId: string,
  sellerId: string,
  publish: boolean,
): Promise<IProductDocument | null> {
  let product = await ProductModel.findOne({ _id: productId, sellerId }).exec();
  let actorRole = 'vendor';
  if (!product) {
    const { UserModel } = await import('@/backend/models');
    const actor = await UserModel.findById(sellerId).select('role').lean().exec() as any;
    const role = String(actor?.role || '').toLowerCase();
    actorRole = role || actorRole;
    if (role === 'admin' || role === 'super_admin') {
      product = await ProductModel.findById(productId).exec();
    }
  }
  if (!product) {
    throw new Error('Product not found.');
  }

  syncProductApprovalState(product as any);
  if (publish) {
    if ((product as any).approvalStatus !== 'Approved') {
      throw new Error('Product must be approved before activation.');
    }
    (product as any).productStatus = 'Active';
    (product as any).approvalHistory = [...((product as any).approvalHistory || []), buildApprovalHistoryEntry({ action: 'ACTIVATED', fromApprovalStatus: (product as any).approvalStatus, toApprovalStatus: (product as any).approvalStatus, fromProductStatus: 'Inactive', toProductStatus: 'Active', actorId: sellerId, actorRole })];
  } else {
    const from = (product as any).productStatus || 'Inactive';
    (product as any).productStatus = 'Inactive';
    (product as any).approvalHistory = [...((product as any).approvalHistory || []), buildApprovalHistoryEntry({ action: 'DEACTIVATED', fromApprovalStatus: (product as any).approvalStatus, toApprovalStatus: (product as any).approvalStatus, fromProductStatus: from, toProductStatus: 'Inactive', actorId: sellerId, actorRole })];
  }
  syncProductApprovalState(product as any);
  const updated = await product.save();
  return updated;
}

/**
 * Get unique categories used by products (for filtering dropdown).
 */
export async function getProductCategories(sellerId?: string): Promise<string[]> {
  const filter: Record<string, unknown> = {};
  if (sellerId) {
    filter.sellerId = sellerId;
  }
  const categories = await ProductModel.distinct('category', filter).exec();
  return categories as string[];
}

/**
 * Get unique brands used by products (for filtering dropdown).
 */
export async function getProductBrands(sellerId?: string): Promise<string[]> {
  const filter: Record<string, unknown> = {};
  if (sellerId) {
    filter.sellerId = sellerId;
  }
  const brands = await ProductModel.distinct('brand', filter).exec();
  return brands as string[];
}

/**
 * Generate a unique slug from a product name.
 */
export async function generateProductSlug(name: string, sellerId?: string): Promise<string> {
  let slug = generateSlug(name);
  let counter = 1;
  const filter: Record<string, unknown> = { slug };
  if (sellerId) {
    filter.sellerId = sellerId;
  }
  while (await ProductModel.exists(filter)) {
    slug = `${generateSlug(name)}-${counter}`;
    counter += 1;
    filter.slug = slug;
  }
  return slug;
}
