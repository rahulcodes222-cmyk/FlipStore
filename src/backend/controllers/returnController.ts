/**
 * Returns Controller (Part 10)
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withDatabase } from '@/backend/middleware/connectDb';
import { withAuth, type AuthenticatedRequest } from '@/backend/middleware/auth';
import { createSuccessResponse, createErrorResponse } from '@/backend/utils/response';
import { HTTP_STATUS } from '@/backend/constants';
import { createReturnRequest, getMyReturns, updateReturnRequest } from '@/backend/services/orderService';
import { createReturnSchema, updateReturnStatusSchema } from '@/backend/validations/order.schema';

function toNextRequest(req: AuthenticatedRequest): NextRequest { return req as unknown as NextRequest; }

async function parseBody<T>(req: NextRequest, schema: z.ZodSchema<T>): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await req.json().catch(() => ({}));
    const data = schema.parse(body ?? {});
    return { data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: NextResponse.json(createErrorResponse('Invalid request body.', { code: 'VALIDATION_ERROR', details: error.flatten().fieldErrors as Record<string, string[]> }), { status: HTTP_STATUS.UNPROCESSABLE_ENTITY }) };
    }
    throw error;
  }
}

function serviceError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  const lower = message.toLowerCase();
  const status = /forbidden/.test(lower) ? HTTP_STATUS.FORBIDDEN : /not found/.test(lower) ? HTTP_STATUS.NOT_FOUND : /invalid|cannot|allowed only|already|not permitted/.test(lower) ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR;
  return NextResponse.json(createErrorResponse(message, { code: status === HTTP_STATUS.FORBIDDEN ? 'FORBIDDEN' : status === HTTP_STATUS.NOT_FOUND ? 'NOT_FOUND' : 'RETURN_ERROR' }), { status });
}

export const returnsPOST = withDatabase(withAuth(async (req: AuthenticatedRequest) => {
  if (!req.user) return NextResponse.json(createErrorResponse('Authentication required.', { code: 'AUTH_REQUIRED' }), { status: HTTP_STATUS.UNAUTHORIZED });
  const parsed = await parseBody(toNextRequest(req), createReturnSchema);
  if ('error' in parsed) return parsed.error;
  try {
    const ret = await createReturnRequest(req.user.id, parsed.data);
    return NextResponse.json(createSuccessResponse(ret, { message: 'Return request created.' }), { status: HTTP_STATUS.CREATED });
  } catch (error) { return serviceError(error, 'Failed to create return request.'); }
}));

export const myReturnsGET = withDatabase(withAuth(async (req: AuthenticatedRequest) => {
  if (!req.user) return NextResponse.json(createErrorResponse('Authentication required.', { code: 'AUTH_REQUIRED' }), { status: HTTP_STATUS.UNAUTHORIZED });
  try {
    const data = await getMyReturns(req.user.id, req.user.role);
    return NextResponse.json(createSuccessResponse(data, { message: 'Returns fetched.' }), { status: HTTP_STATUS.OK });
  } catch (error) { return serviceError(error, 'Failed to fetch returns.'); }
}));

export const returnPATCH = withDatabase(withAuth(async (req: AuthenticatedRequest, context?: { params: Promise<{ id: string }> }) => {
  if (!req.user) return NextResponse.json(createErrorResponse('Authentication required.', { code: 'AUTH_REQUIRED' }), { status: HTTP_STATUS.UNAUTHORIZED });
  const { id } = (await context?.params) || { id: '' };
  const parsed = await parseBody(toNextRequest(req), updateReturnStatusSchema);
  if ('error' in parsed) return parsed.error;
  try {
    const ret = await updateReturnRequest(req.user.id, req.user.role, id, parsed.data);
    return NextResponse.json(createSuccessResponse(ret, { message: 'Return request updated.' }), { status: HTTP_STATUS.OK });
  } catch (error) { return serviceError(error, 'Failed to update return request.'); }
}));
