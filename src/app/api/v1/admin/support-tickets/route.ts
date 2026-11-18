import { NextRequest, NextResponse } from "next/server";
import { withDatabase } from "@/backend/middleware/connectDb";
import { withAuth } from "@/backend/middleware/auth";
import { withRole } from "@/backend/middleware/rbac";
import { USER_ROLES } from "@/backend/constants/roles";
import { HTTP_STATUS } from "@/backend/constants";
import { createErrorResponse, createSuccessResponse } from "@/backend/utils/response";
import { listAdminSupportTickets } from "@/backend/services/supportTicketService";

export async function GET(req: NextRequest): Promise<NextResponse> {
  return withDatabase(withAuth(withRole(USER_ROLES.ADMIN as any)(async () => {
    try {
      const url = new URL(req.url);
      const status = url.searchParams.get("status") || undefined;
      const search = url.searchParams.get("search") || undefined;
      const tickets = await listAdminSupportTickets({ status, search });
      return NextResponse.json(createSuccessResponse({ tickets }, { message: "Support tickets fetched." }), { status: HTTP_STATUS.OK });
    } catch (error: any) {
      return NextResponse.json(
        createErrorResponse(error?.message || "Failed to fetch support tickets.", { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, code: "ADMIN_SUPPORT_FETCH_FAILED" }),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }
  })))(req) as Promise<NextResponse>;
}
