/**
 * sellerReviewService — Frontend-only simulated seller review operations.
 * All operations are scoped to the authenticated sellerId for data isolation.
 */

import type { SellerReview } from "@/types";
import { MOCK_SELLER_REVIEWS } from "@/data/sellerManagement";

const REVIEW_SESSION_KEY = "my_ecommerce_seller_reviews_v1";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function getStoredReviews(sellerId: string): SellerReview[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REVIEW_SESSION_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, SellerReview[]>) : {};
    return all[sellerId] || MOCK_SELLER_REVIEWS[sellerId] || [];
  } catch {
    return MOCK_SELLER_REVIEWS[sellerId] || [];
  }
}

function saveStoredReviews(sellerId: string, reviews: SellerReview[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(REVIEW_SESSION_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, SellerReview[]>) : {};
    all[sellerId] = reviews;
    localStorage.setItem(REVIEW_SESSION_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export const sellerReviewService = {
  async getReviews(sellerId: string): Promise<SellerReview[]> {
    await delay(400);
    return getStoredReviews(sellerId);
  },

  async getReviewStats(sellerId: string) {
    await delay(300);
    const reviews = getStoredReviews(sellerId);
    const total = reviews.length;
    const approved = reviews.filter((r) => r.status === "APPROVED").length;
    const pending = reviews.filter((r) => r.status === "PENDING").length;
    const rejected = reviews.filter((r) => r.status === "REJECTED").length;
    const avgRating =
      total > 0
        ? Math.round(
            (reviews.reduce((sum, r) => sum + r.rating, 0) / total) * 10
          ) / 10
        : 0;
    return { total, approved, pending, rejected, avgRating };
  },

  async updateReviewStatus(sellerId: string, reviewId: string, status: "APPROVED" | "REJECTED"): Promise<SellerReview | null> {
    await delay(500);
    const reviews = getStoredReviews(sellerId);
    const idx = reviews.findIndex((r) => r.id === reviewId);
    if (idx === -1) return null;
    const updated: SellerReview = {
      ...reviews[idx],
      status,
    };
    const next = [...reviews];
    next[idx] = updated;
    saveStoredReviews(sellerId, next);
    return updated;
  },

  async replyToReview(
    sellerId: string,
    reviewId: string,
    reply: string
  ): Promise<SellerReview | null> {
    await delay(500);
    const reviews = getStoredReviews(sellerId);
    const idx = reviews.findIndex((r) => r.id === reviewId);
    if (idx === -1) return null;
    const updated: SellerReview = {
      ...reviews[idx],
      sellerReply: reply,
      replyAt: new Date().toISOString(),
      status: "APPROVED",
    };
    const next = [...reviews];
    next[idx] = updated;
    saveStoredReviews(sellerId, next);
    return updated;
  },
};
