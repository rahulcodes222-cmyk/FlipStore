/**
 * Product Controller
 * Handles HTTP request/response for product endpoints.
 * Delegates business logic to productService.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createProduct,
  getProductById,
  getProductBySlug,
  getProducts,
  getProductsByCategory,
  updateProduct,
  deleteProduct,
  publishProduct,
  getProductCategories,
  getProductBrands,
  generateProductSlug,
} from '@/backend/services/productService';
import { withDatabase } from '@/backend/middleware/connectDb';
import { withAuth, withOptionalAuth } from '@/backend/middleware/auth';
import { withRole } from '@/backend/middleware/rbac';
import {
  createProductSchema,
  productIdParamSchema,
} from '@/backend/validations/product.schema';
import { USER_ROLES } from '@/backend/constants/roles';
import { createSuccessResponse, createErrorResponse } from '@/backend/utils/response';
import { HTTP_STATUS } from '@/backend/constants';

/**
 * Helper to parse and validate request body using Zod.
 */
async function validateRequestBody<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>,
): Promise<{ data: T } | { error: { statusCode: number; response: unknown } }> {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    return { data };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return {
        error: {
          statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
          response: {
            success: false,
            message: 'Invalid request body.',
            error: {
              code: 'VALIDATION_ERROR',
              details: error.flatten().fieldErrors as Record<string, string[]>,
            },
            timestamp: new Date().toISOString(),
          },
        },
      };
    }
    throw error;
  }
}

/**
 * POST /api/v1/products
 * Create a new product (seller/vendor only). Admin cannot add products.
 */
