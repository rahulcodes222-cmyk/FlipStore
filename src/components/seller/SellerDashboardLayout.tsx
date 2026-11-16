"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useHydration } from "@/hooks/useHydration";
import { useSellerStore } from "@/store/useSellerStore";
import { cn } from "@/lib/utils";
import { SellerSidebar } from "./SellerSidebar";
import { SellerHeader } from "./SellerHeader";

const LAYOUT_ROUTES = [
  "/seller/dashboard",
  "/seller/profile",
  "/seller/store",
  "/seller/settings",
  "/seller/notifications",
  "/seller/help",
  "/seller/products",
  "/seller/add-product",
  "/seller/orders",
  "/seller/inventory",
  "/seller/customers",
  "/seller/earnings",
  "/seller/payments",
  "/seller/transactions",
  "/seller/analytics",
  "/seller/coupons",
  "/seller/reviews",
  "/seller/returns",
];

interface SellerDashboardLayoutProps {
  children: React.ReactNode;
}

export function SellerDashboardLayout({ children }: SellerDashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isHydrated = useHydration();
  const { seller, isAuthenticated } = useSellerStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    const isLayoutRoute = LAYOUT_ROUTES.some(
      (r) => pathname === r || pathname.startsWith(r + "/")
    );
    if (isLayoutRoute && !isAuthenticated) {
      router.replace("/seller/login");
    }
  }, [pathname, isAuthenticated, isHydrated, router]);

  const currentSeller = isHydrated ? seller : null;

  return (
    <div className="flex h-full w-full bg-[#F1F3F6]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-[#E0E0E0] bg-white z-20 shrink-0">
        <SellerSidebar
          isOpen={false}
          onClose={() => {}}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      </aside>

      {/* Main Content */}
      <div className={cn("flex-1 flex flex-col min-w-0", collapsed ? "lg:ml-16" : "lg:ml-64")}>
        <SellerHeader
          onOpenDrawer={() => setDrawerOpen(true)}
          title="Seller Dashboard"
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-[calc(100vh-80px)]">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Panel */}
      {drawerOpen && (
        <aside className="fixed inset-y-0 left-0 z-[70] w-[280px] bg-white border-r border-[#E0E0E0] flex flex-col lg:hidden transform transition-transform duration-300 -translate-x-full sm:translate-x-0">
          <SellerSidebar
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            collapsed={false}
            setCollapsed={setCollapsed}
          />
        </aside>
      )}
    </div>
  );
}
