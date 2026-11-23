import { NextRequest, NextResponse } from 'next/server';
import { withDatabase } from '@/backend/middleware/connectDb';
import { withApprovedVendor, type ApprovedVendorRequest } from '@/backend/services/vendorAccess';
import { getInvoice } from '@/backend/services/orderService';
import { SubOrderModel } from '@/backend/models';
import { HTTP_STATUS } from '@/backend/constants';
import { createErrorResponse } from '@/backend/utils/response';

const handler = withDatabase(
  withApprovedVendor(async (vendorReq: ApprovedVendorRequest, context?: { params: Promise<{ id: string }> }): Promise<NextResponse> => {
    const { id: subOrderId } = await (context?.params || Promise.resolve({ id: '' }));
    const sellerId = vendorReq.user!.id;

    // Verify the sub-order belongs to this vendor
    const sub = await SubOrderModel.findOne({ _id: subOrderId, sellerId }).lean().exec()
      || await SubOrderModel.findOne({ subOrderNumber: subOrderId, sellerId }).lean().exec();
    if (!sub) {
      return NextResponse.json(createErrorResponse('Order not found.', { code: 'NOT_FOUND' }), { status: HTTP_STATUS.NOT_FOUND });
    }

    const parentOrderId = String(sub.orderId);
    try {
      const invoice = await getInvoice(parentOrderId, sellerId, 'vendor');
      const { renderInvoicePdf } = await import('@/backend/utils/invoicePdf');
      const pdf = renderInvoicePdf(invoice as any);
      const filename = `${String((invoice as any)?.invoiceNumber || `INV-${parentOrderId}`)}.pdf`.replace(/[^a-zA-Z0-9._-]+/g, '_');
      return new NextResponse(new Uint8Array(pdf), {
        status: HTTP_STATUS.OK,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=\"${filename}\"`,
          'Cache-Control': 'private, no-store',
        },
      });
    } catch (error: any) {
      return NextResponse.json(createErrorResponse(error.message || 'Failed to fetch invoice.', { code: 'INVOICE_FETCH_FAILED' }), { status: HTTP_STATUS.NOT_FOUND });
    }
  }),
);

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return (await handler(req as any, context)) as NextResponse;
}
