"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] bg-[#F1F3F6] flex items-center justify-center p-4">
      <div className="bg-white border border-[#E0E0E0] rounded-sm p-8 sm:p-12 max-w-md w-full text-center shadow-xs">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} />
        </div>
        <h1 className="text-xl font-bold text-[#212121] mb-2">Something went wrong</h1>
        <p className="text-xs text-[#878787] leading-relaxed mb-6">
          An unexpected error occurred while processing your request. Please try again.
        </p>

        <div className="space-y-3">
          <Button
            type="button"
            variant="primary"
            fullWidth
            onClick={() => reset()}
            className="text-xs font-bold"
          >
            <RotateCcw size={14} className="mr-2" /> Try Again
          </Button>

          <Link href="/" className="block">
            <Button variant="outline" fullWidth className="text-xs font-bold">
              <Home size={14} className="mr-2" /> Go to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
