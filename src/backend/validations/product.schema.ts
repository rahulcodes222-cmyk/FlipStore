/**
 * Zod Validation Schemas for Product and Category Management
 * Shared validation logic for product CRUD and category CRUD operations.
 * Uses Zod v4 API.
 */

import { z } from 'zod';

/**
 * Common field schemas
 */
const nameSchema = z
  .string()
  .min(2, 'Product name must be at least 2 characters.')
  .max(200, 'Product name must not exceed 200 characters.')
  .trim();

const slugSchema = z
  .string()
  .min(2, 'Slug is required.')
  .max(200, 'Slug must not exceed 200 characters.')
  .lowercase()
  .trim()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format. Use lowercase letters, numbers, and hyphens.');

const descriptionSchema = z
  .string()
  .min(10, 'Description must be at least 10 characters.')
  .max(5000, 'Description must not exceed 5000 characters.')
  .trim();

const shortDescriptionSchema = z
  .string()
  .max(300, 'Short description must not exceed 300 characters.')
  .optional();

const skuSchema = z
  .string()
  .min(3, 'SKU must be at least 3 characters.')
  .max(50, 'SKU must not exceed 50 characters.')
  .uppercase()
  .trim();

const priceSchema = z
  .number()
  .min(0, 'Price must be a positive number.')
  .max(99999999, 'Price is too large.');

const mrpSchema = z
  .number()
  .min(0, 'MRP must be a positive number.')
  .max(99999999, 'MRP is too large.');

const stockSchema = z
  .number()
  .int('Stock must be a whole number.')
  .min(0, 'Stock cannot be negative.')
  .max(999999, 'Stock is too large.');

const lowStockThresholdSchema = z
  .number()
  .int()
  .min(0, 'Low stock threshold cannot be negative.')
  .optional();

const discountPercentageSchema = z
  .number()
  .min(0, 'Discount percentage cannot be negative.')
  .max(100, 'Discount percentage cannot exceed 100.')
  .optional();

const taxPercentageSchema = z
  .number()
  .min(0, 'Tax percentage cannot be negative.')
  .max(100, 'Tax percentage cannot exceed 100.')
  .optional();

const estimatedDeliveryDaysSchema = z
  .number()
  .int()
  .min(0, 'Estimated delivery days cannot be negative.')
  .max(30, 'Estimated delivery days cannot exceed 30.')
  .optional();

const isBooleanOptional = z.boolean().optional();

/**
 * Product Image Schema
 */
const productImageSchema = z.object({
  id: z.string().min(1, 'Image ID is required.'),
  url: z.string().min(1, 'Image URL is required.').refine(
    (v) => /^https?:\/\//i.test(v) || /^data:image\//i.test(v) || v.startsWith('/'),
    'Invalid image URL.'
  ),
  alt: z.string().optional(),
  isPrimary: z.boolean().optional().default(false),
});

/**
 * Product Variant Schema
 */
const productVariantSchema = z.object({
  id: z.string().min(1, 'Variant ID is required.'),
  sku: z.string().min(1, 'Variant SKU is required.').uppercase(),
  size: z.string().optional(),
  color: z.string().optional(),
  price: priceSchema,
  mrp: mrpSchema,
  stock: stockSchema,
  weight: z.string().optional(),
});

/**
 * Specification Schema (key-value pairs)
 */
const specificationSchema = z.record(z.string(), z.string());

/**
 * Create Product Schema
 */
export const createProductSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  sku: skuSchema,
  barcode: z.string().optional(),
  category: z.string().min(1, 'Category is required.'),
  categoryId: z.string().optional(),
  subcategory: z.string().optional(),
  brand: z.string().optional(),
  brandId: z.string().optional(),
  description: descriptionSchema,
  shortDescription: shortDescriptionSchema,
  highlights: z.array(z.string()).optional(),
  specifications: specificationSchema.optional(),
  price: priceSchema,
  mrp: mrpSchema,
  discountPercentage: discountPercentageSchema,
  taxPercentage: taxPercentageSchema,
  stock: stockSchema,
  lowStockThreshold: lowStockThresholdSchema,
  status: z.enum(['DRAFT', 'PUBLISHED', 'OUT_OF_STOCK', 'REJECTED']).default('DRAFT'),
  images: z.array(productImageSchema).min(1, 'At least one product image is required.'),
  variants: z.array(productVariantSchema).optional(),
  seoTitle: z.string().max(200, 'SEO title must not exceed 200 characters.').optional(),
  seoDescription: z.string().max(500, 'SEO description must not exceed 500 characters.').optional(),
  isAssured: isBooleanOptional,
  isFreeDelivery: isBooleanOptional,
  estimatedDeliveryDays: estimatedDeliveryDaysSchema,
});

/**
 * Update Product Schema (partial)
 */
export const updateProductSchema = createProductSchema.partial();

/**
 * Product Query Schema
 */
export const productQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  categoryId: z.string().optional(),
  brand: z.string().optional(),
  brandId: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'OUT_OF_STOCK', 'REJECTED']).optional(),
  stock: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).optional(),
  sellerId: z.string().optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'rating', 'name_asc', 'name_desc', 'newest', 'discount', 'popularity']).optional(),
  page: z.string().regex(/^\d+$/, 'Page must be a number.').optional().default('1'),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number.').optional().default('20'),
});

/**
 * Product ID Param Schema
 */
export const productIdParamSchema = z.object({
  id: z.string().min(1, 'Product ID is required.'),
});

/**
 * Product Search Schema
 * Supports text search, filtering by category/brand/price/rating/in-stock,
 * and sorting/pagination.
 */
export const productSearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  brand: z.string().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  inStock: z.coerce.boolean().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'rating', 'name_asc', 'name_desc', 'newest', 'discount', 'popularity']).optional(),
  page: z.string().regex(/^\d+$/, 'Page must be a number.').optional().default('1'),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number.').optional().default('20'),
});

export type ProductSearchInput = z.infer<typeof productSearchSchema>;

/**
 * Create Category Schema
 */
export const createCategorySchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  description: z.string().max(500, 'Description must not exceed 500 characters.').optional(),
  image: z.string().url('Invalid category image URL.').optional().or(z.literal('')),
  icon: z.string().url('Invalid category icon URL.').optional().or(z.literal('')),
  parentId: z.string().optional(),
  itemCount: z.number().int().min(0).optional().default(0),
  isFeatured: isBooleanOptional.default(false),
  isActive: isBooleanOptional.default(true),
});

/**
 * Update Category Schema (partial)
 */
export const updateCategorySchema = createCategorySchema.partial();

/**
 * Category Query Schema
 */
export const categoryQuerySchema = z.object({
  parentId: z.string().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.string().regex(/^\d+$/, 'Page must be a number.').optional().default('1'),
  limit: z.string().regex(/^\d+$/, 'Limit must be a number.').optional().default('20'),
});

/**
 * Category ID Param Schema
 */
export const categoryIdParamSchema = z.object({
  id: z.string().min(1, 'Category ID is required.'),
});

/**
 * Export types inferred from schemas
 */
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type ProductIdParamInput = z.infer<typeof productIdParamSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryQueryInput = z.infer<typeof categoryQuerySchema>;
export type CategoryIdParamInput = z.infer<typeof categoryIdParamSchema>;
