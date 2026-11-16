/**
 * GET /api/v1/products/search
 * Search products with text search, filtering, sorting, and pagination.
 * Public endpoint - returns only PUBLISHED products.
 * Supports query parameters: q, category, minPrice, maxPrice, brand, rating, inStock, sort, page, limit
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withDatabase } from '@/backend/middleware/connectDb';
import { searchProducts } from '@/backend/services/productService';
import { productSearchSchema } from '@/backend/validations/product.schema';
import { createSuccessResponse, createErrorResponse } from '@/backend/utils/response';
import { HTTP_STATUS } from '@/backend/constants';

async function validateQueryParams<T>(
  url: URL,
  schema: z.ZodSchema<T>,
): Promise<{ data: T } | { error: { statusCode: number; response: unknown } }> {
  try {
    const raw: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      raw[key] = value;
    });
    const data = schema.parse(raw);
    return { data };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return {
        error: {
          statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY,
          response: {
            success: false,
            message: 'Invalid search parameters.',
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

export const GET = withDatabase(async (req: NextRequest) => {
  const url = new URL(req.url);

  const parsed = await validateQueryParams(url, productSearchSchema);
  if ('error' in parsed) {
    return NextResponse.json(parsed.error.response, {
      status: parsed.error.statusCode,
    });
  }

  try {
    const result = await searchProducts(parsed.data);

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
    return NextResponse.json(
      createErrorResponse('Failed to search products.', {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        code: 'PRODUCT_SEARCH_FAILED',
      }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
});
