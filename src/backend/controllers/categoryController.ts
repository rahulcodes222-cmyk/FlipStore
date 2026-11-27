/**
 * Category Controller
 * Handles HTTP request/response for category endpoints.
 * Delegates business logic to categoryService.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createCategory,
  getCategoryById,
  getCategoryBySlug,
  getCategories,
  updateCategory,
  deleteCategory,
} from '@/backend/services/categoryService';
import { withDatabase } from '@/backend/middleware/connectDb';
import { withAuth } from '@/backend/middleware/auth';
import { withRole } from '@/backend/middleware/rbac';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryQuerySchema,
  categoryIdParamSchema,
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
 * POST /api/v1/categories
 * Create a new category (admin only).
 */
export const POST = withDatabase(
  withAuth(
    withRole(USER_ROLES.ADMIN)(async (authReq) => {
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

      // Normalize common admin UI payload shapes before validation
      try {
        const raw = await (authReq as unknown as NextRequest).clone().json().catch(() => ({}));
        const normalized: any = { ...(raw || {}) };
        if (typeof normalized.name === 'string') normalized.name = normalized.name.trim();
        if (typeof normalized.slug === 'string') normalized.slug = normalized.slug.trim().toLowerCase();
        if (normalized.slug === '') delete normalized.slug;
        if (typeof normalized.description === 'string') normalized.description = normalized.description.trim();
        if (typeof normalized.image === 'string') {
          normalized.image = normalized.image.trim();
          if (normalized.image === '') delete normalized.image;
        }
        if (typeof normalized.icon === 'string') {
          normalized.icon = normalized.icon.trim();
          if (normalized.icon === '') delete normalized.icon;
        }
        // re-create request body for downstream validation by monkey-patching json? easier: validate normalized directly
        const parsed = createCategorySchema.safeParse(normalized);
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
        (authReq as any).__validatedCategoryBody = parsed.data;
      } catch (e) {
        return NextResponse.json({
          success: false,
          message: 'Invalid request body.',
          error: { code: 'VALIDATION_ERROR', details: {} },
          timestamp: new Date().toISOString(),
        }, { status: HTTP_STATUS.UNPROCESSABLE_ENTITY });
      }

      const result = { data: (authReq as any).__validatedCategoryBody } as { data: any };

      try {
        const category: any = await createCategory(result.data);
        return NextResponse.json(
          createSuccessResponse(
            {
              id: String(category.id || category._id || ''),
              name: category.name,
              slug: category.slug,
              description: category.description || '',
              image: category.image || '',
              icon: category.icon || '',
              parentId: category.parentId?.toString?.() || category.parentId || null,
              itemCount: category.itemCount || 0,
              isFeatured: !!category.isFeatured,
              isActive: category.isActive !== false,
              createdAt: category.createdAt,
              updatedAt: category.updatedAt,
            },
            { message: 'Category created successfully.', statusCode: HTTP_STATUS.CREATED },
          ),
          { status: HTTP_STATUS.CREATED },
        );
      } catch (error: unknown) {
        console.error('[categories POST] Failed to create category:', error);
        if (error && typeof error === 'object' && (error as any).code === 11000) {
          const field = Object.keys((error as any).keyPattern || (error as any).keyValue || {})[0] || 'field';
          return NextResponse.json(
            createErrorResponse(`A category with this ${field} already exists.`, {
              statusCode: HTTP_STATUS.CONFLICT,
              code: 'CONFLICT',
            }),
            { status: HTTP_STATUS.CONFLICT },
          );
        }
        if (error instanceof Error) {
          if (error.message.includes('already exists') || error.message.includes('slug')) {
            return NextResponse.json(
              createErrorResponse(error.message, { statusCode: HTTP_STATUS.CONFLICT, code: 'CONFLICT' }),
              { status: HTTP_STATUS.CONFLICT },
            );
          }
          if (error.message.includes('not found')) {
            return NextResponse.json(
              createErrorResponse(error.message, { statusCode: HTTP_STATUS.NOT_FOUND, code: 'NOT_FOUND' }),
              { status: HTTP_STATUS.NOT_FOUND },
            );
          }
          return NextResponse.json(
            createErrorResponse(
              process.env.NODE_ENV === 'production' ? 'Failed to create category.' : `Failed to create category: ${error.message}`,
              { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, code: 'CATEGORY_CREATE_FAILED' },
            ),
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
          );
        }
        return NextResponse.json(
          createErrorResponse('Failed to create category.', { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, code: 'CATEGORY_CREATE_FAILED' }),
          { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
        );
      }
    }),
  ),
);

/**
 * GET /api/v1/categories
 * List categories with filtering and pagination.
 * Public endpoint.
 */
export const GET = withDatabase(
  async (req: NextRequest) => {
    const url = new URL(req.url);
    const parentId = url.searchParams.get('parentId') || undefined;
    const isFeatured = url.searchParams.get('isFeatured') || undefined;
    const isActive = url.searchParams.get('isActive') || undefined;
    const page = url.searchParams.get('page') || '1';
    const limit = url.searchParams.get('limit') || '20';

    try {
      const result = await getCategories({
        parentId,
        isFeatured: isFeatured ? isFeatured === 'true' : undefined,
        isActive: isActive ? isActive === 'true' : undefined,
        page,
        limit,
      });

      return NextResponse.json(
        createSuccessResponse(
          result.data.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description || '',
            image: c.image || '',
            icon: c.icon || '',
            parentId: c.parentId,
            itemCount: c.itemCount || 0,
            isFeatured: c.isFeatured,
            isActive: c.isActive,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
          })),
          {
            message: 'Categories retrieved.',
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
      console.error('[categories GET] Failed to fetch categories:', error);
      const msg = error instanceof Error ? error.message : 'Failed to fetch categories.';
      return NextResponse.json(
        createErrorResponse(
          process.env.NODE_ENV === 'production' ? 'Failed to fetch categories.' : `Failed to fetch categories: ${msg}`,
          {
            statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            code: 'CATEGORIES_FETCH_FAILED',
          },
        ),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
      );
    }
  },
);

/**
 * PATCH /api/v1/categories/:id
 * Update a category (admin only).
 */
export const categoryIdPATCH = withDatabase(
  withAuth(
    withRole(USER_ROLES.ADMIN)(async (authReq) => {
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

      const url = new URL(authReq.url);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      const categoryId = pathSegments[pathSegments.length - 1];

      const paramResult = categoryIdParamSchema.safeParse({ id: categoryId });
      if (!paramResult.success) {
        return NextResponse.json(
          createErrorResponse('Invalid category ID.', {
            statusCode: HTTP_STATUS.BAD_REQUEST,
            code: 'INVALID_CATEGORY_ID',
          }),
          { status: HTTP_STATUS.BAD_REQUEST },
        );
      }

      const result = await validateRequestBody(
        authReq as unknown as NextRequest,
        updateCategorySchema,
      );
      if ('error' in result) {
        return NextResponse.json(result.error.response, {
          status: result.error.statusCode,
        });
      }

      try {
        const category = await updateCategory(categoryId, result.data);
        if (!category) {
          return NextResponse.json(
            createErrorResponse('Category not found.', {
              statusCode: HTTP_STATUS.NOT_FOUND,
              code: 'CATEGORY_NOT_FOUND',
            }),
            { status: HTTP_STATUS.NOT_FOUND },
          );
        }
        return NextResponse.json(
          createSuccessResponse(
            {
              id: category.id,
              name: category.name,
              slug: category.slug,
              description: category.description || '',
              image: category.image || '',
              icon: category.icon || '',
              parentId: category.parentId?.toString?.() || category.parentId || null,
              itemCount: category.itemCount || 0,
              isFeatured: category.isFeatured,
              isActive: category.isActive,
              createdAt: category.createdAt,
              updatedAt: category.updatedAt,
            },
            { message: 'Category updated successfully.', statusCode: HTTP_STATUS.OK },
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
          createErrorResponse('Failed to update category.', {
            statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            code: 'CATEGORY_UPDATE_FAILED',
          }),
          { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
        );
      }
    }),
  ),
);

/**
 * DELETE /api/v1/categories/:id
 * Delete a category (admin only).
 */
export const categoryIdDELETE = withDatabase(
  withAuth(
    withRole(USER_ROLES.ADMIN)(async (authReq) => {
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

      const url = new URL(authReq.url);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      const categoryId = pathSegments[pathSegments.length - 1];

      const paramResult = categoryIdParamSchema.safeParse({ id: categoryId });
      if (!paramResult.success) {
        return NextResponse.json(
          createErrorResponse('Invalid category ID.', {
            statusCode: HTTP_STATUS.BAD_REQUEST,
            code: 'INVALID_CATEGORY_ID',
          }),
          { status: HTTP_STATUS.BAD_REQUEST },
        );
      }

      const reassignTo = url.searchParams.get('reassignTo') || undefined;

      try {
        const deleted = await deleteCategory(categoryId, reassignTo);
        if (!deleted) {
          return NextResponse.json(
            createErrorResponse('Category not found.', {
              statusCode: HTTP_STATUS.NOT_FOUND,
              code: 'CATEGORY_NOT_FOUND',
            }),
            { status: HTTP_STATUS.NOT_FOUND },
          );
        }
        return NextResponse.json(
          createSuccessResponse(null, {
            message: 'Category deleted successfully.',
            statusCode: HTTP_STATUS.OK,
          }),
          { status: HTTP_STATUS.OK },
        );
      } catch (error: unknown) {
        if (error instanceof Error) {
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
          createErrorResponse('Failed to delete category.', {
            statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            code: 'CATEGORY_DELETE_FAILED',
          }),
          { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
        );
      }
    }),
  ),
);
