import React from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHomeLink?: boolean;
  variant?: "card" | "inline";
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "We encountered an unexpected error while processing your request. Please try again.",
  onRetry,
  showHomeLink = true,
  variant = "card",
  className,
}: ErrorStateProps) {
  // Inline banner variant (ideal for form errors or section-level errors)
  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-start gap-3 p-4 bg-[#FFEBEE] border border-[#FFCDD2] rounded-sm text-[#D32F2F]",
          className
        )}
        role="alert"
      >
        <AlertCircle size={20} className="shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          {title && <h5 className="font-semibold mb-0.5">{title}</h5>}
          <p className="text-xs text-[#B71C1C] leading-relaxed">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs font-bold underline hover:opacity-80 shrink-0 cursor-pointer"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // Card Variant (ideal for page-level or block-level failed queries)
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-white rounded-sm border border-[#E0E0E0] shadow-2xs max-w-lg mx-auto my-6",
        className
      )}
      role="alert"
    >
      <div className="w-16 h-16 rounded-full bg-[#FFEBEE] flex items-center justify-center text-[#D32F2F] mb-4">
        <AlertCircle size={36} />
      </div>

      <h3 className="text-lg font-bold text-[#212121] mb-2">{title}</h3>
      <p className="text-sm text-[#878787] max-w-sm mb-6 leading-relaxed">
        {message}
      </p>

      <div className="flex items-center gap-3">
        {onRetry && (
          <Button
            variant="primary"
            size="default"
            onClick={onRetry}
            leftIcon={<RefreshCw size={16} />}
          >
            Try Again
          </Button>
        )}

        {showHomeLink && (
          <Link href="/">
            <Button variant="outline" size="default" leftIcon={<Home size={16} />}>
              Go to Home
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
