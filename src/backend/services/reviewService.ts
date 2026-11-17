import mongoose from "mongoose";
import { OrderModel, ProductModel, ReviewModel } from "@/backend/models";
import type { CreateProductReviewInput } from "@/backend/validations/review.schema";

function toFrontendReview(doc: any) {
  const p = doc?.productId;
  const productName = String(
    doc?.productName ||
      (p && typeof p === "object" ? (p.name || p.title || "") : "") ||
      ""
  );
  return {
    id: String(doc.id || doc._id),
    productId: String((p && typeof p === "object" ? (p._id || p.id) : p) || ""),
    productName,
    userId: String(doc.userId?._id || doc.userId || ""),
    userName: String(doc.userName || "Customer"),
    userLocation: String(doc.userLocation || ""),
    rating: Number(doc.rating || 0),
    title: String(doc.title || ""),
    comment: String(doc.comment || ""),
    isVerifiedPurchase: !!doc.isVerifiedPurchase,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    helpfulCount: Number(doc.helpfulCount || 0),
    images: Array.isArray(doc.images) ? doc.images : [],
    status: doc.status,
  };
}

export async function listApprovedProductReviews(productId: string) {
  if (!mongoose.isValidObjectId(productId)) return [];

  const docs = await ReviewModel.find({ productId, status: "APPROVED" })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean()
    .exec();

  return docs.map(toFrontendReview);
}

async function recalcProductReviewStats(productId: string) {
  if (!mongoose.isValidObjectId(productId)) return;

  const productObjectId = new mongoose.Types.ObjectId(productId);
  const agg = await ReviewModel.aggregate([
    { $match: { productId: productObjectId, status: "APPROVED" } },
    {
      $group: {
        _id: "$productId",
        count: { $sum: 1 },
        avg: { $avg: "$rating" },
      },
    },
  ]);

  const stats = agg[0];
  await ProductModel.findByIdAndUpdate(productId, {
    $set: {
      reviewCount: stats?.count || 0,
      rating: stats?.avg ? Math.round(Number(stats.avg) * 10) / 10 : 0,
    },
  }).exec();
}

export async function createProductReview(params: {
  productId: string;
  userId: string;
  userName?: string | null;
  data: CreateProductReviewInput;
}) {
  const { productId, userId, userName, data } = params;

  if (!mongoose.isValidObjectId(productId)) {
    throw new Error("Invalid product ID.");
  }
  if (!mongoose.isValidObjectId(userId)) {
    throw new Error("Invalid user.");
  }

  const product = await ProductModel.findById(productId).select("_id status").lean().exec();
  if (!product) {
    throw new Error("Product not found.");
  }

  const existing = await ReviewModel.findOne({ productId, userId } as any).lean().exec();
  if (existing) {
    throw new Error("You have already reviewed this product.");
  }

  const productObjectId = new mongoose.Types.ObjectId(productId);
  const purchasedOrder = await OrderModel.findOne({
    customerId: userId,
    $or: [
      { "items.productId": productObjectId },
      { "items.productId": productId },
    ],
    orderStatus: {
      $nin: ["CANCELLED", "RETURNED", "REFUNDED"],
    },
  } as any)
    .select("_id")
    .lean()
    .exec() as any;

  if (!purchasedOrder) {
    throw new Error("You can review this product only after purchasing it.");
  }

  const created = await ReviewModel.create({
    productId: productObjectId,
    orderId: purchasedOrder?._id,
    userId: new mongoose.Types.ObjectId(userId),
    userName: String(userName || "Customer").trim() || "Customer",
    rating: data.rating,
    title: data.title.trim(),
    comment: data.comment.trim(),
    images: Array.isArray(data.images) ? data.images.filter(Boolean).slice(0, 5) : [],
    status: "APPROVED",
    isVerifiedPurchase: true,
    helpfulCount: 0,
  } as any);

  await recalcProductReviewStats(productId);

  const doc = typeof (created as any)?.toObject === "function" ? (created as any).toObject() : created;
  return toFrontendReview(doc);
}

export async function listAdminReviews(params?: { rating?: number; search?: string }) {
  const filter: Record<string, any> = {};
  if (params?.rating != null && Number.isFinite(Number(params.rating)) && Number(params.rating) > 0) {
    filter.rating = Number(params.rating);
  }
  const search = String(params?.search || "").trim();
  let productIdsByName: mongoose.Types.ObjectId[] = [];
  if (search) {
    const esc = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(esc, "i");
    filter.$or = [{ userName: re }, { title: re }, { comment: re }, { userLocation: re }];
    if (mongoose.isValidObjectId(search)) {
      filter.$or.push({ _id: new mongoose.Types.ObjectId(search) }, { productId: new mongoose.Types.ObjectId(search) });
    }
    try {
      const prods = await ProductModel.find({ $or: [{ name: re }, { title: re }, { slug: re }] }).select("_id").limit(100).lean().exec();
      productIdsByName = (prods || []).map((p: any) => p._id).filter(Boolean);
      if (productIdsByName.length) filter.$or.push({ productId: { $in: productIdsByName } });
    } catch {}
  }

  const docs = await ReviewModel.find(filter)
    .populate("productId", "name title slug")
    .sort({ createdAt: -1 })
    .limit(500)
    .lean()
    .exec();

  return docs.map(toFrontendReview);
}

export async function deleteReviewByAdmin(reviewId: string) {
  if (!mongoose.isValidObjectId(reviewId)) {
    throw new Error("Invalid review ID.");
  }
  const existing = await ReviewModel.findById(reviewId).select("_id productId").lean().exec() as any;
  if (!existing) {
    throw new Error("Review not found.");
  }
  const productId = String(existing.productId || "");
  await ReviewModel.deleteOne({ _id: reviewId }).exec();
  if (productId) await recalcProductReviewStats(productId);
  return { id: String(existing._id || reviewId), deleted: true };
}
