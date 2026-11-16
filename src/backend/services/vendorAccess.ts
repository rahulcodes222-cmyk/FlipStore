import { NextResponse } from 'next/server';
import { withAuth, type AuthenticatedRequest } from '@/backend/middleware/auth';
import { withRole } from '@/backend/middleware/rbac';
import { USER_ROLES } from '@/backend/constants/roles';
import { VendorModel } from '@/backend/models';
import { canVendorAccessDashboard, normalizeVendorApplicationStatus } from '@/backend/constants';
import { createErrorResponse } from '@/backend/utils/response';
import { HTTP_STATUS } from '@/backend/constants';

export type ApprovedVendorRequest = AuthenticatedRequest & { vendor?: any };

export async function getApprovedVendorForUser(userId: string) {
  const vendor: any = await (VendorModel as any).findOne({ userId }).exec();
  if (!vendor) {
    const err: any = new Error('Vendor account not found.');
    err.statusCode = HTTP_STATUS.FORBIDDEN;
    err.code = 'VENDOR_NOT_FOUND';
    throw err;
  }
  const status = normalizeVendorApplicationStatus(vendor.applicationStatus || vendor.approvalStatus);
  if (!canVendorAccessDashboard(status)) {
    const err: any = new Error('Vendor account is not approved for dashboard access.');
    err.statusCode = HTTP_STATUS.FORBIDDEN;
    err.code = 'VENDOR_NOT_APPROVED';
    err.details = { applicationStatus: status };
    throw err;
  }
  if ((vendor.approvalStatus || '').toUpperCase() === 'SUSPENDED' || status === 'Suspended') {
    const err: any = new Error('Vendor account is suspended.');
    err.statusCode = HTTP_STATUS.FORBIDDEN;
    err.code = 'VENDOR_SUSPENDED';
    throw err;
  }
  return vendor;
}

export function withApprovedVendor(
  handler: (req: ApprovedVendorRequest, context?: any) => Promise<NextResponse>,
) {
  return withAuth(
    withRole(USER_ROLES.VENDOR)(async (req: AuthenticatedRequest, context?: any) => {
      if (!req.user) {
        return NextResponse.json(
          createErrorResponse('Authentication required.', {
            statusCode: HTTP_STATUS.UNAUTHORIZED,
            code: 'AUTH_REQUIRED',
            requestId: req.requestId,
          }),
          { status: HTTP_STATUS.UNAUTHORIZED },
        );
      }
      try {
        const vendor = await getApprovedVendorForUser(req.user.id);
        const vreq = req as ApprovedVendorRequest;
        vreq.vendor = vendor;
        return handler(vreq, context);
      } catch (error: any) {
        const statusCode = error?.statusCode || HTTP_STATUS.FORBIDDEN;
        return NextResponse.json(
          createErrorResponse(error?.message || 'Vendor access denied.', {
            statusCode,
            code: error?.code || 'VENDOR_ACCESS_DENIED',
            requestId: req.requestId,
            details: error?.details,
          }),
          { status: statusCode },
        );
      }
    }),
  );
}
