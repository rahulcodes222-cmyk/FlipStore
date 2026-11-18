import { NextRequest, NextResponse } from "next/server";
import { withDatabase } from "@/backend/middleware/connectDb";
import { withApprovedVendor, type ApprovedVendorRequest } from "@/backend/services/vendorAccess";
import { createSuccessResponse, createErrorResponse } from "@/backend/utils/response";
import { HTTP_STATUS } from "@/backend/constants";

export async function GET(req: NextRequest): Promise<NextResponse> {
  return withDatabase(withApprovedVendor(async (authReq: ApprovedVendorRequest) => {
    try {
      const url = new URL(req.url);
      const ratingRaw = url.searchParams.get("rating");
      const rating = ratingRaw ? Number(ratingRaw) : undefined;
      const search = url.searchParams.get("search") || undefined;
      const status = url.searchParams.get("status") || undefined;

      const { listVendorReviews } = await import("@/backend/services/reviewService");
      if (typeof listVendorReviews !== "function") {
        throw new Error("Vendor reviews service unavailable. Restart the dev server to load latest changes.");
      }
      const reviews = await listVendorReviews(authReq.user!.id, { rating, search, status });
      return NextResponse.json(
        createSuccessResponse({ reviews }, { message: "Vendor reviews fetched." }),
        { status: HTTP_STATUS.OK }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch vendor reviews.";
      return NextResponse.json(
        createErrorResponse(message, { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, code: "VENDOR_REVIEWS_FETCH_FAILED" }),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }
  }))(req);
}