export const POST = withDatabase(
  withAuth(
    async (authReq) => {
      if (!authReq.user) {
        return NextResponse.json(
          createErrorResponse('Authentication required.', {
            statusCode: HTTP_STATUS.UNAUTHORIZED,
            code: 'AUTH_REQUIRED',
            requestId: authReq.requestId,
          }),
          { status: HTTP_STATUS.UNAUTHORIZED },
        );
      }
      const role = String(authReq.user.role || '').toLowerCase();
      if (role !== 'vendor') {
        return NextResponse.json(createErrorResponse('Only sellers can add products.', { statusCode: HTTP_STATUS.FORBIDDEN, code: 'INSUFFICIENT_PERMISSIONS', requestId: authReq.requestId }), { status: HTTP_STATUS.FORBIDDEN });
      }

      try {
        const raw = await (authReq as unknown as NextRequest).clone().json().catch(() => ({} as any));
        const body: any = { ...(raw || {}) };
        if (typeof body.name === 'string') body.name = body.name.trim();
        if (typeof body.slug === 'string') body.slug = body.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, '');
        if (!body.slug && body.name) body.slug = String(body.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (typeof body.category === 'string') body.category = body.category.trim();
        if (typeof body.brand === 'string') body.brand = body.brand.trim();
        if (typeof body.description === 'string') body.description = body.description.trim();
        if (typeof body.shortDescription === 'string') body.shortDescription = body.shortDescription.trim();
        if (typeof body.sku === 'string') body.sku = body.sku.trim().toUpperCase();
        if (!body.sku) body.sku = `SKU-${Date.now().toString(36).toUpperCase()}`;
        if (Array.isArray(body.images)) {
          body.images = body.images.map((img: any, idx: number) => {
            if (typeof img === 'string') return { id: `img-${idx + 1}`, url: img, alt: body.name || 'Product', isPrimary: idx === 0 };
            return { id: String(img?.id || `img-${idx + 1}`), url: String(img?.url || ''), alt: String(img?.alt || body.name || 'Product'), isPrimary: !!img?.isPrimary || idx === 0 };
          }).filter((img: any) => img.url);
        }
        if ((!body.images || body.images.length === 0) && body.thumbnail) {
          body.images = [{ id: 'img-1', url: String(body.thumbnail), alt: body.name || 'Product', isPrimary: true }];
        }
        if (body.mrp == null && body.price != null) body.mrp = body.price;
        if (body.status == null) body.status = (Number(body.stock || 0) > 0 ? 'PUBLISHED' : 'OUT_OF_STOCK');

        // Normalize specifications to Record<string,string> (admin UI may send nested groups)
        if (body.specifications && typeof body.specifications === 'object' && !Array.isArray(body.specifications)) {
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(body.specifications as Record<string, any>)) {
            if (v == null) continue;
            if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
              flat[String(k)] = String(v);
            } else if (typeof v === 'object' && !Array.isArray(v)) {
              let added = false;
              for (const [nk, nv] of Object.entries(v as Record<string, any>)) {
                if (nv == null) continue;
                flat[String(nk)] = (typeof nv === 'object') ? JSON.stringify(nv) : String(nv);
                added = true;
              }
              if (!added) flat[String(k)] = JSON.stringify(v);
            } else {
              flat[String(k)] = Array.isArray(v) ? v.join(', ') : JSON.stringify(v);
            }
          }
          body.specifications = flat;
        }

        // categoryId/brandId are ObjectId refs in DB; omit non-ObjectId values (e.g. UI slugs)
        const oid = /^[a-f\d]{24}$/i;
        if (body.categoryId != null && !oid.test(String(body.categoryId).trim())) delete body.categoryId;
        if (body.brandId != null && !oid.test(String(body.brandId).trim())) delete body.brandId;

        const parsed = createProductSchema.safeParse(body);
        if (!parsed.success) {
          const details = parsed.error.flatten().fieldErrors as Record<string, string[]>;
          const first = Object.values(details).flat().find(Boolean);
          return NextResponse.json({
            success: false,
            message: first ? `Invalid request body: ${first}` : 'Invalid request body.',
            error: { code: 'VALIDATION_ERROR', details },
            timestamp: new Date().toISOString(),
          }, { status: HTTP_STATUS.UNPROCESSABLE_ENTITY });
        }

        const product = await createProduct(authReq.user.id, parsed.data);
        return NextResponse.json(
          createSuccessResponse(
            { id: (product as any).id || (product as any)._id?.toString?.(), slug: (product as any).slug },
            { message: 'Product created successfully.', statusCode: HTTP_STATUS.CREATED },
          ),
          { status: HTTP_STATUS.CREATED },
        );
      } catch (error: unknown) {
        console.error('[products POST] Failed to create product:', error);
        if (error && typeof error === 'object' && (error as any).code === 11000) {
          const field = Object.keys((error as any).keyPattern || (error as any).keyValue || {})[0] || 'field';
          return NextResponse.json(
            createErrorResponse(`A product with this ${field} already exists.`, { statusCode: HTTP_STATUS.CONFLICT, code: 'CONFLICT' }),
            { status: HTTP_STATUS.CONFLICT },
          );
        }
        if (error instanceof Error) {
          if (error.message.includes('already exists') || error.message.includes('slug') || error.message.includes('SKU')) {
            return NextResponse.json(createErrorResponse(error.message, { statusCode: HTTP_STATUS.CONFLICT, code: 'CONFLICT' }), { status: HTTP_STATUS.CONFLICT });
          }
          if (error.message.includes('not found')) {
            return NextResponse.json(createErrorResponse(error.message, { statusCode: HTTP_STATUS.NOT_FOUND, code: 'NOT_FOUND' }), { status: HTTP_STATUS.NOT_FOUND });
          }
          return NextResponse.json(
            createErrorResponse(process.env.NODE_ENV === 'production' ? 'Failed to create product.' : `Failed to create product: ${error.message}`, { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, code: 'PRODUCT_CREATE_FAILED' }),
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
          );
        }
        return NextResponse.json(createErrorResponse('Failed to create product.', { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, code: 'PRODUCT_CREATE_FAILED' }), { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
      }
    },
  ),
);

/**
 * GET /api/v1/products
 * List products with filtering, sorting, pagination.
 * Public endpoint - optional sellerId filter for vendor isolation.
 */
