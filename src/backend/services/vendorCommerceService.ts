/**
 * Vendor Commerce Service (Part 12)
 * Vendor-scoped product, inventory, order, customer operations.
 * All seller identity is derived from authenticated vendor session.
 */

import {
  ProductModel,
  InventoryModel,
  SubOrderModel,
  OrderModel,
  ShipmentModel,
  ReturnRequestModel,
  AddressModel,
} from '@/backend/models';
import InventoryMovementModel from '@/backend/models/InventoryMovement';
import { generateSlug } from '@/backend/utils/slug';
import type { VendorCreateProductInput, VendorUpdateProductInput } from '@/backend/validations/vendorCommerce.schema';

function toId(v: any): string {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v._id) return String(v._id);
  return String(v);
}

function computeDiscount(price: number, mrp: number): number {
  if (!mrp || mrp <= 0) return 0;
  return Math.max(0, Math.round(((mrp - price) / mrp) * 100));
}

function normalizeImages(images: Array<{ id?: string; url: string; alt?: string; isPrimary?: boolean }>, name: string) {
  const list = (images || []).filter((i) => i?.url).map((img, idx) => ({
    id: img.id || `img-${idx + 1}`,
    url: img.url,
    alt: img.alt || name,
    isPrimary: !!img.isPrimary,
  }));
  if (list.length && !list.some((i) => i.isPrimary)) list[0].isPrimary = true;
  return list;
}

function normalizeVariants(variants: any[] | undefined, baseSku: string) {
  return (variants || []).map((v, idx) => ({
    id: v.id || `var-${idx + 1}`,
    productId: v.productId,
    sku: String(v.sku || `${baseSku}-V${idx + 1}`).toUpperCase().trim(),
    size: v.size || undefined,
    color: v.color || undefined,
    price: Number(v.price || 0),
    mrp: Number(v.mrp ?? v.price ?? 0),
    stock: Math.max(0, Number(v.stock || 0)),
    weight: v.weight || undefined,
  }));
}

function totalStockFromVariants(variants: any[]): number {
  return variants.reduce((sum, v) => sum + Math.max(0, Number(v.stock || 0)), 0);
}

function stockStatus(stock: number, threshold: number): 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' {
  if (stock <= 0) return 'OUT_OF_STOCK';
  if (stock <= threshold) return 'LOW_STOCK';
  return 'IN_STOCK';
}

async function ensureUniqueProductSlug(base: string, sellerId: string, excludeId?: string): Promise<string> {
  let slug = generateSlug(base || 'product') || 'product';
  const root = slug;
  let i = 1;
  while (true) {
    const q: any = { slug };
    if (excludeId) q._id = { $ne: excludeId };
    const exists = await ProductModel.exists(q);
    if (!exists) return slug;
    i += 1;
    slug = `${root}-${sellerId.slice(-4).toLowerCase()}-${i}`;
  }
}

async function ensureUniqueSku(sku: string, sellerId: string, excludeProductId?: string) {
  const normalized = String(sku || '').toUpperCase().trim();
  if (!normalized) throw new Error('SKU is required.');
  const q: any = { sku: normalized };
  if (excludeProductId) q._id = { $ne: excludeProductId };
  const existing = await ProductModel.findOne(q).select('_id sellerId').lean().exec();
  if (existing && String(existing.sellerId) !== String(sellerId)) throw new Error('SKU is already in use.');
  if (existing && excludeProductId && String(existing._id) !== String(excludeProductId)) throw new Error('SKU is already in use.');
  const variantConflict = await ProductModel.findOne({ 'variants.sku': normalized, ...(excludeProductId ? { _id: { $ne: excludeProductId } } : {}) }).select('_id sellerId').lean().exec();
  if (variantConflict && excludeProductId && String(variantConflict._id) === String(excludeProductId)) {
    // same product variant case handled by caller set checks
  } else if (variantConflict) {
    throw new Error('Variant SKU is already in use.');
  }
  return normalized;
}

