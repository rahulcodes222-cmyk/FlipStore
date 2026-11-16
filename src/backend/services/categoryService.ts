/**
 * Category Service
 * Business logic for category management.
 * Supports hierarchical parent-child categories.
 */

import { CategoryModel, ProductModel } from '@/backend/models';
import type { ICategoryDocument } from '@/backend/types';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryQueryInput,
  CategoryIdParamInput,
} from '@/backend/validations/product.schema';
import { generateSlug } from '@/backend/utils/slug';

function normalizeCategory(doc: any): Record<string, unknown> {
  return {
    id: doc.id || doc._id?.toString?.(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description || '',
    image: doc.image || '',
    icon: doc.icon || '',
    parentId: doc.parentId?.toString?.() || doc.parentId || null,
    itemCount: doc.itemCount || 0,
    isFeatured: !!doc.isFeatured,
    isActive: doc.isActive !== false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * Create a new category (admin only).
 */
export async function createCategory(
  data: CreateCategoryInput,
): Promise<any> {
  const name = String(data.name || '').trim();
  if (name.length < 2) {
    throw new Error('Category name must be at least 2 characters.');
  }

  if (data.parentId) {
    const parentExists = await CategoryModel.findById(data.parentId).exec();
    if (!parentExists) {
      throw new Error('Parent category not found.');
    }
  }

  const rawSlug = String(data.slug || '').trim().toLowerCase();
  const baseSlug = (rawSlug || generateSlug(name) || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `category-${Date.now()}`)
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
  if (!baseSlug) {
    throw new Error('Slug is required.');
  }
  let slug = baseSlug;
  let i = 1;
  while (await CategoryModel.exists({ slug })) {
    slug = `${baseSlug}-${i}`;
    i += 1;
  }

  const image = typeof data.image === 'string' ? data.image.trim() : '';
  const icon = typeof data.icon === 'string' ? data.icon.trim() : '';

  const categoryData: Record<string, unknown> = {
    name,
    slug,
    description: typeof data.description === 'string' ? data.description.trim() : '',
    ...(image ? { image } : {}),
    ...(icon ? { icon } : {}),
    parentId: data.parentId || null,
    itemCount: Number.isFinite(Number(data.itemCount)) ? Math.max(0, Math.floor(Number(data.itemCount))) : 0,
    isFeatured: !!data.isFeatured,
    isActive: data.isActive !== false,
  };

  const category = await CategoryModel.create(categoryData);
  return category.toObject ? category.toObject({ virtuals: true }) : category;
}

/**
 * Get category by ID.
 */
export async function getCategoryById(
  categoryId: string,
): Promise<ICategoryDocument | null> {
  const category = await CategoryModel.findById(categoryId).exec();
  return category || null;
}

/**
 * Get category by slug.
 */
export async function getCategoryBySlug(
  slug: string,
): Promise<ICategoryDocument | null> {
  const category = await CategoryModel.findOne({ slug }).exec();
  return category || null;
}

/**
 * Get all categories with filtering and pagination.
 */
export async function getCategories(
  query: CategoryQueryInput,
): Promise<{
  data: ICategoryDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}> {
  const filter: Record<string, unknown> = {};

  if (query.parentId !== undefined) {
    filter.parentId = query.parentId;
  }
  if (query.isFeatured !== undefined) {
    filter.isFeatured = query.isFeatured;
  }
  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const start = (page - 1) * limit;

  const [data, total] = await Promise.all([
    CategoryModel.find(filter).sort({ name: 1 }).skip(start).limit(limit).exec(),
    CategoryModel.countDocuments(filter).exec(),
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;

  return { data, total, page, limit, totalPages, hasMore };
}

/**
 * Update a category (admin only).
 */
export async function updateCategory(
  categoryId: string,
  data: UpdateCategoryInput,
): Promise<ICategoryDocument | null> {
  const category = await CategoryModel.findById(categoryId).exec();
  if (!category) {
    throw new Error('Category not found.');
  }

  // If slug changed, verify uniqueness
  if (data.slug && data.slug !== category.slug) {
    const existing = await CategoryModel.findOne({ slug: data.slug }).exec();
    if (existing) {
      throw new Error('A category with this slug already exists.');
    }
  }

  // Apply updates
  if (data.name !== undefined) category.name = data.name;
  if (data.slug !== undefined) category.slug = data.slug;
  if (data.description !== undefined) category.description = data.description;
  if (data.image !== undefined) category.image = data.image;
  if (data.icon !== undefined) category.icon = data.icon;
  if (data.parentId !== undefined) category.parentId = data.parentId || null;
  if (data.itemCount !== undefined) category.itemCount = data.itemCount;
  if (data.isFeatured !== undefined) category.isFeatured = data.isFeatured;
  if (data.isActive !== undefined) category.isActive = data.isActive;

  const updated = await category.save();
  return updated;
}

/**
 * Delete a category (admin only).
 * Prevents deletion if active products depend on the category
 * unless safely reassigned (reassignTo provided).
 */
export async function deleteCategory(
  categoryId: string,
  reassignTo?: string,
): Promise<boolean> {
  const category = await CategoryModel.findById(categoryId).exec();
  if (!category) {
    throw new Error('Category not found.');
  }

  // Check if any active products use this category
  const productCount = await ProductModel.countDocuments({
    categoryId,
    status: 'PUBLISHED',
  }).exec();

  if (productCount > 0) {
    if (!reassignTo) {
      throw new Error(
        'Cannot delete category: published products depend on it. ' +
          'Reassign products to another category first.',
      );
    }

    // Reassign products to the target category
    await ProductModel.updateMany(
      { categoryId, status: 'PUBLISHED' },
      { categoryId: reassignTo },
    ).exec();
  }

  const result = await CategoryModel.deleteOne({ _id: categoryId }).exec();
  return result.deletedCount > 0;
}

/**
 * Generate a unique slug from a category name.
 */
export async function generateCategorySlug(name: string): Promise<string> {
  let slug = generateSlug(name);
  let counter = 1;
  while (await CategoryModel.exists({ slug })) {
    slug = `${generateSlug(name)}-${counter}`;
    counter += 1;
  }
  return slug;
}
