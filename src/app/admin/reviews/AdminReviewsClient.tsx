"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Star,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
} from "lucide-react";
import { Review } from "@/types";
import { adminService } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminReviewsClient() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await adminService.getReviews();
      setReviews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (ratingFilter > 0 && r.rating !== ratingFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchUser = r.userName?.toLowerCase().includes(q);
        const matchTitle = r.title?.toLowerCase().includes(q);
        const matchComment = r.comment?.toLowerCase().includes(q);
        if (!matchUser && !matchTitle && !matchComment) return false;
      }
      return true;
    });
  }, [reviews, ratingFilter, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this customer review?")) {
      return;
    }
    setDeletingId(id);
    try {
      await adminService.deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#212121] tracking-tight">Customer Reviews</h1>
            <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {filteredReviews.length} Reviews
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Moderate community feedback, inspect verified buyer ratings, and filter feedback.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadReviews}
          className="h-9 text-xs font-semibold bg-white border-gray-300"
        >
          <RefreshCw size={13} className="mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* ── Search & Rating Filter ───────────────────────────────────────────── */}
      <div className="bg-white rounded-md border border-gray-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px] max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reviews by user name or keyword..."
            className="pl-9 h-9 text-xs bg-gray-50 border-gray-200 focus:bg-white"
          />
        </div>

        {/* Rating Pills */}
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <button
            onClick={() => setRatingFilter(0)}
            className={`px-3 py-1.5 rounded transition-colors ${
              ratingFilter === 0
                ? "bg-[#2874F0] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Ratings
          </button>
          {[5, 4, 3, 2, 1].map((stars) => (
            <button
              key={stars}
              onClick={() => setRatingFilter(stars)}
              className={`px-2.5 py-1.5 rounded flex items-center gap-1 transition-colors ${
                ratingFilter === stars
                  ? "bg-[#2874F0] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span>{stars}</span>
              <Star size={11} className="fill-current" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Reviews Stream ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-20 text-center text-gray-500 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-[#2874F0] mx-auto mb-2" />
          Loading user reviews...
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="py-16 text-center text-gray-500 text-xs bg-white rounded border border-gray-200">
          <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="font-bold text-gray-700 text-sm">No reviews found</p>
          <p className="mt-1">Try clearing your rating filter or keyword.</p>
        </div>
      ) : (
        <div className="bg-white rounded-md border border-gray-200 divide-y divide-gray-100 shadow-xs">
          {filteredReviews.map((r) => (
            <div key={r.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start justify-between gap-4 hover:bg-gray-50/50 transition-colors">
              <div className="space-y-2 flex-1">
                {/* Rating badge & title */}
                <div className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold text-white ${
                      r.rating >= 4
                        ? "bg-[#388E3C]"
                        : r.rating === 3
                        ? "bg-[#f59e0b]"
                        : "bg-[#e53935]"
                    }`}
                  >
                    <span>{r.rating}</span>
                    <Star size={11} className="fill-current" />
                  </span>
                  <span className="font-bold text-sm text-[#212121]">{r.title}</span>
                </div>

                {/* Comment */}
                <p className="text-xs text-gray-700 leading-relaxed max-w-3xl">{r.comment}</p>

                {/* User & meta */}
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 pt-1">
                  <span className="font-semibold text-gray-700">{r.userName}</span>
                  {r.isVerifiedPurchase && (
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <CheckCircle2 size={12} />
                      Verified Buyer
                    </span>
                  )}
                  <span>
                    {r.createdAt
                      ? new Date(r.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Recently"}
                  </span>
                  {r.helpfulCount > 0 && (
                    <span className="flex items-center gap-1 text-gray-500">
                      <ThumbsUp size={11} /> {r.helpfulCount} helpful votes
                    </span>
                  )}
                  <span className="text-gray-500">
                    <span className="font-semibold text-gray-600">Product:</span>{" "}
                    <span className="text-gray-700">{r.productName || "Unknown Product"}</span>
                    {r.productId ? <span className="font-mono text-[10px] text-gray-400 ml-1">({r.productId})</span> : null}
                  </span>
                </div>
              </div>

              {/* Delete Action */}
              <Button
                size="sm"
                variant="outline"
                disabled={deletingId === r.id}
                onClick={() => handleDelete(r.id)}
                className="text-xs text-gray-400 hover:text-red-600 hover:border-red-200 shrink-0"
              >
                <Trash2 size={13} className="mr-1" />
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
