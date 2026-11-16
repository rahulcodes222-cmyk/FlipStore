import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withDatabase } from '@/backend/middleware/connectDb';
import { withAuth } from '@/backend/middleware/auth';
import { withRole } from '@/backend/middleware/rbac';
import { withApprovedVendor, type ApprovedVendorRequest } from '@/backend/services/vendorAccess';
import { USER_ROLES } from '@/backend/constants/roles';
import { HTTP_STATUS } from '@/backend/constants';
import { createSuccessResponse, createErrorResponse } from '@/backend/utils/response';
import { vendorFinanceQuerySchema, vendorPayoutRequestSchema, adminPayoutUpdateSchema } from '@/backend/validations/vendorFinance.schema';
import {
  computeVendorFinancialSummary,
  getVendorDateWiseEarnings,
  listVendorTransactions,
  listVendorCommissions,
  listVendorPayouts,
  requestVendorPayout,
  listAdminPayouts,
  updateAdminPayoutStatus,
} from '@/backend/services/vendorFinanceService';

function parseQuery<T extends z.ZodTypeAny>(req: NextRequest, schema: T): { data: z.infer<T> } | { error: NextResponse } {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const result = schema.safeParse(params);
  if (!result.success) {
    return { error: NextResponse.json(createErrorResponse('Invalid query parameters.', { statusCode: HTTP_STATUS.BAD_REQUEST, code: 'VALIDATION_ERROR', details: result.error.flatten().fieldErrors as Record<string, string[]> }), { status: HTTP_STATUS.BAD_REQUEST }) };
  }
  return { data: result.data };
}

async function parseBody<T>(req: NextRequest, schema: z.ZodSchema<T>): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await req.json().catch(() => ({}));
    return { data: schema.parse(body ?? {}) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: NextResponse.json(createErrorResponse('Invalid request body.', { statusCode: HTTP_STATUS.UNPROCESSABLE_ENTITY, code: 'VALIDATION_ERROR', details: error.flatten().fieldErrors as Record<string, string[]> }), { status: HTTP_STATUS.UNPROCESSABLE_ENTITY }) };
    }
    throw error;
  }
}

function err(error: unknown, fallback: string): NextResponse {
  const message = error instanceof Error ? error.message : fallback;
  const lower = message.toLowerCase();
  const status = /forbidden|own payouts|not approved|suspended/.test(lower) ? HTTP_STATUS.FORBIDDEN
    : /not found/.test(lower) ? HTTP_STATUS.NOT_FOUND
    : /invalid|cannot|exceed|required|duplicate|failed|reconciliation|balance|transition/.test(lower) ? HTTP_STATUS.BAD_REQUEST
    : HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const code = status === HTTP_STATUS.FORBIDDEN ? 'FORBIDDEN' : status === HTTP_STATUS.NOT_FOUND ? 'NOT_FOUND' : status === HTTP_STATUS.BAD_REQUEST ? 'VALIDATION_ERROR' : 'FINANCE_ERROR';
  return NextResponse.json(createErrorResponse(message, { statusCode: status, code }), { status });
}

export const vendorEarningsGET = withDatabase(withApprovedVendor(async (req: ApprovedVendorRequest): Promise<NextResponse> => {
  const q = parseQuery(req as unknown as NextRequest, vendorFinanceQuerySchema);
  if ('error' in q) return q.error;
  try {
    const [summary, dateWise] = await Promise.all([
      computeVendorFinancialSummary(req.user!.id, q.data),
      getVendorDateWiseEarnings(req.user!.id, q.data),
    ]);
    return NextResponse.json(createSuccessResponse({ ...summary, dateWise, reports: dateWise }, { message: 'Vendor earnings fetched.' }));
  } catch (error) { return err(error, 'Failed to fetch vendor earnings.'); }
}));

export const vendorTransactionsGET = withDatabase(withApprovedVendor(async (req: ApprovedVendorRequest): Promise<NextResponse> => {
  const q = parseQuery(req as unknown as NextRequest, vendorFinanceQuerySchema);
  if ('error' in q) return q.error;
  try { return NextResponse.json(createSuccessResponse(await listVendorTransactions(req.user!.id, q.data), { message: 'Vendor transactions fetched.' })); }
  catch (error) { return err(error, 'Failed to fetch vendor transactions.'); }
}));

export const vendorCommissionsGET = withDatabase(withApprovedVendor(async (req: ApprovedVendorRequest): Promise<NextResponse> => {
  const q = parseQuery(req as unknown as NextRequest, vendorFinanceQuerySchema);
  if ('error' in q) return q.error;
  try { return NextResponse.json(createSuccessResponse(await listVendorCommissions(req.user!.id, q.data), { message: 'Vendor commissions fetched.' })); }
  catch (error) { return err(error, 'Failed to fetch vendor commissions.'); }
}));

export const vendorPayoutsGET = withDatabase(withApprovedVendor(async (req: ApprovedVendorRequest): Promise<NextResponse> => {
  const q = parseQuery(req as unknown as NextRequest, vendorFinanceQuerySchema);
  if ('error' in q) return q.error;
  try { return NextResponse.json(createSuccessResponse(await listVendorPayouts(req.user!.id, q.data), { message: 'Vendor payouts fetched.' })); }
  catch (error) { return err(error, 'Failed to fetch vendor payouts.'); }
}));

export const vendorPayoutRequestPOST = withDatabase(withApprovedVendor(async (req: ApprovedVendorRequest): Promise<NextResponse> => {
  const parsed = await parseBody(req as unknown as NextRequest, vendorPayoutRequestSchema);
  if ('error' in parsed) return parsed.error;
  try {
    const payout = await requestVendorPayout(req.user!.id, parsed.data.amount, parsed.data.note, parsed.data.idempotencyKey);
    return NextResponse.json(createSuccessResponse(payout, { message: 'Payout request submitted.', statusCode: HTTP_STATUS.CREATED }), { status: HTTP_STATUS.CREATED });
  } catch (error) { return err(error, 'Failed to request payout.'); }
}));

export const adminPayoutsGET = withDatabase(withAuth(withRole(USER_ROLES.ADMIN)(async (authReq): Promise<NextResponse> => {
  const q = parseQuery(authReq as unknown as NextRequest, vendorFinanceQuerySchema.extend({ sellerId: z.string().optional() }));
  if ('error' in q) return q.error;
  try { return NextResponse.json(createSuccessResponse(await listAdminPayouts(q.data), { message: 'Admin payouts fetched.' })); }
  catch (error) { return err(error, 'Failed to fetch payouts.'); }
})));

export const adminPayoutByIdPATCH = withDatabase(withAuth(withRole(USER_ROLES.ADMIN)(async (authReq): Promise<NextResponse> => {
  const url = new URL(authReq.url);
  const parts = url.pathname.split('/').filter(Boolean);
  const payoutId = parts[parts.length - 1];
  if (!payoutId) return NextResponse.json(createErrorResponse('Payout ID is required.', { statusCode: HTTP_STATUS.BAD_REQUEST, code: 'INVALID_ID' }), { status: HTTP_STATUS.BAD_REQUEST });
  const parsed = await parseBody(authReq as unknown as NextRequest, adminPayoutUpdateSchema);
  if ('error' in parsed) return parsed.error;
  try {
    const payout = await updateAdminPayoutStatus(payoutId, { id: authReq.user!.id, role: authReq.user!.role }, parsed.data);
    return NextResponse.json(createSuccessResponse(payout, { message: 'Payout updated.' }));
  } catch (error) { return err(error, 'Failed to update payout.'); }
})));