import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withDatabase } from '@/backend/middleware/connectDb';
import { withApprovedVendor, type ApprovedVendorRequest } from '@/backend/services/vendorAccess';
import { createSuccessResponse, createErrorResponse } from '@/backend/utils/response';
import { HTTP_STATUS } from '@/backend/constants';
import {
  vendorCreateProductSchema,
  vendorUpdateProductSchema,
  vendorProductQuerySchema,
  vendorInventoryQuerySchema,
  vendorInventoryUpdateSchema,
  vendorOrdersQuerySchema,
  vendorOrderStatusSchema,
  vendorCustomersQuerySchema,
} from '@/backend/validations/vendorCommerce.schema';
import {
  listVendorProducts,
  getVendorProductById,
  createVendorProduct,
  updateVendorProduct,
  archiveVendorProduct,
  submitVendorProductForApproval,
  listVendorInventory,
  updateVendorInventory,
  listVendorInventoryHistory,
  listVendorOrders,
  getVendorOrderDetail,
  listVendorCustomers,
} from '@/backend/services/vendorCommerceService';
import { updateOrderStatus as updateOrderStatusSvc, getMyReturns, updateReturnRequest } from '@/backend/services/orderService';
import { updateReturnStatusSchema } from '@/backend/validations/order.schema';

function toNext(req: ApprovedVendorRequest): NextRequest { return req as unknown as NextRequest; }

