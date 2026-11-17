import React from "react";
import Link from "next/link";
import { Store, TrendingUp, ShieldCheck, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SellPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 py-10">
      <div className="bg-white border border-[#E0E0E0] rounded-sm p-6 sm:p-12 text-center max-w-3xl mx-auto shadow-sm">
        <div className="w-16 h-16 rounded-full bg-[#E8F5E9] text-[#388E3C] flex items-center justify-center mx-auto mb-4">
          <Store size={36} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#212121]">
          Sell to 50+ Crore Customers on FlipStore
        </h1>
        <p className="text-sm text-[#878787] mt-2 max-w-md mx-auto">
          Submit your business details to apply as a seller. Admin will review and approve/reject your request before dashboard access is enabled.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-8 text-left">
          <div className="p-4 bg-[#F9FAFB] border border-[#F0F0F0] rounded-xs">
            <TrendingUp size={20} className="text-[#2874F0] mb-2" />
            <h4 className="font-bold text-sm text-[#212121]">Access 50Cr+ Users</h4>
            <p className="text-xs text-[#878787] mt-1">Instant reach across 19,000+ pincodes in India.</p>
          </div>
          <div className="p-4 bg-[#F9FAFB] border border-[#F0F0F0] rounded-xs">
            <CheckCircle size={20} className="text-[#388E3C] mb-2" />
            <h4 className="font-bold text-sm text-[#212121]">Approval-Based Access</h4>
            <p className="text-xs text-[#878787] mt-1">Fill details, submit application, and get admin approval.</p>
          </div>
          <div className="p-4 bg-[#F9FAFB] border border-[#F0F0F0] rounded-xs">
            <ShieldCheck size={20} className="text-[#FB641B] mb-2" />
            <h4 className="font-bold text-sm text-[#212121]">Secure Onboarding</h4>
            <p className="text-xs text-[#878787] mt-1">Business, address, and bank details are reviewed by admin.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/seller/register">
            <Button variant="buyNow" size="lg" className="w-full sm:w-auto">
              Apply to Become a Seller
            </Button>
          </Link>
          <Link href="/seller/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Seller Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
