import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withDatabase } from "@/backend/middleware/connectDb";
import { withAuth } from "@/backend/middleware/auth";
import { createErrorResponse, createSuccessResponse } from "@/backend/utils/response";
import { HTTP_STATUS } from "@/backend/constants";
import { createProductReview, listApprovedProductReviews } from "@/backend/services/reviewService";
import { createProductReviewSchema, productReviewParamsSchema } from "@/backend/validations/review.schema";

export async function GET(req: NextRequest, context?: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  return withDatabase(async () => {
    try {
      const { id } = (await context?.params) || { id: "" };
      const parsedParams = productReviewParamsSchema.safeParse({ id });
      if (!parsedParams.success) {
        return NextResponse.json(
          createErrorResponse("Invalid product ID.", { statusCode: HTTP_STATUS.BAD_REQUEST, code: "INVALID_PRODUCT_ID" }),
          { status: HTTP_STATUS.BAD_REQUEST },
        );
      }

      const reviews = await listApprovedProductReviews(parsedParams.data.id);
      return NextResponse.json(
        createSuccessResponse({ reviews }, { message: "Product reviews fetched.", statusCode: HTTP_STATUS.OK }),
        { status: HTTP_STATUS.OK },
      );
    } catch (error) {
      console.error("[GET /api/v1/products/[id]/reviews]", error);
      return NextResponse.json(
        createErrorResponse("Failed to fetch product reviews.", {
          statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          code: "PRODUCT_REVIEWS_FETCH_FAILED",
        }),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
      );
    }
  })(req);
}

export async function POST(req: NextRequest, context?: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  return withDatabase(
    withAuth(async (authReq) => {
      if (!authReq.user) {
        return NextResponse.json(
          createErrorResponse("Authentication required.", { statusCode: HTTP_STATUS.UNAUTHORIZED, code: "AUTH_REQUIRED" }),
          { status: HTTP_STATUS.UNAUTHORIZED },
        );
      }

      const { id } = (await context?.params) || { id: "" };
      const parsedParams = productReviewParamsSchema.safeParse({ id });
      if (!parsedParams.success) {
        return NextResponse.json(
          createErrorResponse("Invalid product ID.", { statusCode: HTTP_STATUS.BAD_REQUEST, code: "INVALID_PRODUCT_ID" }),
          { status: HTTP_STATUS.BAD_REQUEST },
        );
      }

      let body: unknown;
      try {
        body = await req.json();
      } catch {
        body = {};
      }

      const parsed = createProductReviewSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid request body.",
            error: {
              code: "VALIDATION_ERROR",
              details: parsed.error.flatten().fieldErrors as Record<string, string[]>,
            },
            timestamp: new Date().toISOString(),
          },
          { status: HTTP_STATUS.UNPROCESSABLE_ENTITY },
        );
      }

      try {
        const review = await createProductReview({
          productId: parsedParams.data.id,
          userId: authReq.user.id,
          data: parsed.data,
        });

        return NextResponse.json(
          createSuccessResponse({ review }, { message: "Review submitted successfully.", statusCode: HTTP_STATUS.CREATED }),
          { status: HTTP_STATUS.CREATED },
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to submit review.";
        const lower = message.toLowerCase();
        const status = lower.includes("not found")
          ? HTTP_STATUS.NOT_FOUND
          : lower.includes("already reviewed") || lower.includes("invalid")
            ? HTTP_STATUS.BAD_REQUEST
            : HTTP_STATUS.INTERNAL_SERVER_ERROR;
        const code = status === HTTP_STATUS.NOT_FOUND
          ? "PRODUCT_NOT_FOUND"
          : status === HTTP_STATUS.BAD_REQUEST
            ? "REVIEW_CREATE_INVALID"
            : "REVIEW_CREATE_FAILED";

        return NextResponse.json(
          createErrorResponse(message, { statusCode: status, code }),
          { status },
        );
      }
    }),
  )(req);
}