export const GET = withDatabase(
  withOptionalAuth(
    async (authReq) => {
      const url = new URL(authReq.url);
      const search = url.searchParams.get('search') || undefined;
      const category = url.searchParams.get('category') || undefined;
      const categoryId = url.searchParams.get('categoryId') || undefined;
      const brand = url.searchParams.get('brand') || undefined;
      const brandId = url.searchParams.get('brandId') || undefined;
      const status = url.searchParams.get('status') || undefined;
      const stock = url.searchParams.get('stock') || undefined;
      const sellerId = url.searchParams.get('sellerId') || undefined;
      const sortBy = url.searchParams.get('sortBy') || undefined;
      const page = url.searchParams.get('page') || '1';
      const limit = url.searchParams.get('limit') || '20';
      const slug = url.searchParams.get('slug') || undefined;
      const isAssured = url.searchParams.get('isAssured') || undefined;
      const minPrice = url.searchParams.get('minPrice') || undefined;
      const maxPrice = url.searchParams.get('maxPrice') || undefined;
      const minRating = url.searchParams.get('minRating') || undefined;
      const minDiscount = url.searchParams.get('minDiscount') || undefined;
      const inStock = url.searchParams.get('inStock') || undefined;

      // If slug is provided, return single product
      if (slug) {
        try {
          const product = await getProductBySlug(slug, { publicOnly: true });
          if (!product) {
            return NextResponse.json(
              createErrorResponse('Product not found.', {
                statusCode: HTTP_STATUS.NOT_FOUND,
                code: 'PRODUCT_NOT_FOUND',
              }),
              { status: HTTP_STATUS.NOT_FOUND },
            );
          }
          return NextResponse.json(
            createSuccessResponse(
              {
                id: product.id,
                title: product.name,
                slug: product.slug,
                sku: product.sku,
                barcode: product.barcode || '',
                category: product.category,
                categoryId: product.categoryId?.toString() || '',
                categoryName: product.category,
                categorySlug: product.category.toLowerCase().replace(/\s+/g, '-'),
                subcategory: product.subcategory || '',
                brand: product.brand || '',
                brandId: product.brandId?.toString() || '',
                brandName: product.brand || '',
                description: product.description,
                shortDescription: product.shortDescription || '',
                highlights: product.highlights || [],
                specifications: product.specifications || {},
                price: product.price,
                mrp: product.mrp,
                discountPercentage: product.discountPercentage,
                taxPercentage: product.taxPercentage,
                stock: product.stock,
                lowStockThreshold: product.lowStockThreshold,
                status: product.status,
                approvalStatus: (product as any).approvalStatus,
                productStatus: (product as any).productStatus,
                rejectionReason: (product as any).rejectionReason || '',
                adminComment: (product as any).adminComment || '',
                submittedAt: (product as any).submittedAt || null,
                reviewedAt: (product as any).reviewedAt || null,
                approvedAt: (product as any).approvedAt || null,
                images: product.images.map((img) => ({
                  id: img.id,
                  url: img.url,
                  alt: img.alt,
                  isPrimary: img.isPrimary,
                })),
                thumbnail: product.images.find((img) => img.isPrimary)?.url ||
                  product.images[0]?.url ||
                  '',
                variants: (product.variants || []).map((v) => ({
                  id: v.id,
                  productId: v.productId,
                  sku: v.sku,
                  size: v.size,
                  color: v.color,
                  price: v.price,
                  mrp: v.mrp,
                  stock: v.stock,
                  weight: v.weight,
                })),
                seoTitle: product.seoTitle,
                seoDescription: product.seoDescription,
                unitsSold: product.unitsSold,
                totalRevenue: product.totalRevenue,
                rating: product.rating,
                reviewCount: product.reviewCount,
                isAssured: product.isAssured,
                isFreeDelivery: product.isFreeDelivery,
                estimatedDeliveryDays: product.estimatedDeliveryDays,
                returnPolicy: (product as any).returnPolicy || '',
                returnWindowDays: (product as any).returnWindowDays ?? 7,
                isReturnable: (product as any).isReturnable ?? true,
                sellerId: product.sellerId.toString(),
                inStock: product.stock > 0,
                createdAt: product.createdAt,
                updatedAt: product.updatedAt,
              },
              { message: 'Product retrieved.', statusCode: HTTP_STATUS.OK },
            ),
            { status: HTTP_STATUS.OK },
          );
        } catch {
          return NextResponse.json(
            createErrorResponse('Failed to fetch product.', {
              statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
              code: 'PRODUCT_FETCH_FAILED',
            }),
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
          );
        }
      }

      try {
        const role = String(authReq.user?.role || '').toLowerCase();
        const isAdmin = role === 'admin' || role === 'super_admin';
        const adminView = isAdmin && (url.searchParams.get('scope') === 'all' || url.searchParams.get('adminView') === 'true' || !!status || !!url.searchParams.get('approvalStatus') || !!url.searchParams.get('productStatus') || !!sellerId);
        const approvalStatus = url.searchParams.get('approvalStatus') || undefined;
        const productStatus = url.searchParams.get('productStatus') || undefined;
        const result = await getProducts(
          {
            search,
            category,
            categoryId,
            brand,
            brandId,
            status: status as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            approvalStatus,
            productStatus,
            stock: stock as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            sellerId,
            sortBy: sortBy as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            page,
            limit,
            isAssured,
            minPrice,
            maxPrice,
            minRating,
            minDiscount,
            inStock,
          } as any,
          undefined,
          { adminView, publicOnly: !adminView },
        );

        return NextResponse.json(
          createSuccessResponse(
            result.data.map((p) => ({
              id: p.id,
              title: p.name,
              slug: p.slug,
              sku: p.sku,
              barcode: p.barcode || '',
              category: p.category,
              categoryId: p.categoryId?.toString() || '',
              categoryName: p.category,
              categorySlug: p.category.toLowerCase().replace(/\s+/g, '-'),
              subcategory: p.subcategory || '',
              brand: p.brand || '',
              brandId: p.brandId?.toString() || '',
              brandName: p.brand || '',
              description: p.description,
              shortDescription: p.shortDescription || '',
              highlights: p.highlights || [],
              specifications: p.specifications || {},
              price: p.price,
              mrp: p.mrp,
              discountPercentage: p.discountPercentage,
              taxPercentage: p.taxPercentage,
              stock: p.stock,
              lowStockThreshold: p.lowStockThreshold,
              status: p.status,
              approvalStatus: (p as any).approvalStatus,
              productStatus: (p as any).productStatus,
              rejectionReason: (p as any).rejectionReason || '',
              adminComment: (p as any).adminComment || '',
              submittedAt: (p as any).submittedAt || null,
              reviewedAt: (p as any).reviewedAt || null,
              approvedAt: (p as any).approvedAt || null,
              images: p.images.map((img) => ({
                id: img.id,
                url: img.url,
                alt: img.alt,
                isPrimary: img.isPrimary,
              })),
              thumbnail:
                p.images.find((img) => img.isPrimary)?.url || p.images[0]?.url || '',
              variants: (p.variants || []).map((v) => ({
                id: v.id,
                productId: v.productId,
                sku: v.sku,
                size: v.size,
                color: v.color,
                price: v.price,
                mrp: v.mrp,
                stock: v.stock,
                weight: v.weight,
              })),
              seoTitle: p.seoTitle,
              seoDescription: p.seoDescription,
              unitsSold: p.unitsSold,
              totalRevenue: p.totalRevenue,
              rating: p.rating,
              reviewCount: p.reviewCount,
              isAssured: p.isAssured,
              isFreeDelivery: p.isFreeDelivery,
              estimatedDeliveryDays: p.estimatedDeliveryDays,
              sellerId: p.sellerId.toString(),
              inStock: p.stock > 0,
              createdAt: p.createdAt,
              updatedAt: p.updatedAt,
            })),
            {
              message: 'Products retrieved.',
              statusCode: HTTP_STATUS.OK,
              meta: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
                hasMore: result.hasMore,
              },
            },
          ),
          { status: HTTP_STATUS.OK },
        );
      } catch (error: unknown) {
        console.error('[products GET] Failed to fetch products:', error);
        const msg = error instanceof Error ? error.message : 'Failed to fetch products.';
        return NextResponse.json(
          createErrorResponse(
            process.env.NODE_ENV === 'production' ? 'Failed to fetch products.' : `Failed to fetch products: ${msg}`,
            {
              statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
              code: 'PRODUCTS_FETCH_FAILED',
            },
          ),
          { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
        );
      }
    })
  )
