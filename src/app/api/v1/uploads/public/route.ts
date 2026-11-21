import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { createErrorResponse, createSuccessResponse } from "@/backend/utils/response";
import { HTTP_STATUS } from "@/backend/constants";
import { env } from "@/backend/config/env";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "application/pdf"]);
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
        resource_type: "auto",
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
  try {
    ensureCloudinaryConfigured();

    const form = await req.formData();
    const file = form.get("file");
    const folderRaw = String(form.get("folder") || "misc").toLowerCase();
    const folder = ["products", "store", "avatars", "misc", "vendor-documents"].includes(folderRaw) ? folderRaw : "vendor-documents";

    if (!(file instanceof File)) {
      return NextResponse.json(
        createErrorResponse("Image file is required.", { statusCode: HTTP_STATUS.BAD_REQUEST, code: "FILE_REQUIRED" }),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }
    if (!ALLOWED_TYPES.has(file.type as string)) {
      return NextResponse.json(
        createErrorResponse("Only JPG, PNG, WEBP, GIF, AVIF images or PDF files are allowed.", { statusCode: HTTP_STATUS.BAD_REQUEST, code: "INVALID_FILE_TYPE" }),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        createErrorResponse("File must be 5MB or smaller.", { statusCode: HTTP_STATUS.BAD_REQUEST, code: "FILE_TOO_LARGE" }),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const result = await uploadBuffer(bytes, folder, file.name);
    const url = String(result.secure_url || result.url || "");
    if (!url) {
      return NextResponse.json(
        createErrorResponse("Cloudinary did not return a file URL.", { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, code: "UPLOAD_FAILED" }),
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
    console.error("[POST /api/v1/uploads/public]", error);
    const message = error?.message || "Failed to upload file.";
    return NextResponse.json(
      createErrorResponse(message, { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, code: "UPLOAD_FAILED" }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
