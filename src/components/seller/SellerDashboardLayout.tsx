"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { SellerSidebar } from "./SellerSidebar";
import { SellerHeader } from "./SellerHeader";
import { cn } from "@/lib/utils";

interface SellerDashboardLayoutProps {
  children: React.ReactNode;
}

export function SellerDashboardLayout({ children }: SellerDashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isHydrated = useHydration();
  const { seller, isAuthenticated, logout } = useSellerStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    const status = String(seller?.applicationStatus || seller?.verificationStatus || "").toLowerCase();
    const isApprovedSeller = isAuthenticated && !!seller && status === "approved";
    if (!isApprovedSeller) {
      if (isAuthenticated) logout();
      router.replace("/seller/login");
    }
  }, [isAuthenticated, seller, isHydrated, router, logout]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  if (!isHydrated) {
    return <div className="min-h-screen bg-[#F1F3F6] flex items-center justify-center text-sm text-[#878787]">Loading seller dashboard...</div>;
  }

  const status = String(seller?.applicationStatus || seller?.verificationStatus || "").toLowerCase();
  if (!isAuthenticated || !seller || status !== "approved") {
    return <div className="min-h-screen bg-[#F1F3F6] flex items-center justify-center text-sm text-[#878787]">Redirecting to seller login...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F1F3F6] flex">
      <SellerSidebar
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div className={cn("flex-1 flex flex-col min-w-0 transition-all duration-300", collapsed ? "lg:pl-16" : "lg:pl-64")}>
        <SellerHeader
          onOpenDrawer={() => setDrawerOpen(true)}
          title="Seller Dashboard"
        />
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