;

/**
 * GET /api/v1/products/:id
 * Get product by ID.
 */
export const productIdGET = withDatabase(
  withOptionalAuth(
    async (authReq) => {
      const url = new URL(authReq.url);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      const productId = pathSegments[pathSegments.length - 1] === 'publish'
        ? pathSegments[pathSegments.length - 2]
        : pathSegments[pathSegments.length - 1];

      const paramResult = productIdParamSchema.safeParse({ id: productId });
      if (!paramResult.success) {
        return NextResponse.json(
          createErrorResponse('Invalid product ID.', {
            statusCode: HTTP_STATUS.BAD_REQUEST,
            code: 'INVALID_PRODUCT_ID',
          }),
          { status: HTTP_STATUS.BAD_REQUEST },
        );
      }

      try {
        const role = String(authReq.user?.role || '').toLowerCase();
        const isAdmin = role === 'admin' || role === 'super_admin';
        const product = isAdmin
          ? await getProductById(productId)
          : await getProductById(productId, undefined, { publicOnly: true });
        if (!product) {
          return NextResponse.json(
            createErrorResponse('Product not found.', {
              statusCode: HTTP_STATUS.NOT_FOUND,
              code: 'PRODUCT_NOT_FOUND',
            }),
            { status: HTTP_STATUS.NOT_FOUND },
          );
        }
        return NextResponse.json(
          createSuccessResponse(
            {
              id: product.id,
              title: product.name,
              slug: product.slug,
              sku: product.sku,
              barcode: product.barcode || '',
              category: product.category,
              categoryId: product.categoryId?.toString() || '',
              categoryName: product.category,
              categorySlug: product.category.toLowerCase().replace(/\s+/g, '-'),
              subcategory: product.subcategory || '',
              brand: product.brand || '',
              brandId: product.brandId?.toString() || '',
              brandName: product.brand || '',
              description: product.description,
              shortDescription: product.shortDescription || '',
              highlights: product.highlights || [],
              specifications: product.specifications || {},
              price: product.price,
              mrp: product.mrp,
              discountPercentage: product.discountPercentage,
              taxPercentage: product.taxPercentage,
              stock: product.stock,
              lowStockThreshold: product.lowStockThreshold,
              status: product.status,
              approvalStatus: (product as any).approvalStatus,
              productStatus: (product as any).productStatus,
              rejectionReason: (product as any).rejectionReason || '',
              adminComment: (product as any).adminComment || '',
              images: product.images.map((img) => ({
                id: img.id,
                url: img.url,
                alt: img.alt,
                isPrimary: img.isPrimary,
              })),
              thumbnail:
                product.images.find((img) => img.isPrimary)?.url ||
                product.images[0]?.url ||
                '',
              variants: (product.variants || []).map((v) => ({
                id: v.id,
                productId: v.productId,
                sku: v.sku,
                size: v.size,
                color: v.color,
                price: v.price,
                mrp: v.mrp,
                stock: v.stock,
                weight: v.weight,
              })),
              seoTitle: product.seoTitle,
              seoDescription: product.seoDescription,
              unitsSold: product.unitsSold,
              totalRevenue: product.totalRevenue,
              rating: product.rating,
              reviewCount: product.reviewCount,
              isAssured: product.isAssured,
              isFreeDelivery: product.isFreeDelivery,
              estimatedDeliveryDays: product.estimatedDeliveryDays,
              returnPolicy: (product as any).returnPolicy || '',
              returnWindowDays: (product as any).returnWindowDays ?? 7,
              isReturnable: (product as any).isReturnable ?? true,
              sellerId: product.sellerId.toString(),
              inStock: product.stock > 0,
              createdAt: product.createdAt,
              updatedAt: product.updatedAt,
            },
            { message: 'Product retrieved.', statusCode: HTTP_STATUS.OK },
          ),
          { status: HTTP_STATUS.OK },
        );
      } catch (error: unknown) {
        return NextResponse.json(
          createErrorResponse('Failed to fetch product.', {
            statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            code: 'PRODUCT_FETCH_FAILED',
          }),
          { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
        );
      }
    })
  )
;

/**
 * PATCH /api/v1/products/:id
export const productUpdateHandler = withDatabase(
  withAuth(
    async (authReq) => {
      if (!authReq.user) {
        return NextResponse.json(
          createErrorResponse('Authentication required.', {
            statusCode: HTTP_STATUS.UNAUTHORIZED,
            code: 'AUTH_REQUIRED',
            requestId: authReq.requestId,
          }),
          { status: HTTP_STATUS.UNAUTHORIZED },
        );
      }
      const role = String(authReq.user.role || '').toLowerCase();
      if (role !== 'vendor' && role !== 'admin' && role !== 'super_admin') {
        return NextResponse.json(createErrorResponse('Insufficient permissions.', { statusCode: HTTP_STATUS.FORBIDDEN, code: 'INSUFFICIENT_PERMISSIONS', requestId: authReq.requestId }), { status: HTTP_STATUS.FORBIDDEN });
      }

      const url = new URL(authReq.url);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      const productId = pathSegments[pathSegments.length - 1] === 'publish'
        ? pathSegments[pathSegments.length - 2]
        : pathSegments[pathSegments.length - 1];

      const paramResult = productIdParamSchema.safeParse({ id: productId });
      if (!paramResult.success) {
        return NextResponse.json(
          createErrorResponse('Invalid product ID.', {
            statusCode: HTTP_STATUS.BAD_REQUEST,
            code: 'INVALID_PRODUCT_ID',
          }),
          { status: HTTP_STATUS.BAD_REQUEST },
        );
      }

      const result = await validateRequestBody(
        authReq as unknown as NextRequest,
        updateProductSchema,
      );
      if ('error' in result) {
        return NextResponse.json(result.error.response, {
          status: result.error.statusCode,
        });
      }

      try {
        const product = await updateProduct(
          productId,
          authReq.user.id,
          result.data,
        );
        if (!product) {
          return NextResponse.json(
            createErrorResponse('Product not found.', {
              statusCode: HTTP_STATUS.NOT_FOUND,
              code: 'PRODUCT_NOT_FOUND',
            }),
            { status: HTTP_STATUS.NOT_FOUND },
          );
        }
        return NextResponse.json(
          createSuccessResponse(
            { id: product.id, slug: product.slug },
            { message: 'Product updated successfully.', statusCode: HTTP_STATUS.OK },
          ),
          { status: HTTP_STATUS.OK },
        );
      } catch (error: unknown) {
        if (error instanceof Error) {
          if (
            error.message.includes('already exists') ||
            error.message.includes('slug')
          ) {
            return NextResponse.json(
              createErrorResponse(error.message, {
                statusCode: HTTP_STATUS.CONFLICT,
                code: 'CONFLICT',
              }),
              { status: HTTP_STATUS.CONFLICT },
            );
          }
          if (error.message.includes('not found')) {
            return NextResponse.json(
              createErrorResponse(error.message, {
                statusCode: HTTP_STATUS.NOT_FOUND,
                code: 'NOT_FOUND',
              }),
              { status: HTTP_STATUS.NOT_FOUND },
            );
          }
        }
        return NextResponse.json(
          createErrorResponse('Failed to update product.', {
            statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            code: 'PRODUCT_UPDATE_FAILED',
          }),
          { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
        );
      }
    },
  ),
);

/**
 * DELETE /api/v1/products/:id
 * Delete a product (vendor or admin).
 */
export const productIdDELETE = withDatabase(
  withAuth(
    async (authReq) => {
      if (!authReq.user) {
        return NextResponse.json(
          createErrorResponse('Authentication required.', {
            statusCode: HTTP_STATUS.UNAUTHORIZED,
            code: 'AUTH_REQUIRED',
            requestId: authReq.requestId,
          }),
          { status: HTTP_STATUS.UNAUTHORIZED },
        );
      }
      const role = String(authReq.user.role || '').toLowerCase();
      if (role !== 'vendor' && role !== 'admin' && role !== 'super_admin') {
        return NextResponse.json(createErrorResponse('Insufficient permissions.', { statusCode: HTTP_STATUS.FORBIDDEN, code: 'INSUFFICIENT_PERMISSIONS', requestId: authReq.requestId }), { status: HTTP_STATUS.FORBIDDEN });
      }

      const url = new URL(authReq.url);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      const productId = pathSegments[pathSegments.length - 1] === 'publish'
        ? pathSegments[pathSegments.length - 2]
        : pathSegments[pathSegments.length - 1];

      const paramResult = productIdParamSchema.safeParse({ id: productId });
      if (!paramResult.success) {
        return NextResponse.json(
          createErrorResponse('Invalid product ID.', {
            statusCode: HTTP_STATUS.BAD_REQUEST,
            code: 'INVALID_PRODUCT_ID',
          }),
          { status: HTTP_STATUS.BAD_REQUEST },
        );
      }

      try {
        const deleted = await deleteProduct(productId, authReq.user.id);
        if (!deleted) {
          return NextResponse.json(
            createErrorResponse('Product not found.', {
              statusCode: HTTP_STATUS.NOT_FOUND,
              code: 'PRODUCT_NOT_FOUND',
            }),
            { status: HTTP_STATUS.NOT_FOUND },
          );
        }
        return NextResponse.json(
          createSuccessResponse(null, {
            message: 'Product deleted successfully.',
            statusCode: HTTP_STATUS.OK,
          }),
          { status: HTTP_STATUS.OK },
        );
      } catch (error: unknown) {
        return NextResponse.json(
          createErrorResponse('Failed to delete product.', {
            statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            code: 'PRODUCT_DELETE_FAILED',
          }),
          { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
        );
      }
    },
  ),
);

/**
 * PATCH /api/v1/products/:id/publish
 * Publish or unpublish a product (vendor or admin).
 */
export const productIdPublishPATCH = withDatabase(
  withAuth(
    async (authReq) => {
      if (!authReq.user) {
        return NextResponse.json(
          createErrorResponse('Authentication required.', {
            statusCode: HTTP_STATUS.UNAUTHORIZED,
            code: 'AUTH_REQUIRED',
            requestId: authReq.requestId,
          }),
          { status: HTTP_STATUS.UNAUTHORIZED },
        );
      }
      const role = String(authReq.user.role || '').toLowerCase();
      if (role !== 'vendor' && role !== 'admin' && role !== 'super_admin') {
        return NextResponse.json(createErrorResponse('Insufficient permissions.', { statusCode: HTTP_STATUS.FORBIDDEN, code: 'INSUFFICIENT_PERMISSIONS', requestId: authReq.requestId }), { status: HTTP_STATUS.FORBIDDEN });
      }

      const url = new URL(authReq.url);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      const productId = pathSegments[pathSegments.length - 1] === 'publish'
        ? pathSegments[pathSegments.length - 2]
        : pathSegments[pathSegments.length - 1];

      const paramResult = productIdParamSchema.safeParse({ id: productId });
      if (!paramResult.success) {
        return NextResponse.json(
          createErrorResponse('Invalid product ID.', {
            statusCode: HTTP_STATUS.BAD_REQUEST,
            code: 'INVALID_PRODUCT_ID',
          }),
          { status: HTTP_STATUS.BAD_REQUEST },
        );
      }

      const body = await (authReq as unknown as NextRequest).json();
      const { publish } = body;
      if (typeof publish !== 'boolean') {
        return NextResponse.json(
          createErrorResponse('publish field (boolean) is required.', {
            statusCode: HTTP_STATUS.BAD_REQUEST,
            code: 'INVALID_PUBLISH_FIELD',
          }),
          { status: HTTP_STATUS.BAD_REQUEST },
        );
      }

      try {
        const product = await publishProduct(
          productId,
          authReq.user.id,
          publish,
        );
        if (!product) {
          return NextResponse.json(
            createErrorResponse('Product not found.', {
              statusCode: HTTP_STATUS.NOT_FOUND,
              code: 'PRODUCT_NOT_FOUND',
            }),
            { status: HTTP_STATUS.NOT_FOUND },
          );
        }
        return NextResponse.json(
          createSuccessResponse(
            {
              id: product.id,
              status: product.status,
            },
            {
              message: `Product ${
                product.status === 'PUBLISHED' ? 'published' : 'unpublished'
              } successfully.`,
              statusCode: HTTP_STATUS.OK,
            },
          ),
          { status: HTTP_STATUS.OK },
        );
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes('not found')) {
          return NextResponse.json(
            createErrorResponse(error.message, {
              statusCode: HTTP_STATUS.NOT_FOUND,
              code: 'NOT_FOUND',
            }),
            { status: HTTP_STATUS.NOT_FOUND },
          );
        }
        return NextResponse.json(
          createErrorResponse('Failed to update product status.', {
            statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            code: 'PRODUCT_PUBLISH_FAILED',
          }),
          { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
        );
      }
    },
  ),
);
