"use client";

import Link from "next/link";
import { User, Store, Mail, Phone, Calendar, ShieldCheck, Edit } from "lucide-react";
import type { Seller } from "@/types";
import { SellerStatusBadge } from "./SellerStatusBadge";
import { cn } from "@/lib/utils";

interface SellerProfileCardProps {
  seller: Seller;
  className?: string;
}

export function SellerProfileCard({ seller, className }: SellerProfileCardProps) {
  return (
    <div className={cn("rounded-sm border border-[#E0E0E0] bg-white p-5 shadow-sm", className)}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-[#eaf2ff] flex items-center justify-center overflow-hidden border border-[#E0E0E0]">
            {seller.avatar ? (
              <img src={seller.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={24} className="text-[#2874F0]" />
            )}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-bold text-[#212121]">{seller.name}</span>
            <SellerStatusBadge status={seller.verificationStatus} size="sm" />
          </div>
          <p className="text-xs text-[#878787] truncate">{seller.storeName}</p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail size={14} className="text-[#878787]" />
              <span className="text-[#212121]">{seller.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone size={14} className="text-[#878787]" />
              <span className="text-[#212121]">{seller.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={14} className="text-[#878787]" />
              <span className="text-[#212121]">
                Joined {new Date(seller.joinedAt).toLocaleDateString("en-IN", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck size={14} className="text-[#878787]" />
              <span className="text-[#212121]">Seller ID: {seller.sellerId}</span>
            </div>
          </div>
          <Link
            href="/seller/profile"
            className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#2874F0] hover:underline"
          >
            <Edit size={14} />
            <span>Edit Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
