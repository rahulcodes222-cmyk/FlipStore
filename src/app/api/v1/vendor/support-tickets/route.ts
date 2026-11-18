import { NextRequest, NextResponse } from "next/server";
import { withDatabase } from "@/backend/middleware/connectDb";
import { withApprovedVendor, type ApprovedVendorRequest } from "@/backend/services/vendorAccess";
import { createSuccessResponse, createErrorResponse } from "@/backend/utils/response";
import { HTTP_STATUS } from "@/backend/constants";
import { createSellerSupportTicket, listSellerSupportTickets } from "@/backend/services/supportTicketService";

export async function GET(req: NextRequest): Promise<NextResponse> {
  return withDatabase(withApprovedVendor(async (authReq: ApprovedVendorRequest) => {
    try {
      const tickets = await listSellerSupportTickets(authReq.user!.id);
      return NextResponse.json(createSuccessResponse({ tickets }, { message: "Support tickets fetched." }), { status: HTTP_STATUS.OK });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch support tickets.";
      return NextResponse.json(createErrorResponse(message, { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, code: "VENDOR_SUPPORT_FETCH_FAILED" }), { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    }
  }))(req);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return withDatabase(withApprovedVendor(async (authReq: ApprovedVendorRequest) => {
    try {
      const body = await req.json().catch(() => ({}));
      const priorityRaw = String(body?.priority || "MEDIUM").toUpperCase();
      const priority = (["LOW", "MEDIUM", "HIGH"].includes(priorityRaw) ? priorityRaw : "MEDIUM") as "LOW" | "MEDIUM" | "HIGH";
      const ticket = await createSellerSupportTicket({
        sellerId: authReq.user!.id,
        sellerName: (authReq.user as any)?.name || "Seller",
        sellerEmail: authReq.user?.email,
        subject: String(body?.subject || ""),
        message: String(body?.message || ""),
        priority,
      });
      return NextResponse.json(createSuccessResponse({ ticket }, { message: "Support ticket submitted." }), { status: HTTP_STATUS.CREATED });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit support ticket.";
      const isValidation = /subject|message|invalid/i.test(message);
      return NextResponse.json(
        createErrorResponse(message, { statusCode: isValidation ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR, code: isValidation ? "VENDOR_SUPPORT_VALIDATION_FAILED" : "VENDOR_SUPPORT_CREATE_FAILED" }),
        { status: isValidation ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }
  }))(req);
}
