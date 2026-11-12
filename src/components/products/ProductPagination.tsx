"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function ProductPagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: ProductPaginationProps) {
  if (totalPages <= 1) return null;

  // Generate page numbers to show (e.g. 1, 2, 3...)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-4 bg-white border border-[#E0E0E0] rounded-sm p-3.5 shadow-2xs text-xs", className)}>
      <div className="text-[#878787] font-medium">
        Page <span className="font-bold text-[#212121]">{currentPage}</span> of{" "}
        <span className="font-bold text-[#212121]">{totalPages}</span>
      </div>

      <nav aria-label="Pagination" className="flex items-center gap-1.5">
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={cn(
            "px-2.5 py-1.5 rounded-xs border font-bold flex items-center gap-1 transition-colors",
            currentPage <= 1
              ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
              : "border-[#E0E0E0] text-[#2874F0] hover:bg-blue-50 cursor-pointer"
          )}
        >
          <ChevronLeft size={14} />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Number Buttons */}
        {pages.map((p, idx) => {
          if (p === "...") {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 py-1 text-gray-400">
                ...
              </span>
            );
          }

          const pageNum = p as number;
          const isActive = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={cn(
                "w-8 h-8 rounded-xs font-bold transition-colors cursor-pointer flex items-center justify-center",
                isActive
                  ? "bg-[#2874F0] text-white shadow-xs"
                  : "border border-[#E0E0E0] text-[#212121] hover:bg-gray-100"
              )}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={cn(
            "px-2.5 py-1.5 rounded-xs border font-bold flex items-center gap-1 transition-colors",
            currentPage >= totalPages
              ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50"
              : "border-[#E0E0E0] text-[#2874F0] hover:bg-blue-50 cursor-pointer"
          )}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={14} />
        </button>
      </nav>
    </div>
  );
}
