import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withDatabase } from '@/backend/middleware/connectDb';
import { withAuth } from '@/backend/middleware/auth';
import { withRole } from '@/backend/middleware/rbac';
import { USER_ROLES } from '@/backend/constants/roles';
import { HTTP_STATUS } from '@/backend/constants';
import { createErrorResponse, createSuccessResponse } from '@/backend/utils/response';
import {
  adminProductApprovalListQuerySchema,
  adminProductApproveSchema,
  adminProductRejectSchema,
  adminProductRequestChangesSchema,
} from '@/backend/validations/adminProductApproval.schema';
import {
  approveProductByAdmin,
  getAdminProductApprovalById,
  listAdminProductApprovals,
  rejectProductByAdmin,
  requestProductChangesByAdmin,
} from '@/backend/services/adminProductApprovalService';

function parseQuery(req: NextRequest) {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const result = adminProductApprovalListQuerySchema.safeParse(params);
  if (!result.success) {
    return { error: NextResponse.json(createErrorResponse('Invalid query parameters.', { statusCode: HTTP_STATUS.BAD_REQUEST, code: 'VALIDATION_ERROR', details: result.error.flatten().fieldErrors as Record<string, string[]> }), { status: HTTP_STATUS.BAD_REQUEST }) } as const;
  }
  return { data: result.data } as const;
}

async function parseBody<T>(req: NextRequest, schema: z.ZodSchema<T>) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body ?? {});
    if (!parsed.success) {
      return { error: NextResponse.json(createErrorResponse('Invalid request body.', { statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY, code: 'VALIDATION_ERROR', details: parsed.error.flatten().fieldErrors as Record<string, string[]> }), { status: HTTP_STATUS.UNPROCESSABLE_ENTITY }) } as const;
    }
    return { data: parsed.data } as const;
  } catch {
    return { error: NextResponse.json(createErrorResponse('Invalid request body.', { statusCode: HTTP_STATUS.BAD_REQUEST, code: 'INVALID_JSON' }), { status: HTTP_STATUS.BAD_REQUEST }) } as const;
  }
}

function getProductIdFromUrl(url: string, fromEnd = 1) {
  const parts = new URL(url).pathname.split('/').filter(Boolean);
  return parts[parts.length - fromEnd] || '';
}

function err(error: unknown, fallback: string) {
  const msg = error instanceof Error ? error.message : fallback;
  const lower = msg.toLowerCase();
  const status = lower.includes('not found') ? HTTP_STATUS.NOT_FOUND : lower.includes('invalid') || lower.includes('required') || lower.includes('cannot') ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const code = status === HTTP_STATUS.NOT_FOUND ? 'NOT_FOUND' : status === HTTP_STATUS.BAD_REQUEST ? 'VALIDATION_ERROR' : 'ADMIN_PRODUCT_APPROVAL_ERROR';
  return NextResponse.json(createErrorResponse(msg, { statusCode: status, code }), { status });
}

export const adminProductApprovalsGET = withDatabase(withAuth(withRole(USER_ROLES.ADMIN)(async (authReq): Promise<NextResponse> => {
  const q = parseQuery(authReq as unknown as NextRequest);
  if ('error' in q) return q.error as NextResponse;
  try {
    return NextResponse.json(createSuccessResponse(await listAdminProductApprovals(q.data), { message: 'Product approvals fetched.' }));
  } catch (error) {
    return err(error, 'Failed to fetch product approvals.');
  }
})));

export const adminProductApprovalByIdGET = withDatabase(withAuth(withRole(USER_ROLES.ADMIN)(async (authReq): Promise<NextResponse> => {
  const id = getProductIdFromUrl(authReq.url, 1);
  try {
    return NextResponse.json(createSuccessResponse(await getAdminProductApprovalById(id), { message: 'Product approval detail fetched.' }));
  } catch (error) {
    return err(error, 'Failed to fetch product approval detail.');
  }
})));

export const adminProductApprovePOST = withDatabase(withAuth(withRole(USER_ROLES.ADMIN)(async (authReq): Promise<NextResponse> => {
  const id = getProductIdFromUrl(authReq.url, 2);
  const parsed = await parseBody(authReq as unknown as NextRequest, adminProductApproveSchema);
  if ('error' in parsed) return parsed.error as NextResponse;
  try {
    return NextResponse.json(createSuccessResponse(await approveProductByAdmin(id, authReq.user!.id, parsed.data), { message: 'Product approved.' }));
  } catch (error) {
    return err(error, 'Failed to approve product.');
  }
})));

export const adminProductRejectPOST = withDatabase(withAuth(withRole(USER_ROLES.ADMIN)(async (authReq): Promise<NextResponse> => {
  const id = getProductIdFromUrl(authReq.url, 2);
  const parsed = await parseBody(authReq as unknown as NextRequest, adminProductRejectSchema);
  if ('error' in parsed) return parsed.error as NextResponse;
  try {
    return NextResponse.json(createSuccessResponse(await rejectProductByAdmin(id, authReq.user!.id, parsed.data), { message: 'Product rejected.' }));
  } catch (error) {
    return err(error, 'Failed to reject product.');
  }
})));

export const adminProductRequestChangesPOST = withDatabase(withAuth(withRole(USER_ROLES.ADMIN)(async (authReq): Promise<NextResponse> => {
  const id = getProductIdFromUrl(authReq.url, 2);
  const parsed = await parseBody(authReq as unknown as NextRequest, adminProductRequestChangesSchema);
  if ('error' in parsed) return parsed.error as NextResponse;
  try {
    return NextResponse.json(createSuccessResponse(await requestProductChangesByAdmin(id, authReq.user!.id, parsed.data), { message: 'Product changes requested.' }));
  } catch (error) {
    return err(error, 'Failed to request product changes.');
  }
})));
