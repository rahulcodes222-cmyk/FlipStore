/**
 * GET /api/v1/products/:id - Get product by ID
 * PATCH /api/v1/products/:id - Update a product
 * DELETE /api/v1/products/:id - Delete a product
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  productIdGET,
  productIdDELETE,
} from '@/backend/controllers/productController';
import {
  getProductById,
  updateProduct,
  deleteProduct,
} from '@/backend/services/productService';
import { withDatabase } from '@/backend/middleware/connectDb';
import { withAuth } from '@/backend/middleware/auth';
import { withRole } from '@/backend/middleware/rbac';
import { USER_ROLES } from '@/backend/constants/roles';
import { updateProductSchema, productIdParamSchema } from '@/backend/validations/product.schema';
import { createSuccessResponse, createErrorResponse } from '@/backend/utils/response';
import { HTTP_STATUS } from '@/backend/constants';
import { ProductIdParamInput } from '@/backend/validations/product.schema';

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

export async function GET(req: NextRequest): Promise<NextResponse> {
  return (await productIdGET(req)) as NextResponse;
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  return withDatabase(
    withAuth(async (authReq) => {
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
      const run = async () => {
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
        const pathSegments = url.pathname.split('/');
        const productId = pathSegments[pathSegments.length - 2];

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

        let body: any = {};
        try { body = await (authReq as unknown as NextRequest).clone().json(); } catch { body = {}; }
        if (body && body.specifications && typeof body.specifications === 'object' && !Array.isArray(body.specifications)) {
          const flat: Record<string, string> = {};
          for (const [k, v] of Object.entries(body.specifications as Record<string, any>)) {
            if (v == null) continue;
            if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') flat[String(k)] = String(v);
            else if (typeof v === 'object' && !Array.isArray(v)) {
              let added = false;
              for (const [nk, nv] of Object.entries(v as Record<string, any>)) {
                if (nv == null) continue;
                flat[String(nk)] = (typeof nv === 'object') ? JSON.stringify(nv) : String(nv);
                added = true;
              }
              if (!added) flat[String(k)] = JSON.stringify(v);
            } else flat[String(k)] = Array.isArray(v) ? v.join(', ') : JSON.stringify(v);
          }
          body.specifications = flat;
        }
        if (body && Array.isArray(body.images)) {
          body.images = body.images.map((img: any, idx: number) => typeof img === 'string' ? ({ id: `img-${idx+1}`, url: img, alt: body.name || 'Product', isPrimary: idx===0 }) : ({ id: String(img?.id||`img-${idx+1}`), url: String(img?.url||''), alt: String(img?.alt||body.name||'Product'), isPrimary: !!img?.isPrimary || idx===0 })).filter((i:any)=>i.url);
        }
        if (body && (!body.images || body.images.length===0) && body.thumbnail) body.images = [{id:'img-1',url:String(body.thumbnail),alt:String(body.name||'Product'),isPrimary:true}];
        if (typeof body?.name === 'string') body.name = body.name.trim();
        if (typeof body?.slug === 'string') body.slug = body.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/-+/g,'-').replace(/(^-|-$)/g,'');
        const oid = /^[a-f\d]{24}$/i;
        if (body?.categoryId != null && !oid.test(String(body.categoryId).trim())) delete body.categoryId;
        if (body?.brandId != null && !oid.test(String(body.brandId).trim())) delete body.brandId;

        const parsed = updateProductSchema.safeParse(body);
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
        const result = { data: parsed.data };

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
      };
      return await run();
    }),
  )(req);
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  return (await productIdDELETE(req)) as NextResponse;
}
