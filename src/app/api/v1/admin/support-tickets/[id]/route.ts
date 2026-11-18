import { NextRequest, NextResponse } from "next/server";
import { withDatabase } from "@/backend/middleware/connectDb";
import { withAuth } from "@/backend/middleware/auth";
import { withRole } from "@/backend/middleware/rbac";
import { USER_ROLES } from "@/backend/constants/roles";
import { HTTP_STATUS } from "@/backend/constants";
import { createErrorResponse, createSuccessResponse } from "@/backend/utils/response";
import { updateAdminSupportTicketStatus } from "@/backend/services/supportTicketService";

export async function PATCH(req: NextRequest, ctx: any): Promise<NextResponse> {
  return withDatabase(withAuth(withRole(USER_ROLES.ADMIN as any)(async () => {
    try {
      const params = await (ctx?.params ?? ctx);
      const id = String(params?.id || "");
      const body = await req.json().catch(() => ({}));
      const status = String(body?.status || "").toUpperCase();
      if (!["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status)) {
        return NextResponse.json(createErrorResponse("Invalid status.", { statusCode: HTTP_STATUS.BAD_REQUEST, code: "ADMIN_SUPPORT_INVALID_STATUS" }), { status: HTTP_STATUS.BAD_REQUEST });
      }
      const ticket = await updateAdminSupportTicketStatus(id, status as any);
      return NextResponse.json(createSuccessResponse({ ticket }, { message: "Support ticket updated." }), { status: HTTP_STATUS.OK });
    } catch (error: any) {
      const msg = error?.message || "Failed to update support ticket.";
      const statusCode = /not found/i.test(msg) ? HTTP_STATUS.NOT_FOUND : /invalid/i.test(msg) ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      return NextResponse.json(createErrorResponse(msg, { statusCode, code: "ADMIN_SUPPORT_UPDATE_FAILED" }), { status: statusCode });
    }
  })))(req) as Promise<NextResponse>;
}
