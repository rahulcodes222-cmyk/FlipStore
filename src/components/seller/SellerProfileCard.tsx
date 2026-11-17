"use client";

import Link from "next/link";
import { User, Mail, Phone, Calendar, ShieldCheck, Edit, Store } from "lucide-react";
import type { Seller } from "@/types";
import { SellerStatusBadge } from "./SellerStatusBadge";
import { cn } from "@/lib/utils";

interface SellerProfileCardProps {
  seller: Seller & Record<string, any>;
  className?: string;
}

export function SellerProfileCard({ seller, className }: SellerProfileCardProps) {
  const logo = seller.avatar || seller.storeLogo || "";
  const joined = seller.joinedAt || seller.createdAt;
  const sellerId = seller.sellerId || seller.id || "â€”";
  const status = seller.applicationStatus || seller.verificationStatus || "Pending";

  return (
    <div className={cn("rounded-sm border border-[#E0E0E0] bg-white p-5 shadow-sm", className)}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-[#eaf2ff] flex items-center justify-center overflow-hidden border border-[#E0E0E0]">
            {logo ? (
              <img src={logo} alt={seller.storeName || seller.name || "Seller"} className="w-full h-full object-cover" />
            ) : (
              <User size={24} className="text-[#2874F0]" />
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-base font-bold text-[#212121] truncate">{seller.storeName || seller.name || "Seller"}</span>
            <SellerStatusBadge status={status} size="sm" />
          </div>
          {seller.name && seller.storeName && seller.name !== seller.storeName && (
            <p className="text-xs text-[#878787] truncate">{seller.name}</p>
          )}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(seller.businessEmail || seller.email) && (
              <div className="flex items-center gap-2 text-sm min-w-0">
                <Mail size={14} className="text-[#878787] shrink-0" />
                <span className="text-[#212121] truncate">{seller.businessEmail || seller.email}</span>
              </div>
            )}
            {(seller.businessPhone || seller.phone) && (
              <div className="flex items-center gap-2 text-sm min-w-0">
                <Phone size={14} className="text-[#878787] shrink-0" />
                <span className="text-[#212121] truncate">{seller.businessPhone || seller.phone}</span>
              </div>
            )}
            {joined && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={14} className="text-[#878787] shrink-0" />
                <span className="text-[#212121]">Joined {new Date(joined).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm min-w-0">
              <ShieldCheck size={14} className="text-[#878787] shrink-0" />
              <span className="text-[#212121] truncate">Seller ID: {sellerId}</span>
            </div>
            {seller.storeSlug && (
              <div className="flex items-center gap-2 text-sm min-w-0 sm:col-span-2">
                <Store size={14} className="text-[#878787] shrink-0" />
                <span className="text-[#212121] truncate">/seller/{seller.storeSlug}</span>
              </div>
            )}
          </div>
          <Link href="/seller/store" className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#2874F0] hover:underline">
            <Edit size={14} />
            <span>Manage Store</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

