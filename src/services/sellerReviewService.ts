import type { SellerReview, ReviewStatus } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || json?.error?.message || `Request failed (${res.status})`);
  }
  return (json?.data ?? json) as T;
}

function toSellerReview(r: any): SellerReview {
  const status = (String(r?.status || "APPROVED").toUpperCase() as ReviewStatus);
  return {
    id: String(r?.id || r?._id || ""),
    productId: String(r?.productId || ""),
    productName: String(r?.productName || "Product"),
    productImage: String(r?.productImage || ""),
    customerName: String(r?.userName || r?.customerName || "Customer"),
    customerAvatar: r?.userAvatar || undefined,
    rating: Number(r?.rating || 0),
    title: String(r?.title || ""),
    comment: String(r?.comment || ""),
    status: (status === "PENDING" || status === "REJECTED" || status === "APPROVED") ? status : "APPROVED",
    isVerifiedPurchase: !!r?.isVerifiedPurchase,
    helpfulCount: Number(r?.helpfulCount || 0),
    sellerReply: r?.sellerReply ? String(r.sellerReply) : undefined,
    replyAt: r?.replyAt ? String(r.replyAt) : undefined,
    createdAt: r?.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
  };
}

export const sellerReviewService = {
  async getReviews(_sellerId: string): Promise<SellerReview[]> {
    const data = await api<any>("/api/v1/vendor/reviews");
    const rows = Array.isArray(data?.reviews) ? data.reviews : Array.isArray(data) ? data : [];
    return rows.map(toSellerReview);
  },

  async getReviewStats(_sellerId: string) {
    const reviews = await this.getReviews(_sellerId);
    const total = reviews.length;
    const approved = reviews.filter((r) => r.status === "APPROVED").length;
    const pending = reviews.filter((r) => r.status === "PENDING").length;
    const rejected = reviews.filter((r) => r.status === "REJECTED").length;
    const avgRating = total > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10
      : 0;
    return { total, approved, pending, rejected, avgRating };
  },

  // Moderation/reply endpoints for seller-owned reviews are not implemented yet.
  async updateReviewStatus(_sellerId: string, _reviewId: string, _status: "APPROVED" | "REJECTED"): Promise<SellerReview | null> {
    throw new Error("Review moderation is not available for sellers yet.");
  },

  async replyToReview(_sellerId: string, _reviewId: string, _reply: string): Promise<SellerReview | null> {
    throw new Error("Replying to reviews is not available yet.");
  },
};
