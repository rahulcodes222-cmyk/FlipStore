"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, RefreshCcw, Star } from "lucide-react";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { sellerReviewService } from "@/services";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SellerStatsCard } from "@/components/seller/SellerStatsCard";
import { cn } from "@/lib/utils";
import type { SellerReview, ReviewStatus } from "@/types";

const REVIEW_STATUS_CONFIG: Record<ReviewStatus, { bg: string; text: string; border: string; label: string }> = {
  PENDING: { bg: "bg-[#FFF8E1]", text: "text-[#B26A00]", border: "border-[#FFE082]", label: "Pending" },
  APPROVED: { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]", border: "border-[#C8E6C9]", label: "Approved" },
  REJECTED: { bg: "bg-[#FFEBEE]", text: "text-[#C62828]", border: "border-[#FFCDD2]", label: "Rejected" },
};

export default function SellerReviewsPage() {
  const isHydrated = useHydration();
  const { seller } = useSellerStore();
  const { error } = useToast();
  const currentSeller = isHydrated ? seller : null;
  const sellerId = currentSeller?.id || "slr-001";

  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "">("");
  const [ratingFilter, setRatingFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [items, s] = await Promise.all([
        sellerReviewService.getReviews(sellerId),
        sellerReviewService.getReviewStats(sellerId),
      ]);
      setReviews(Array.isArray(items) ? items : []);
      setStats(s || null);
    } catch (e: any) {
      error(e?.message || "Failed to load reviews");
      setReviews([]);
      setStats({ total: 0, approved: 0, pending: 0, rejected: 0, avgRating: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isHydrated) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId, isHydrated]);

  const filteredReviews = useMemo(() => reviews.filter((r) => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q ||
      String(r.productName || "").toLowerCase().includes(q) ||
      String(r.customerName || "").toLowerCase().includes(q) ||
      String(r.comment || "").toLowerCase().includes(q) ||
      String(r.title || "").toLowerCase().includes(q);
    const matchesStatus = !statusFilter || r.status === statusFilter;
    const matchesRating = !ratingFilter || r.rating === parseInt(ratingFilter, 10);
    return matchesSearch && matchesStatus && matchesRating;
  }), [reviews, search, statusFilter, ratingFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[#212121]">Reviews</h1>
          <p className="text-xs text-[#878787]">Customer reviews for products you added (seller-owned products only)</p>
        </div>
        <Link
          href="/seller/dashboard"
          className="text-[11px] font-semibold text-[#2874F0] hover:underline flex items-center gap-1"
        >
          <span>? Back to Dashboard</span>
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <SellerStatsCard title="Total Reviews" value={stats.total} variant="products" subtitle="Your products" />
          <SellerStatsCard title="Avg Rating" value={stats.avgRating} variant="earnings" subtitle="Out of 5" />
          <SellerStatsCard title="Approved" value={stats.approved} variant="products" subtitle="Published" />
          <SellerStatsCard title="Pending" value={stats.pending} variant="pending" subtitle="Awaiting action" />
          <SellerStatsCard title="Rejected" value={stats.rejected} variant="cancelled" subtitle="Not shown" />
        </div>
      )}

      <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[280px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878787]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product, customer, title or comment…"
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ReviewStatus | "")}
          className="flex h-9 w-32 rounded-sm border border-[#E0E0E0] bg-white px-2 py-1 text-xs focus-visible:ring-1 focus-visible:ring-[#2874F0]"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="flex h-9 w-24 rounded-sm border border-[#E0E0E0] bg-white px-2 py-1 text-xs focus-visible:ring-1 focus-visible:ring-[#2874F0]"
        >
          <option value="">All Ratings</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={String(r)}>
              {r} ?
            </option>
          ))}
        </select>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCcw size={16} /> Refresh
        </Button>
      </div>

      <div className={cn("rounded-sm border border-[#E0E0E0] bg-white shadow-sm", loading ? "pointer-events-none opacity-50" : "")}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="border-b border-[#F0F0F0] bg-[#F9FAFB]">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Product</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Rating</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Review</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Status</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="h-24 rounded-sm bg-[#E8E8E8] animate-skeleton w-3/4 mx-auto" />
                  </td>
                </tr>
              ) : filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <p className="text-sm text-[#878787]">No reviews found for your products.</p>
                    <p className="text-[11px] text-[#9E9E9E] mt-1">Reviews appear here only for products added by this seller account.</p>
                  </td>
                </tr>
              ) : (
                filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-[#F1F3F6] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {review.productImage ? (
                          <img
                            src={review.productImage}
                            alt=""
                            className="w-7 h-7 rounded-sm object-cover border border-[#E0E0E0]"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-sm bg-[#F1F3F6] flex items-center justify-center text-[10px] font-bold text-[#878787]">
                            {review.productName.charAt(0)}
                          </div>
                        )}
                        <div className="text-sm font-medium text-[#212121] truncate max-w-[140px]" title={review.productName}>{review.productName}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#F1F3F6] flex items-center justify-center text-[10px] font-bold text-[#878787]">
                          {review.customerName.charAt(0)}
                        </div>
                        <div className="text-sm text-[#212121]">{review.customerName}</div>
                        {review.isVerifiedPurchase && (
                          <span className="text-[10px] text-[#2874F0] font-bold">Verified</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-[#FB641B]">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} size={12} className={star <= review.rating ? "fill-[#FB641B]" : "text-[#E0E0E0]"} />
                        ))}
                        <span className="text-xs text-[#878787] ml-1">{review.rating}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#212121] max-w-[360px]">
                      <div className="font-medium truncate" title={review.title}>{review.title}</div>
                      <div className="text-[10px] text-[#878787] mt-1 line-clamp-2" title={review.comment}>{review.comment}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border",
                          REVIEW_STATUS_CONFIG[review.status].bg,
                          REVIEW_STATUS_CONFIG[review.status].text,
                          REVIEW_STATUS_CONFIG[review.status].border
                        )}
                      >
                        {REVIEW_STATUS_CONFIG[review.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#212121] whitespace-nowrap">
                      {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
