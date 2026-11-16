import { z } from 'zod';

const imageSchema = z.object({ id: z.string().optional(), url: z.string().url('Invalid image URL'), alt: z.string().optional(), isPrimary: z.boolean().optional() });
const variantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, 'Variant SKU is required').max(80),
  size: z.string().max(50).optional(),
  color: z.string().max(50).optional(),
  price: z.number().min(0),
  mrp: z.number().min(0),
  stock: z.number().int().min(0),
  weight: z.string().max(50).optional(),
});

export const vendorCreateProductSchema = z.object({
  name: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug').optional(),
  sku: z.string().min(2).max(80),
  barcode: z.string().max(80).optional(),
  category: z.string().min(1).max(120),
  categoryId: z.string().optional(),
  subcategory: z.string().max(120).optional(),
  brand: z.string().max(120).optional(),
  brandId: z.string().optional(),
  description: z.string().min(10).max(5000),
  shortDescription: z.string().max(300).optional(),
  highlights: z.array(z.string().max(200)).max(20).optional(),
  specifications: z.record(z.string(), z.string().max(500)).optional(),
  price: z.number().min(0),
  mrp: z.number().min(0),
  discountPercentage: z.number().min(0).max(100).optional(),
  taxPercentage: z.number().min(0).max(100).optional(),
  stock: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).optional(),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'ARCHIVED']).optional(),
  images: z.array(imageSchema).min(1, 'At least one image is required').max(10),
  variants: z.array(variantSchema).max(50).optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
  isFreeDelivery: z.boolean().optional(),
  estimatedDeliveryDays: z.number().int().min(0).max(30).optional(),
});

export const vendorUpdateProductSchema = vendorCreateProductSchema.partial();

export const vendorProductQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  stock: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.string().optional(),
});

export const vendorInventoryUpdateSchema = z.object({
  stock: z.number().int().min(0).optional(),
  delta: z.number().int().optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  variantId: z.string().trim().optional(),
  reason: z.string().trim().max(500).optional(),
}).refine((d) => d.stock !== undefined || d.delta !== undefined || d.lowStockThreshold !== undefined, {
  message: 'Provide stock, delta, or lowStockThreshold.',
});

export const vendorInventoryQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  includeHistory: z.coerce.boolean().optional(),
});

export const vendorOrdersQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const vendorOrderStatusSchema = z.object({
  status: z.enum(['CONFIRMED','PROCESSING','PACKED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED']),
  note: z.string().trim().max(500).optional(),
  carrier: z.string().trim().max(120).optional(),
  trackingNumber: z.string().trim().max(120).optional(),
  trackingUrl: z.string().trim().url().max(500).optional(),
  currentLocation: z.string().trim().max(200).optional(),
  estimatedDelivery: z.string().optional(),
});

export const vendorCustomersQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export type VendorCreateProductInput = z.infer<typeof vendorCreateProductSchema>;
export type VendorUpdateProductInput = z.infer<typeof vendorUpdateProductSchema>;
export type VendorInventoryUpdateInput = z.infer<typeof vendorInventoryUpdateSchema>;
