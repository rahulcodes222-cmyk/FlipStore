import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-[#F1F3F6] flex items-center justify-center p-4">
      <div className="bg-white border border-[#E0E0E0] rounded-sm p-8 sm:p-12 max-w-md w-full text-center shadow-xs">
        <div className="text-6xl font-black text-[#2874F0] mb-2 tracking-tight">404</div>
        <h1 className="text-xl font-bold text-[#212121] mb-2">Page Not Found</h1>
        <p className="text-xs text-[#878787] leading-relaxed mb-6">
          The page you are looking for does not exist, has been removed, or is temporarily unavailable.
        </p>

        <div className="space-y-3">
          <Link href="/" className="block">
            <Button variant="primary" fullWidth className="text-xs font-bold">
              <ArrowLeft size={14} className="mr-2" /> Back to Homepage
            </Button>
          </Link>
          <Link href="/offers" className="block">
            <Button variant="outline" fullWidth className="text-xs font-bold">
              <ShoppingBag size={14} className="mr-2" /> Explore Top Offers
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
