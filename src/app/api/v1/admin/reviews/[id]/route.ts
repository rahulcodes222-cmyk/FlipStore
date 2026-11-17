import { NextRequest, NextResponse } from 'next/server';
import { withDatabase } from '@/backend/middleware/connectDb';
import { withAuth } from '@/backend/middleware/auth';
import { withRole } from '@/backend/middleware/rbac';
import { USER_ROLES } from '@/backend/constants/roles';
import { HTTP_STATUS } from '@/backend/constants';
import { createErrorResponse, createSuccessResponse } from '@/backend/utils/response';
import { deleteReviewByAdmin } from '@/backend/services/reviewService';

function getId(req: Request): string {
  const parts = new URL(req.url).pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  return withDatabase(withAuth(withRole(USER_ROLES.ADMIN as any)(async (authReq) => {
    try {
      const id = getId(authReq as any);
      if (!id) {
        return NextResponse.json(createErrorResponse('Review ID is required.', { statusCode: HTTP_STATUS.BAD_REQUEST, code: 'REVIEW_ID_REQUIRED' }), { status: HTTP_STATUS.BAD_REQUEST });
      }
      const result = await deleteReviewByAdmin(id);
      return NextResponse.json(createSuccessResponse(result, { message: 'Review deleted.' }), { status: HTTP_STATUS.OK });
    } catch (error: any) {
      const msg = String(error?.message || 'Failed to delete review.');
      const status = msg.toLowerCase().includes('not found') ? HTTP_STATUS.NOT_FOUND : msg.toLowerCase().includes('invalid') ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      return NextResponse.json(createErrorResponse(msg, { statusCode: status, code: status === HTTP_STATUS.NOT_FOUND ? 'REVIEW_NOT_FOUND' : 'REVIEW_DELETE_FAILED' }), { status });
    }
  })))(req) as Promise<NextResponse>;
}