async function parseJson<T>(req: NextRequest, schema: z.ZodSchema<T>): Promise<{ data: T } | { error: NextResponse }> {
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

function parseQuery<T extends z.ZodTypeAny>(req: NextRequest, schema: T): { data: z.infer<T> } | { error: NextResponse } {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  const result = schema.safeParse(params);
  if (!result.success) {
    return { error: NextResponse.json(createErrorResponse('Invalid query parameters.', { statusCode: HTTP_STATUS.BAD_REQUEST, code: 'VALIDATION_ERROR', details: result.error.flatten().fieldErrors as Record<string, string[]> }), { status: HTTP_STATUS.BAD_REQUEST }) };
  }
  return { data: result.data };
}

function err(error: unknown, fallback: string): NextResponse {
  const message = error instanceof Error ? error.message : fallback;
  const lower = message.toLowerCase();
  const status = /forbidden/.test(lower) ? HTTP_STATUS.FORBIDDEN : /not found/.test(lower) ? HTTP_STATUS.NOT_FOUND : /invalid|cannot|already|negative|required|duplicate|exceed|not permitted|variant/.test(lower) ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const code = status === HTTP_STATUS.FORBIDDEN ? 'FORBIDDEN' : status === HTTP_STATUS.NOT_FOUND ? 'NOT_FOUND' : status === HTTP_STATUS.BAD_REQUEST ? 'VALIDATION_ERROR' : 'VENDOR_ERROR';
  return NextResponse.json(createErrorResponse(message, { statusCode: status, code }), { status });
}

export const vendorProductsGET = withDatabase(withApprovedVendor(async (req: ApprovedVendorRequest): Promise<NextResponse> => {
  const q = parseQuery(toNext(req), vendorProductQuerySchema);
  if ('error' in q) return q.error;
  try { return NextResponse.json(createSuccessResponse(await listVendorProducts(req.user!.id, q.data), { message: 'Vendor products fetched.' })); }
  catch (error) { return err(error, 'Failed to fetch vendor products.'); }
}));

export const vendorProductsPOST = withDatabase(withApprovedVendor(async (req: ApprovedVendorRequest): Promise<NextResponse> => {
  const parsed = await parseJson(toNext(req), vendorCreateProductSchema);
  if ('error' in parsed) return parsed.error;
  try {
    const product = await createVendorProduct(req.user!.id, req.user!.id, parsed.data);
    return NextResponse.json(createSuccessResponse(product, { message: 'Product created.', statusCode: HTTP_STATUS.CREATED }), { status: HTTP_STATUS.CREATED });
  } catch (error) { return err(error, 'Failed to create product.'); }
}));

export const vendorProductByIdGET = withDatabase(withApprovedVendor(async (req: ApprovedVendorRequest, context?: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  const { id } = (await context?.params) || { id: '' };
  try { return NextResponse.json(createSuccessResponse(await getVendorProductById(req.user!.id, id), { message: 'Product fetched.' })); }
  catch (error) { return err(error, 'Failed to fetch product.'); }
}));

export const vendorProductByIdPATCH = withDatabase(withApprovedVendor(async (req: ApprovedVendorRequest, context?: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  const { id } = (await context?.params) || { id: '' };
  const parsed = await parseJson(toNext(req), vendorUpdateProductSchema);
  if ('error' in parsed) return parsed.error;
  try { return NextResponse.json(createSuccessResponse(await updateVendorProduct(req.user!.id, req.user!.id, id, parsed.data), { message: 'Product updated.' })); }
  catch (error) { return err(error, 'Failed to update product.'); }
}));

export const vendorProductByIdDELETE = withDatabase(withApprovedVendor(async (req: ApprovedVendorRequest, context?: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  const { id } = (await context?.params) || { id: '' };
  try { return NextResponse.json(createSuccessResponse(await archiveVendorProduct(req.user!.id, id), { message: 'Product archived.' })); }
  catch (error) { return err(error, 'Failed to archive product.'); }
}));

export const vendorProductSubmitPATCH = withDatabase(withApprovedVendor(async (req: ApprovedVendorRequest, context?: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  const { id } = (await context?.params) || { id: '' };
  try { return NextResponse.json(createSuccessResponse(await submitVendorProductForApproval(req.user!.id, id), { message: 'Product submitted for approval.' })); }
  catch (error) { return err(error, 'Failed to submit product for approval.'); }
}));

export const vendorInventoryGET = withDatabase(withApprovedVendor(async (req: ApprovedVendorRequest): Promise<NextResponse> => {
  const q = parseQuery(toNext(req), vendorInventoryQuerySchema);
  if ('error' in q) return q.error;
  try {
    const result = await listVendorInventory(req.user!.id, q.data);
    let history: any[] | undefined;
    if ((q.data as any).includeHistory) history = (await listVendorInventoryHistory(req.user!.id, { page: 1, limit: 20 })).data;
    return NextResponse.json(createSuccessResponse({ ...result, history }, { message: 'Inventory fetched.' }));
  } catch (error) { return err(error, 'Failed to fetch inventory.'); }
}));

export const vendorInventoryHistoryGET = withDatabase(withApprovedVendor(async (req: ApprovedVendorRequest): Promise<NextResponse> => {
  const url = new URL(toNext(req).url);
  const q = { page: Number(url.searchParams.get('page') || '1'), limit: Number(url.searchParams.get('limit') || '50'), productId: url.searchParams.get('productId') || undefined };
  try { return NextResponse.json(createSuccessResponse(await listVendorInventoryHistory(req.user!.id, q), { message: 'Inventory history fetched.' })); }
  catch (error) { return err(error, 'Failed to fetch inventory history.'); }
}));

export const vendorInventoryPATCH = withDatabase(withApprovedVendor(async (req: ApprovedVendorRequest, context?: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  const { id } = (await context?.params) || { id: '' };
  const parsed = await parseJson(toNext(req), vendorInventoryUpdateSchema);
  if ('error' in parsed) return parsed.error;
  try { return NextResponse.json(createSuccessResponse(await updateVendorInventory(req.user!.id, req.user!.id, id, parsed.data as any), { message: 'Inventory updated.' })); }
  catch (error) { return err(error, 'Failed to update inventory.'); }
}));

export const vendorOrdersGET = withDatabase(withApprovedVendor(async (req: ApprovedVendorRequest): Promise<NextResponse> => {
  const q = parseQuery(toNext(req), vendorOrdersQuerySchema);
  if ('error' in q) return q.error;
  try { return NextResponse.json(createSuccessResponse(await listVendorOrders(req.user!.id, q.data), { message: 'Vendor orders fetched.' })); }
  catch (error) { return err(error, 'Failed to fetch vendor orders.'); }
}));

export const vendorOrderByIdGET = withDatabase(withApprovedVendor(async (req: ApprovedVendorRequest, context?: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  const { id } = (await context?.params) || { id: '' };
  try { return NextResponse.json(createSuccessResponse(await getVendorOrderDetail(req.user!.id, id), { message: 'Vendor order fetched.' })); }
  catch (error) { return err(error, 'Failed to fetch vendor order.'); }
}));

export const vendorOrderStatusPATCH = withDatabase(withApprovedVendor(async (req: ApprovedVendorRequest, context?: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  const { id } = (await context?.params) || { id: '' };
  const parsed = await parseJson(toNext(req), vendorOrderStatusSchema);
  if ('error' in parsed) return parsed.error;
  try {
    const detail = await getVendorOrderDetail(req.user!.id, id);
    const order = await updateOrderStatusSvc(req.user!.id, req.user!.role, String((detail as any).parentOrderId || (detail as any).orderId), { ...parsed.data, subOrderId: String((detail as any).id) });
    return NextResponse.json(createSuccessResponse(order, { message: 'Order status updated.' }));
  } catch (error) { return err(error, 'Failed to update order status.'); }
}));

export const vendorCustomersGET = withDatabase(withApprovedVendor(async (req: ApprovedVendorRequest): Promise<NextResponse> => {
  const q = parseQuery(toNext(req), vendorCustomersQuerySchema);
  if ('error' in q) return q.error;
  try { return NextResponse.json(createSuccessResponse(await listVendorCustomers(req.user!.id, q.data), { message: 'Vendor customers fetched.' })); }
  catch (error) { return err(error, 'Failed to fetch vendor customers.'); }
}));

export const vendorReturnsGET = withDatabase(withApprovedVendor(async (req: ApprovedVendorRequest): Promise<NextResponse> => {
  try { return NextResponse.json(createSuccessResponse(await getMyReturns(req.user!.id, req.user!.role), { message: 'Vendor returns fetched.' })); }
  catch (error) { return err(error, 'Failed to fetch vendor returns.'); }
}));

export const vendorReturnPATCH = withDatabase(withApprovedVendor(async (req: ApprovedVendorRequest, context?: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
  const { id } = (await context?.params) || { id: '' };
  const parsed = await parseJson(toNext(req), updateReturnStatusSchema);
  if ('error' in parsed) return parsed.error;
  try { return NextResponse.json(createSuccessResponse(await updateReturnRequest(req.user!.id, req.user!.role, id, parsed.data), { message: 'Return updated.' })); }
  catch (error) { return err(error, 'Failed to update return.'); }
}));
