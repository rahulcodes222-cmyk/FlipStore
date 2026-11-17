import { NextRequest, NextResponse } from 'next/server';
import { withDatabase } from '@/backend/middleware/connectDb';
import { withAuth } from '@/backend/middleware/auth';
import { withRole } from '@/backend/middleware/rbac';
import { USER_ROLES } from '@/backend/constants/roles';
import { HTTP_STATUS } from '@/backend/constants';
import { createErrorResponse, createSuccessResponse } from '@/backend/utils/response';
import { listAdminReviews } from '@/backend/services/reviewService';

export async function GET(req: NextRequest): Promise<NextResponse> {
  return withDatabase(withAuth(withRole(USER_ROLES.ADMIN as any)(async (authReq) => {
    try {
      const url = new URL(authReq.url);
      const ratingRaw = url.searchParams.get('rating');
      const rating = ratingRaw ? Number(ratingRaw) : undefined;
      const search = url.searchParams.get('search') || undefined;
      const reviews = await listAdminReviews({ rating, search });
      return NextResponse.json(createSuccessResponse(reviews, { message: 'Reviews fetched.' }), { status: HTTP_STATUS.OK });
    } catch (error: any) {
      return NextResponse.json(
        createErrorResponse(error?.message || 'Failed to fetch reviews.', { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, code: 'ADMIN_REVIEWS_FETCH_FAILED' }),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
      );
    }
  })))(req) as Promise<NextResponse>;
}