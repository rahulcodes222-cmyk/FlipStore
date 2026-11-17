import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { withAuth, type AuthenticatedRequest } from "@/backend/middleware/auth";
import { createErrorResponse, createSuccessResponse } from "@/backend/utils/response";
import { HTTP_STATUS } from "@/backend/constants";
import { env } from "@/backend/config/env";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const MAX_BYTES = 5 * 1024 * 1024;

function ensureCloudinaryConfigured() {
  const cloudName = env.cloudinaryCloudName;
  const apiKey = env.cloudinaryApiKey;
  const apiSecret = env.cloudinaryApiSecret;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
  }
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
}

function uploadBuffer(buffer: Buffer, folder: string, filename?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `flipstore/${folder}`,
        resource_type: "image",
        use_filename: !!filename,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error("Cloudinary upload failed."));
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return withAuth(async (authReq: AuthenticatedRequest) => {
    if (!authReq.user) {
      return NextResponse.json(
        createErrorResponse("Authentication required.", { statusCode: HTTP_STATUS.UNAUTHORIZED, code: "AUTH_REQUIRED" }),
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    try {
      ensureCloudinaryConfigured();

      const form = await (authReq as unknown as NextRequest).formData();
      const file = form.get("file");
      const folderRaw = String(form.get("folder") || "misc").toLowerCase();
      const folder = ["products", "store", "avatars", "misc"].includes(folderRaw) ? folderRaw : "misc";

      if (!(file instanceof File)) {
        return NextResponse.json(
          createErrorResponse("Image file is required.", { statusCode: HTTP_STATUS.BAD_REQUEST, code: "FILE_REQUIRED" }),
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json(
          createErrorResponse("Only JPG, PNG, WEBP, GIF, or AVIF images are allowed.", { statusCode: HTTP_STATUS.BAD_REQUEST, code: "INVALID_FILE_TYPE" }),
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json(
          createErrorResponse("Image must be 5MB or smaller.", { statusCode: HTTP_STATUS.BAD_REQUEST, code: "FILE_TOO_LARGE" }),
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }

      const bytes = Buffer.from(await file.arrayBuffer());
      const result = await uploadBuffer(bytes, folder, file.name);
      const url = String(result.secure_url || result.url || "");
      if (!url) {
        return NextResponse.json(
          createErrorResponse("Cloudinary did not return an image URL.", { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, code: "UPLOAD_FAILED" }),
          { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
      }

      return NextResponse.json(
        createSuccessResponse(
          {
            url,
            publicId: result.public_id,
            folder,
            size: file.size,
            mimeType: file.type,
            width: result.width,
            height: result.height,
            format: result.format,
          },
          { message: "File uploaded.", statusCode: HTTP_STATUS.CREATED }
        ),
        { status: HTTP_STATUS.CREATED }
      );
    } catch (error: any) {
      console.error("[POST /api/v1/uploads]", error);
      const message = error?.message || "Failed to upload file.";
      const status = message.includes("Cloudinary is not configured") ? HTTP_STATUS.INTERNAL_SERVER_ERROR : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      return NextResponse.json(
        createErrorResponse(message, { statusCode: status, code: "UPLOAD_FAILED" }),
        { status }
      );
    }
  })(req);
}
