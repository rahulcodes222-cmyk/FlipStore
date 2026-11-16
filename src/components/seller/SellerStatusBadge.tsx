"use client";

import { cn } from "@/lib/utils";
import type { SellerVerificationStatus, SellerStoreStatus } from "@/types";

interface SellerStatusBadgeProps {
  status: SellerVerificationStatus | SellerStoreStatus;
  size?: "sm" | "md";
}

const verificationStyles: Record<string, { bg: string; text: string; border: string }> = {
  PENDING: { bg: "bg-[#FFF8E1]", text: "text-[#B26A00]", border: "border-[#FFE082]" },
  VERIFIED: { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]", border: "border-[#C8E6C9]" },
  REJECTED: { bg: "bg-[#FFEBEE]", text: "text-[#C62828]", border: "border-[#FFCDD2]" },
  SUSPENDED: { bg: "bg-[#F5F5F5]", text: "text-[#616161]", border: "border-[#E0E0E0]" },
  Draft: { bg: "bg-[#F5F5F5]", text: "text-[#616161]", border: "border-[#E0E0E0]" },
  Pending: { bg: "bg-[#FFF8E1]", text: "text-[#B26A00]", border: "border-[#FFE082]" },
  "Under Review": { bg: "bg-[#E3F2FD]", text: "text-[#1565C0]", border: "border-[#BBDEFB]" },
  Approved: { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]", border: "border-[#C8E6C9]" },
  Rejected: { bg: "bg-[#FFEBEE]", text: "text-[#C62828]", border: "border-[#FFCDD2]" },
  Suspended: { bg: "bg-[#F5F5F5]", text: "text-[#616161]", border: "border-[#E0E0E0]" },
};

const storeStyles: Record<
  SellerStoreStatus,
  { bg: string; text: string; border: string }
> = {
  ACTIVE: { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]", border: "border-[#C8E6C9]" },
  INACTIVE: { bg: "bg-[#F5F5F5]", text: "text-[#616161]", border: "border-[#E0E0E0]" },
  VACATION: { bg: "bg-[#FFF8E1]", text: "text-[#B26A00]", border: "border-[#FFE082]" },
};

export function SellerStatusBadge({
  status,
  size = "md",
}: SellerStatusBadgeProps) {
  const isVerification = status in verificationStyles;
  const styles = isVerification ? verificationStyles[status as string] : storeStyles[status as SellerStoreStatus];

  const label = status
    .split(/(?=[A-Z])/)
    .join(" ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 font-semibold border",
        size === "sm" ? "h-6 text-[10px] px-2" : "h-7 text-[11px]",
        styles.bg,
        styles.text,
        styles.border
      )}
    >
      {label}
    </span>
  );
}
