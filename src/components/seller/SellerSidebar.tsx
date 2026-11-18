"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  PackagePlus,
  Package,
  ShoppingCart,
  PackageCheck,
  Users,
  CreditCard,
  BarChart3,
  // Tag,
  Star,
  RefreshCcw,
  Bell,
  Settings,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  LogOut,
  X,
} from "lucide-react";
import { useSellerStore } from "@/store/useSellerStore";
import { cn } from "@/lib/utils";
import { sellerAuthService } from "@/services/sellerAuthService";

interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface GroupDef {
  key: string;
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: GroupDef[] = [
  {
    key: "main",
    label: "Main",
    items: [
      { key: "dashboard", label: "Dashboard", href: "/seller/dashboard", icon: <LayoutDashboard size={18} /> },
      { key: "store", label: "My Store", href: "/seller/store", icon: <Store size={18} /> },
    ],
  },
  {
    key: "catalog",
    label: "Catalog",
    items: [
      { key: "products", label: "Products", href: "/seller/products", icon: <Package size={18} /> },
      { key: "add-product", label: "Add Product", href: "/seller/products/add", icon: <PackagePlus size={18} /> },
      { key: "inventory", label: "Inventory", href: "/seller/inventory", icon: <PackageCheck size={18} /> },
    ],
  },
  {
    key: "sales",
    label: "Sales",
    items: [
      { key: "orders", label: "Orders", href: "/seller/orders", icon: <ShoppingCart size={18} /> },
      { key: "returns", label: "Returns", href: "/seller/returns", icon: <RefreshCcw size={18} /> },
    ],
  },
  {
    key: "customers",
    label: "Customers",
    items: [{ key: "customers", label: "Customers", href: "/seller/customers", icon: <Users size={18} /> }],
  },
  {
    key: "finance",
    label: "Finance",
    items: [
      { key: "earnings", label: "Earnings", href: "/seller/earnings", icon: <CreditCard size={18} /> },
      { key: "payments", label: "Payments", href: "/seller/payments", icon: <BarChart3 size={18} /> },
      { key: "transactions", label: "Transactions", href: "/seller/transactions", icon: <BarChart3 size={18} /> },
    ],
  },
  // {
  //   key: "growth",
  //   label: "Growth",
  //   items: [
  //     { key: "analytics", label: "Analytics", href: "/seller/analytics", icon: <BarChart3 size={18} /> },
  //     { key: "coupons", label: "Coupons", href: "/seller/coupons", icon: <Tag size={18} /> },
  //   ],
  // },
  {
    key: "reviews",
    label: "Reviews",
    items: [{ key: "reviews", label: "Reviews", href: "/seller/reviews", icon: <Star size={18} /> }],
  },
  {
    key: "support",
    label: "Support",
    items: [
      { key: "notifications", label: "Notifications", href: "/seller/notifications", icon: <Bell size={18} /> },
      { key: "settings", label: "Settings", href: "/seller/settings", icon: <Settings size={18} /> },
      { key: "profile", label: "Profile", href: "/seller/profile", icon: <Store size={18} /> },
      { key: "help", label: "Help & Support", href: "/seller/help", icon: <HelpCircle size={18} /> },
    ],
  },
];

interface SellerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export function SellerSidebar({ isOpen, onClose, collapsed, setCollapsed }: SellerSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { seller, logout } = useSellerStore();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const handleLogout = async () => {
    try { await sellerAuthService.logout(); } catch { logout(); }
    onClose();
    router.replace("/seller/login");
  };

  const navContent = (isMobile: boolean) => (
    <>
      <div className={cn("flex items-center justify-between border-b border-[#F0F0F0] shrink-0", isMobile ? "px-4 py-4" : "px-3 py-4")}>
        {(!collapsed || isMobile) ? (
          <div className="flex items-center gap-2 min-w-0">
            <Store size={20} className="text-[#2874F0] shrink-0" />
            <span className="font-bold text-sm tracking-tight text-[#212121] truncate">Seller Hub</span>
          </div>
        ) : <span />}
        {isMobile ? (
          <button type="button" onClick={onClose} className="p-1.5 rounded-sm text-[#878787] hover:text-[#212121]" aria-label="Close menu"><X size={18} /></button>
        ) : (
          <button type="button" onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-sm text-[#878787] hover:text-[#2874F0]" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {NAV_GROUPS.map((group) => (
          <div key={group.key} className="mb-2">
            {(!collapsed || isMobile) && (
              <h3 className="px-3 mb-1 text-[10px] font-bold text-[#878787] uppercase tracking-wider">{group.label}</h3>
            )}
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => { if (isMobile) onClose(); }}
                  title={collapsed && !isMobile ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors",
                    active ? "bg-[#2874F0]/10 text-[#2874F0]" : "text-[#666] hover:bg-[#F1F3F6] hover:text-[#212121]",
                    collapsed && !isMobile ? "justify-center px-2" : ""
                  )}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {(!collapsed || isMobile) && <span className="font-medium truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-[#F0F0F0] p-2 shrink-0">
        {(!collapsed || isMobile) && (
          <div className="px-2 py-2 mb-1">
            <p className="text-xs font-semibold text-[#212121] truncate">{seller?.storeName || seller?.name || "Seller"}</p>
            <p className="text-[10px] text-[#878787] truncate">{seller?.email || ""}</p>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed && !isMobile ? "Logout" : undefined}
          className={cn("flex w-full items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-[#D32F2F] hover:bg-red-50 transition-colors", collapsed && !isMobile ? "justify-center px-2" : "")}
        >
          <LogOut size={18} className="shrink-0" />
          {(!collapsed || isMobile) && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className={cn("hidden lg:flex fixed inset-y-0 left-0 z-40 bg-white border-r border-[#E0E0E0] flex-col transition-all duration-300", collapsed ? "w-16" : "w-64")}>
        {navContent(false)}
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside className={cn("fixed inset-y-0 left-0 z-[70] w-[280px] max-w-[85vw] bg-white border-r border-[#E0E0E0] flex flex-col lg:hidden transform transition-transform duration-300", isOpen ? "translate-x-0" : "-translate-x-full")}>
        {navContent(true)}
      </aside>
    </>
  );
}
