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
  Tag,
  Star,
  RefreshCcw,
  Bell,
  Settings,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  LogOut,
} from "lucide-react";
import { useSellerStore } from "@/store/useSellerStore";
import { cn } from "@/lib/utils";

interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  group?: string;
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
      { key: "add-product", label: "Add Product", href: "/seller/add-product", icon: <PackagePlus size={18} /> },
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
    items: [
      { key: "customers", label: "Customers", href: "/seller/customers", icon: <Users size={18} /> },
    ],
  },
  {
    key: "finance",
    label: "Finance",
    items: [
      { key: "earnings", label: "Earnings", href: "/seller/earnings", icon: <CreditCard size={18} /> },
      { key: "payments", label: "Payments", href: "/seller/payments", icon: <BarChart3 size={18} /> },
    ],
  },
  {
    key: "growth",
    label: "Growth",
    items: [
      { key: "analytics", label: "Analytics", href: "/seller/analytics", icon: <BarChart3 size={18} /> },
      { key: "coupons", label: "Coupons", href: "/seller/coupons", icon: <Tag size={18} /> },
    ],
  },
  {
    key: "reviews",
    label: "Reviews",
    items: [
      { key: "reviews", label: "Reviews", href: "/seller/reviews", icon: <Star size={18} /> },
    ],
  },
  {
    key: "support",
    label: "Support",
    items: [
      { key: "notifications", label: "Notifications", href: "/seller/notifications", icon: <Bell size={18} /> },
      { key: "settings", label: "Settings", href: "/seller/settings", icon: <Settings size={18} /> },
      { key: "help", label: "Help & Support", href: "/seller/help", icon: <HelpCircle size={18} /> },
      { key: "logout", label: "Logout", href: "#", icon: <LogOut size={18} /> },
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

  const isActive = (href: string) => {
    if (href === "#") return false;
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };

  const handleLogoutClick = () => {
    logout();
    router.push("/seller/login");
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white border-r border-[#E0E0E0] flex flex-col transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex items-center justify-between px-3 py-4 border-b border-[#F0F0F0] shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Store size={20} className="text-[#2874F0]" />
              <span className="font-bold text-sm tracking-tight text-[#212121]">FlipStore</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-sm text-[#878787] hover:text-[#2874F0] transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {NAV_GROUPS.map((group) => (
            <div key={group.key} className="mb-2">
              {!collapsed && (
                <h3 className="px-3 mb-1 text-[10px] font-bold text-[#878787] uppercase tracking-wider">
                  {group.label}
                </h3>
              )}
              {group.items.map((item) => {
                const active = isActive(item.href);
                const isLogout = item.key === "logout";
                return (
                  <div key={item.key}>
                    {isLogout ? (
                      <button
                        type="button"
                        onClick={handleLogoutClick}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors",
                          active
                            ? "bg-[#2874F0]/10 text-[#2874F0]"
                            : "text-[#878787] hover:bg-[#F1F3F6] hover:text-[#212121]"
                        )}
                      >
                        <span className="w-6">{item.icon}</span>
                        <span className={cn("font-medium", collapsed ? "hidden" : "")}>
                          {item.label}
                        </span>
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => {
                          if (!collapsed) onClose();
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors",
                          active
                            ? "bg-[#2874F0]/10 text-[#2874F0]"
                            : "text-[#878787] hover:bg-[#F1F3F6] hover:text-[#212121]"
                        )}
                      >
                        <span className="w-6">{item.icon}</span>
                        {item.badge && (
                          <span className="ml-auto h-5 min-w-5 rounded-full bg-[#FB641B] text-white text-[10px] font-bold px-1.5">
                            {item.badge}
                          </span>
                        )}
                        <span className={cn("font-medium", collapsed ? "hidden" : "")}>
                          {item.label}
                        </span>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {!collapsed && (
            <div className="px-3 pt-3 border-t border-[#F0F0F0]">
              <div className="flex items-center gap-3 p-2 rounded-sm hover:bg-[#F1F3F6] cursor-pointer transition-colors">
                <div className="w-8 h-8 rounded-full bg-[#eaf2ff] flex items-center justify-center">
                  <Store size={14} className="text-[#2874F0]" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-semibold text-[#212121] truncate">
                    {seller?.storeName || seller?.name || "Seller Store"}
                  </span>
                  <span className="text-[10px] text-[#878787] truncate">{seller?.email}</span>
                </div>
              </div>
            </div>
          )}
        </nav>
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Panel */}
      {isOpen && (
        <aside
          className="fixed inset-y-0 left-0 z-[70] w-[280px] bg-white border-r border-[#E0E0E0] flex flex-col transform transition-transform duration-300 translate-x-full sm:translate-x-0"
          aria-label="Navigation drawer"
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-[#F0F0F0]">
            <div className="flex items-center gap-2">
              <Store size={20} className="text-[#2874F0]" />
              <span className="font-bold text-sm tracking-tight text-[#212121]">FlipStore</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-sm text-[#878787] hover:text-[#212121] transition-colors"
              aria-label="Close drawer"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            {NAV_GROUPS.map((group) => (
              <div key={group.key} className="mb-2">
                <h3 className="px-2 mb-1 text-[10px] font-bold text-[#878787] uppercase tracking-wider">
                  {group.label}
                </h3>
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const isLogout = item.key === "logout";
                  return (
                    <div key={item.key}>
                      {isLogout ? (
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            router.push("/seller/login");
                            onClose();
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors",
                            active
                              ? "bg-[#2874F0]/10 text-[#2874F0]"
                              : "text-[#878787] hover:bg-[#F1F3F6] hover:text-[#212121]"
                          )}
                        >
                          <span className="w-6">{item.icon}</span>
                          <span className="font-medium">{item.label}</span>
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            "flex w-full items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors",
                            active
                              ? "bg-[#2874F0]/10 text-[#2874F0]"
                              : "text-[#878787] hover:bg-[#F1F3F6] hover:text-[#212121]"
                          )}
                        >
                          <span className="w-6">{item.icon}</span>
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>
      )}
    </>
  );
}