async function syncInventoryForProduct(product: any, actorId?: string, reason = 'inventory_sync') {
  const sellerId = toId(product.sellerId);
  const productId = toId(product._id || product.id);
  const threshold = Math.max(0, Number(product.lowStockThreshold || 0));
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const items: Array<{ sku: string; stock: number; variantId?: string }> = variants.length
    ? variants.map((v: any) => ({ sku: String(v.sku).toUpperCase(), stock: Math.max(0, Number(v.stock || 0)), variantId: String(v.id || '') || undefined }))
    : [{ sku: String(product.sku).toUpperCase(), stock: Math.max(0, Number(product.stock || 0)), variantId: undefined }];

  const keepSkus = items.map((i) => i.sku);
  for (const item of items) {
    const existing: any = await InventoryModel.findOne({ sellerId, productId, sku: item.sku }).exec();
    const prevStock = existing ? Number(existing.stock || 0) : 0;
    const status = stockStatus(item.stock, threshold);
    await InventoryModel.findOneAndUpdate(
      { sellerId, productId, sku: item.sku },
      { $set: { productId, sellerId, sku: item.sku, stock: item.stock, lowStockThreshold: threshold, reservedStock: 0, availableStock: item.stock, status, lastUpdated: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
    if (!existing || prevStock !== item.stock) {
      try {
        await InventoryMovementModel.create({
          sellerId, productId, variantId: item.variantId, sku: item.sku,
          type: !existing ? 'IN' : item.stock > prevStock ? 'IN' : item.stock < prevStock ? 'OUT' : 'ADJUSTMENT',
          quantity: Math.abs(item.stock - prevStock), previousStock: prevStock, newStock: item.stock,
          reason, actorId,
        } as any);
      } catch {}
    }
  }
  await InventoryModel.deleteMany({ sellerId, productId, sku: { $nin: keepSkus } }).exec();
}

function toVendorProduct(product: any) {
  const images = (product.images || []).map((img: any) => ({ id: img.id, url: img.url, alt: img.alt, isPrimary: !!img.isPrimary }));
  const primary = images.find((i: any) => i.isPrimary) || images[0];
  const variants = (product.variants || []).map((v: any) => ({
    id: v.id, sku: v.sku, size: v.size, color: v.color,
    price: Number(v.price || 0), mrp: Number(v.mrp ?? v.price ?? 0), stock: Number(v.stock || 0), weight: v.weight,
  }));
  const effectiveStock = variants.length ? totalStockFromVariants(variants) : Number(product.stock || 0);
  let status = product.status;
  if (status === 'PUBLISHED' && effectiveStock === 0) status = 'OUT_OF_STOCK';
  if ((product as any).archived) status = 'ARCHIVED';
  if ((product as any).approvalSubmissionStatus === 'PENDING_APPROVAL' && status !== 'PUBLISHED') status = 'PENDING_APPROVAL';
  return {
    id: toId(product._id || product.id),
    sellerId: toId(product.sellerId),
    name: product.name,
    title: product.name,
    slug: product.slug,
    sku: product.sku,
    barcode: product.barcode || '',
    category: product.category,
    categoryId: product.categoryId ? toId(product.categoryId) : '',
    subcategory: product.subcategory || '',
    brand: product.brand || '',
    brandId: product.brandId ? toId(product.brandId) : '',
    description: product.description,
    shortDescription: product.shortDescription || '',
    highlights: product.highlights || [],
    specifications: product.specifications instanceof Map ? Object.fromEntries(product.specifications) : (product.specifications || {}),
    price: Number(product.price || 0),
    mrp: Number(product.mrp || 0),
    discountPercentage: Number(product.discountPercentage || 0),
    taxPercentage: Number(product.taxPercentage || 0),
    stock: effectiveStock,
    lowStockThreshold: Number(product.lowStockThreshold || 0),
    status,
    images,
    thumbnail: primary?.url || '',
    variants,
    seoTitle: product.seoTitle || '',
    seoDescription: product.seoDescription || '',
    unitsSold: Number(product.unitsSold || 0),
    totalRevenue: Number(product.totalRevenue || 0),
    rating: Number(product.rating || 0),
    reviewCount: Number(product.reviewCount || 0),
    isFreeDelivery: !!product.isFreeDelivery,
    estimatedDeliveryDays: Number(product.estimatedDeliveryDays || 3),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function assertOwned(product: any, sellerId: string) {
  if (!product) throw new Error('Product not found.');
  if (toId(product.sellerId) !== toId(sellerId)) throw new Error('Forbidden');
}

export async function listVendorProducts(sellerId: string, query: any) {
  const filter: any = { sellerId };
  if (query?.search) filter.$text = { $search: String(query.search) };
  if (query?.category) filter.category = query.category;
  if (query?.status) {
    if (query.status === 'PUBLISHED') filter.status = 'PUBLISHED';
    else if (query.status === 'DRAFT') filter.status = 'DRAFT';
    else if (query.status === 'OUT_OF_STOCK') filter.$or = [{ status: 'OUT_OF_STOCK' }, { stock: 0, status: 'PUBLISHED' }];
  }
  if (query?.stock === 'OUT_OF_STOCK') filter.stock = 0;
  if (query?.stock === 'LOW_STOCK') { filter.stock = { $gt: 0 }; filter.$expr = { $lte: ['$stock', '$lowStockThreshold'] }; }
  if (query?.stock === 'IN_STOCK') filter.stock = { $gt: 0 };

  const page = Math.max(1, Number(query?.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query?.limit || 20)));
  let sort: any = { createdAt: -1 };
  if (query?.sortBy === 'price_asc') sort = { price: 1 };
  if (query?.sortBy === 'price_desc') sort = { price: -1 };
  if (query?.sortBy === 'name_asc') sort = { name: 1 };
  if (query?.sortBy === 'name_desc') sort = { name: -1 };

  const [rows, total] = await Promise.all([
    ProductModel.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).exec(),
    ProductModel.countDocuments(filter).exec(),
  ]);
  let data = rows.map(toVendorProduct);
  if (query?.status === 'ARCHIVED') data = data.filter((d: any) => d.status === 'ARCHIVED');
  if (query?.status === 'PENDING_APPROVAL') data = data.filter((d: any) => d.status === 'PENDING_APPROVAL');
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) || 1, hasMore: page * limit < total };
}

export async function getVendorProductById(sellerId: string, productId: string) {
  const product = await ProductModel.findById(productId).exec();
  assertOwned(product, sellerId);
  return toVendorProduct(product);
}

export async function createVendorProduct(sellerId: string, actorId: string, input: VendorCreateProductInput) {
  const sku = await ensureUniqueSku(input.sku, sellerId);
  const variants = normalizeVariants(input.variants, sku);
  const seen = new Set<string>([sku]);
  for (const v of variants) {
    const vs = String(v.sku).toUpperCase();
    if (seen.has(vs)) throw new Error(`Duplicate SKU: ${vs}`);
    seen.add(vs);
    await ensureUniqueSku(vs, sellerId);
  }
  const slug = await ensureUniqueProductSlug(input.slug || input.name, sellerId);
  const images = normalizeImages(input.images || [], input.name);
  if (!images.length) throw new Error('At least one image is required.');
  const stock = variants.length ? totalStockFromVariants(variants) : Math.max(0, Number(input.stock || 0));
  const mrp = Number(input.mrp);
  const price = Number(input.price);
  if (price > mrp) throw new Error('Selling price cannot exceed MRP.');
  const requestedStatus = input.status || 'DRAFT';
  let status: any = 'DRAFT';
  let approvalSubmissionStatus = 'DRAFT';
  let archived = false;
  if (requestedStatus === 'PUBLISHED' || requestedStatus === 'PENDING_APPROVAL') { status = 'DRAFT'; approvalSubmissionStatus = 'PENDING_APPROVAL'; }
  if (requestedStatus === 'ARCHIVED') { archived = true; approvalSubmissionStatus = 'ARCHIVED'; }

  const product: any = await ProductModel.create({
    sellerId, name: input.name.trim(), slug, sku, barcode: input.barcode || '', category: input.category,
    categoryId: input.categoryId || undefined, subcategory: input.subcategory || '', brand: input.brand || '', brandId: input.brandId || undefined,
    description: input.description, shortDescription: input.shortDescription || '', highlights: input.highlights || [], specifications: input.specifications || {},
    price, mrp, discountPercentage: input.discountPercentage ?? computeDiscount(price, mrp), taxPercentage: input.taxPercentage ?? 0,
    stock, lowStockThreshold: Math.max(0, Number(input.lowStockThreshold || 0)), status, images, variants,
    seoTitle: input.seoTitle || '', seoDescription: input.seoDescription || '', isAssured: false, isFreeDelivery: !!input.isFreeDelivery,
    estimatedDeliveryDays: Math.max(0, Number(input.estimatedDeliveryDays ?? 3)),
  } as any);
  (product as any).approvalSubmissionStatus = approvalSubmissionStatus;
  (product as any).archived = archived;
  await product.save();
  await syncInventoryForProduct(product, actorId, 'product_created');
  return toVendorProduct(product);
}

export async function updateVendorProduct(sellerId: string, actorId: string, productId: string, input: VendorUpdateProductInput) {
  const product: any = await ProductModel.findById(productId).exec();
  assertOwned(product, sellerId);

  if (input.name !== undefined) product.name = input.name.trim();
  if (input.slug !== undefined || input.name !== undefined) product.slug = await ensureUniqueProductSlug(input.slug || product.name, sellerId, productId);
  if (input.sku !== undefined) product.sku = await ensureUniqueSku(input.sku, sellerId, productId);
  if (input.barcode !== undefined) product.barcode = input.barcode || '';
  if (input.category !== undefined) product.category = input.category;
  if (input.categoryId !== undefined) product.categoryId = input.categoryId || undefined;
  if (input.subcategory !== undefined) product.subcategory = input.subcategory || '';
  if (input.brand !== undefined) product.brand = input.brand || '';
  if (input.brandId !== undefined) product.brandId = input.brandId || undefined;
  if (input.description !== undefined) product.description = input.description;
  if (input.shortDescription !== undefined) product.shortDescription = input.shortDescription || '';
  if (input.highlights !== undefined) product.highlights = input.highlights || [];
  if (input.specifications !== undefined) product.specifications = input.specifications || {};
  if (input.price !== undefined) product.price = Number(input.price);
  if (input.mrp !== undefined) product.mrp = Number(input.mrp);
  if (product.price > product.mrp) throw new Error('Selling price cannot exceed MRP.');
  product.discountPercentage = input.discountPercentage !== undefined ? Number(input.discountPercentage) : computeDiscount(product.price, product.mrp);
  if (input.taxPercentage !== undefined) product.taxPercentage = Number(input.taxPercentage);
  if (input.lowStockThreshold !== undefined) product.lowStockThreshold = Math.max(0, Number(input.lowStockThreshold));
  if (input.images !== undefined) {
    const imgs = normalizeImages(input.images || [], product.name);
    if (!imgs.length) throw new Error('At least one image is required.');
    product.images = imgs;
  }
  if (input.variants !== undefined) {
    const variants = normalizeVariants(input.variants || [], product.sku);
    const seen = new Set<string>([String(product.sku).toUpperCase()]);
    for (const v of variants) {
      const vs = String(v.sku).toUpperCase();
      if (seen.has(vs)) throw new Error(`Duplicate SKU: ${vs}`);
      seen.add(vs);
      await ensureUniqueSku(vs, sellerId, productId);
    }
    product.variants = variants;
  }
  if (input.stock !== undefined && !(product.variants || []).length) product.stock = Math.max(0, Number(input.stock));
  const effectiveStock = (product.variants || []).length ? totalStockFromVariants(product.variants) : Math.max(0, Number(product.stock || 0));
  product.stock = effectiveStock;

  const requestedStatus = input.status;
  if (requestedStatus === 'ARCHIVED') { (product as any).archived = true; (product as any).approvalSubmissionStatus = 'ARCHIVED'; if (product.status !== 'PUBLISHED') product.status = 'DRAFT'; else product.status = 'DRAFT'; }
  else if (requestedStatus === 'PENDING_APPROVAL' || requestedStatus === 'PUBLISHED') { (product as any).archived = false; (product as any).approvalSubmissionStatus = 'PENDING_APPROVAL'; if (product.status !== 'PUBLISHED') product.status = 'DRAFT'; }
  else if (requestedStatus === 'DRAFT') { (product as any).archived = false; (product as any).approvalSubmissionStatus = 'DRAFT'; if (product.status !== 'PUBLISHED') product.status = 'DRAFT'; }

  if (input.seoTitle !== undefined) product.seoTitle = input.seoTitle || '';
  if (input.seoDescription !== undefined) product.seoDescription = input.seoDescription || '';
  if (input.isFreeDelivery !== undefined) product.isFreeDelivery = !!input.isFreeDelivery;
  if (input.estimatedDeliveryDays !== undefined) product.estimatedDeliveryDays = Math.max(0, Number(input.estimatedDeliveryDays));

  await product.save();
  await syncInventoryForProduct(product, actorId, 'product_updated');
  return toVendorProduct(product);
}

export async function archiveVendorProduct(sellerId: string, productId: string) {
  const product: any = await ProductModel.findById(productId).exec();
  assertOwned(product, sellerId);
  (product as any).archived = true;
  (product as any).approvalSubmissionStatus = 'ARCHIVED';
  if (product.status !== 'PUBLISHED') product.status = 'DRAFT'; else product.status = 'DRAFT';
  await product.save();
  return { id: productId, status: 'ARCHIVED' };
}

export async function submitVendorProductForApproval(sellerId: string, productId: string) {
  const product: any = await ProductModel.findById(productId).exec();
  assertOwned(product, sellerId);
  (product as any).archived = false;
  (product as any).approvalSubmissionStatus = 'PENDING_APPROVAL';
  if (product.status !== 'PUBLISHED') product.status = 'DRAFT';
  await product.save();
  return toVendorProduct(product);
}

export async function listVendorInventory(sellerId: string, query: any) {
  const productFilter: any = { sellerId };
  if (query?.search) {
    productFilter.$or = [
      { name: { $regex: String(query.search), $options: 'i' } },
      { sku: { $regex: String(query.search), $options: 'i' } },
      { category: { $regex: String(query.search), $options: 'i' } },
    ];
  }
  const products = await ProductModel.find(productFilter).sort({ updatedAt: -1 }).exec();
  const ids = products.map((p: any) => p._id);
  const invRows: any[] = await InventoryModel.find({ sellerId, productId: { $in: ids } }).lean().exec();
  const invByKey = new Map<string, any>();
  for (const r of invRows) invByKey.set(`${String(r.productId)}:${String(r.sku)}`, r);

  const items: any[] = [];
  for (const p of products as any[]) {
    const variants = Array.isArray(p.variants) ? p.variants : [];
    const base = { productId: toId(p._id), productName: p.name, image: p.images?.find((i: any) => i.isPrimary)?.url || p.images?.[0]?.url || '', category: p.category || '', lowStockThreshold: Number(p.lowStockThreshold || 0) };
    if (variants.length) {
      for (const v of variants) {
        const sku = String(v.sku).toUpperCase();
        const inv = invByKey.get(`${toId(p._id)}:${sku}`);
        const stock = Math.max(0, Number(inv?.stock ?? v.stock ?? 0));
        const threshold = Number(inv?.lowStockThreshold ?? p.lowStockThreshold ?? 0);
        items.push({ id: `${toId(p._id)}:${sku}`, ...base, sku, variantId: String(v.id || ''), variantLabel: [v.size, v.color].filter(Boolean).join(' / ') || undefined, stock, reservedStock: Number(inv?.reservedStock || 0), availableStock: Math.max(0, stock - Number(inv?.reservedStock || 0)), status: stockStatus(stock, threshold), lastUpdated: inv?.lastUpdated || p.updatedAt, lowStockThreshold: threshold });
      }
    } else {
      const sku = String(p.sku).toUpperCase();
      const inv = invByKey.get(`${toId(p._id)}:${sku}`);
      const stock = Math.max(0, Number(inv?.stock ?? p.stock ?? 0));
      const threshold = Number(inv?.lowStockThreshold ?? p.lowStockThreshold ?? 0);
      items.push({ id: `${toId(p._id)}:${sku}`, ...base, sku, stock, reservedStock: Number(inv?.reservedStock || 0), availableStock: Math.max(0, stock - Number(inv?.reservedStock || 0)), status: stockStatus(stock, threshold), lastUpdated: inv?.lastUpdated || p.updatedAt, lowStockThreshold: threshold });
    }
  }
  let filtered = items;
  if (query?.status) filtered = filtered.filter((i) => i.status === query.status);
  const page = Math.max(1, Number(query?.page || 1));
  const limit = Math.min(200, Math.max(1, Number(query?.limit || 50)));
  const total = filtered.length;
  return {
    data: filtered.slice((page - 1) * limit, page * limit),
    stats: {
      totalProducts: new Set(items.map((i) => i.productId)).size,
      totalStock: items.reduce((s, i) => s + Number(i.stock || 0), 0),
      availableStock: items.reduce((s, i) => s + Number(i.availableStock || 0), 0),
      lowStock: items.filter((i) => i.status === 'LOW_STOCK').length,
      outOfStock: items.filter((i) => i.status === 'OUT_OF_STOCK').length,
    },
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function updateVendorInventory(sellerId: string, actorId: string, productId: string, input: { stock?: number; delta?: number; lowStockThreshold?: number; variantId?: string; sku?: string; reason?: string }) {
  const product: any = await ProductModel.findById(productId).exec();
  assertOwned(product, sellerId);
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (input.lowStockThreshold !== undefined) product.lowStockThreshold = Math.max(0, Number(input.lowStockThreshold));
  const threshold = Number(product.lowStockThreshold || 0);

  let targetVariant: any = null;
  if (variants.length) {
    targetVariant = variants.find((v: any) => (input.variantId && String(v.id) === String(input.variantId)) || (input.sku && String(v.sku).toUpperCase() === String(input.sku).toUpperCase())) || null;
    if (!targetVariant && variants.length === 1 && !input.variantId && !input.sku) targetVariant = variants[0];
    if (!targetVariant) throw new Error('Variant is required for variant products.');
  }

  const prev = targetVariant ? Number(targetVariant.stock || 0) : Number(product.stock || 0);
  let next = prev;
  if (input.stock !== undefined) next = Math.max(0, Number(input.stock));
  else if (input.delta !== undefined) next = prev + Number(input.delta);
  if (!Number.isFinite(next) || next < 0) throw new Error('Stock cannot be negative.');

  if (targetVariant) targetVariant.stock = next; else product.stock = next;
  product.stock = variants.length ? totalStockFromVariants(variants) : next;
  if (!variants.length) {
    if (next === 0 && product.status === 'PUBLISHED') product.status = 'OUT_OF_STOCK';
    if (next > 0 && product.status === 'OUT_OF_STOCK') product.status = 'PUBLISHED';
  }
  await product.save();

  const sku = targetVariant ? String(targetVariant.sku).toUpperCase() : String(product.sku).toUpperCase();
  await InventoryModel.findOneAndUpdate(
    { sellerId, productId, sku },
    { $set: { productId, sellerId, sku, stock: next, lowStockThreshold: threshold, reservedStock: 0, availableStock: next, status: stockStatus(next, threshold), lastUpdated: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();
  if (next !== prev) {
    try {
      await InventoryMovementModel.create({ sellerId, productId, variantId: targetVariant ? String(targetVariant.id || '') : undefined, sku, type: next > prev ? 'IN' : 'OUT', quantity: Math.abs(next - prev), previousStock: prev, newStock: next, reason: input.reason || 'manual_stock_update', actorId } as any);
    } catch {}
  }
  await syncInventoryForProduct(product, actorId, input.reason || 'manual_stock_update');
  return { productId, sku, variantId: targetVariant ? String(targetVariant.id || '') : undefined, previousStock: prev, stock: next, lowStockThreshold: threshold, status: stockStatus(next, threshold) };
}

export async function listVendorInventoryHistory(sellerId: string, query: any) {
  const filter: any = { sellerId };
  if (query?.productId) filter.productId = query.productId;
  const page = Math.max(1, Number(query?.page || 1));
  const limit = Math.min(200, Math.max(1, Number(query?.limit || 50)));
  const [rows, total] = await Promise.all([
    InventoryMovementModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean().exec(),
    InventoryMovementModel.countDocuments(filter).exec(),
  ]);
  const productIds = Array.from(new Set(rows.map((r: any) => String(r.productId))));
  const products = await ProductModel.find({ _id: { $in: productIds }, sellerId }).select('name').lean().exec();
  const nameById = new Map(products.map((p: any) => [String(p._id), p.name]));
  return {
    data: rows.map((r: any) => ({ id: String(r._id), productId: String(r.productId), productName: nameById.get(String(r.productId)) || 'Product', variantId: r.variantId, sku: r.sku, type: r.type === 'IN' ? 'IN' : r.type === 'OUT' ? 'OUT' : 'ADJUSTMENT', quantity: Number(r.quantity || 0), previousStock: Number(r.previousStock || 0), newStock: Number(r.newStock || 0), reason: r.reason || '', createdAt: r.createdAt })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

function maskCustomerAddress(addr: any) {
  if (!addr) return null;
  return { name: addr.name, city: addr.city, state: addr.state, pincode: addr.pincode, locality: addr.locality };
}

export async function listVendorOrders(sellerId: string, query: any) {
  const filter: any = { sellerId };
  if (query?.status) filter.orderStatus = query.status;
  const subs = await SubOrderModel.find(filter).sort({ placedAt: -1 }).lean().exec();
  const orderIds = Array.from(new Set(subs.map((s: any) => String(s.orderId))));
  const orders = await OrderModel.find({ _id: { $in: orderIds } }).lean().exec();
  const orderById = new Map(orders.map((o: any) => [String(o._id), o]));
  const addrIds = Array.from(new Set(orders.map((o: any) => String(o.shippingAddress)).filter(Boolean)));
  const addrs = addrIds.length ? await AddressModel.find({ _id: { $in: addrIds } }).lean().exec() : [];
  const addrById = new Map(addrs.map((a: any) => [String(a._id), a]));
  let data = subs.map((s: any) => {
    const o = orderById.get(String(s.orderId));
    if (!o) return null;
    const addr = addrById.get(String(o.shippingAddress));
    return {
      id: String(s._id), parentOrderId: String(o._id), orderId: String(o._id), orderNumber: o.orderNumber, subOrderNumber: s.subOrderNumber,
      customerId: String(o.customerId), customerName: o.customerName,
      items: (s.items || []).map((it: any) => ({ id: it.id, productId: toId(it.productId), title: it.title, thumbnail: it.thumbnail || '', price: Number(it.price || 0), mrp: Number(it.mrp || it.price || 0), quantity: Number(it.quantity || 1), selectedVariants: it.selectedVariants || {} })),
      shippingAddress: maskCustomerAddress(addr), paymentMethod: s.paymentMethod || o.paymentMethod, paymentStatus: s.paymentStatus || o.paymentStatus,
      orderStatus: s.orderStatus, pricing: s.pricing || o.pricing, placedAt: s.placedAt || o.placedAt, estimatedDelivery: s.estimatedDelivery || o.estimatedDelivery, deliveredAt: s.deliveredAt, statusHistory: s.statusHistory || [],
    };
  }).filter(Boolean) as any[];
  if (query?.search) {
    const q = String(query.search).toLowerCase();
    data = data.filter((d) => [d.orderNumber, d.subOrderNumber, d.customerName, ...(d.items || []).map((i: any) => i.title)].some((v) => String(v || '').toLowerCase().includes(q)));
  }
  const page = Math.max(1, Number(query?.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query?.limit || 20)));
  const total = data.length;
  return { data: data.slice((page - 1) * limit, page * limit), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
}

export async function getVendorOrderDetail(sellerId: string, subOrderId: string) {
  const sub: any = await SubOrderModel.findOne({ _id: subOrderId, sellerId }).lean().exec() || await SubOrderModel.findOne({ subOrderNumber: subOrderId, sellerId }).lean().exec();
  if (!sub) throw new Error('Order not found.');
  const order: any = await OrderModel.findById(sub.orderId).lean().exec();
  if (!order) throw new Error('Order not found.');
  const addr = await AddressModel.findById(order.shippingAddress).lean().exec();
  const shipments = await ShipmentModel.find({ subOrderId: String(sub._id), sellerId }).lean().exec();
  const returns = await ReturnRequestModel.find({ $or: [{ subOrderId: String(sub._id) }, { orderId: order._id, sellerId }] }).sort({ createdAt: -1 }).lean().exec();
  return {
    id: String(sub._id), parentOrderId: String(order._id), orderId: String(order._id), orderNumber: order.orderNumber, subOrderNumber: sub.subOrderNumber,
    customerId: String(order.customerId), customerName: order.customerName,
    items: (sub.items || []).map((it: any) => ({ id: it.id, productId: toId(it.productId), title: it.title, thumbnail: it.thumbnail || '', price: Number(it.price || 0), mrp: Number(it.mrp || it.price || 0), quantity: Number(it.quantity || 1), selectedVariants: it.selectedVariants || {} })),
    shippingAddress: maskCustomerAddress(addr), paymentMethod: sub.paymentMethod || order.paymentMethod, paymentStatus: sub.paymentStatus || order.paymentStatus,
    orderStatus: sub.orderStatus, pricing: sub.pricing || order.pricing, placedAt: sub.placedAt || order.placedAt, estimatedDelivery: sub.estimatedDelivery || order.estimatedDelivery, deliveredAt: sub.deliveredAt,
    statusHistory: sub.statusHistory || [], shipments, returns, commission: sub.commission || null,
  };
}

export async function listVendorCustomers(sellerId: string, query: any) {
  const subs = await SubOrderModel.find({ sellerId }).lean().exec();
  if (!subs.length) return { data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 1 } };
  const orderIds = Array.from(new Set(subs.map((s: any) => String(s.orderId))));
  const orders = await OrderModel.find({ _id: { $in: orderIds } }).lean().exec();
  const orderById = new Map(orders.map((o: any) => [String(o._id), o]));
  const addrIds = Array.from(new Set(orders.map((o: any) => String(o.shippingAddress)).filter(Boolean)));
  const addrs = addrIds.length ? await AddressModel.find({ _id: { $in: addrIds } }).lean().exec() : [];
  const addrById = new Map(addrs.map((a: any) => [String(a._id), a]));
  const map = new Map<string, any>();
  for (const s of subs as any[]) {
    const o = orderById.get(String(s.orderId));
    if (!o) continue;
    const cid = String(o.customerId);
    const addr = addrById.get(String(o.shippingAddress));
    const existing = map.get(cid) || { id: cid, name: o.customerName || 'Customer', email: undefined, phone: undefined, totalOrders: 0, totalSpending: 0, lastOrderDate: s.placedAt || o.placedAt, location: [addr?.city, addr?.state].filter(Boolean).join(', ') || '' };
    existing.totalOrders += 1;
    existing.totalSpending += Number(s.pricing?.totalAmount || 0);
    if (new Date(s.placedAt || o.placedAt || 0).getTime() >= new Date(existing.lastOrderDate || 0).getTime()) existing.lastOrderDate = s.placedAt || o.placedAt || existing.lastOrderDate;
    map.set(cid, existing);
  }
  let data = Array.from(map.values()).sort((a, b) => new Date(b.lastOrderDate || 0).getTime() - new Date(a.lastOrderDate || 0).getTime());
  if (query?.search) {
    const q = String(query.search).toLowerCase();
    data = data.filter((c) => [c.name, c.location].some((v) => String(v || '').toLowerCase().includes(q)));
  }
  const page = Math.max(1, Number(query?.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query?.limit || 50)));
  const total = data.length;
  return { data: data.slice((page - 1) * limit, page * limit), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
}
