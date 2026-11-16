"use client";

import { SellerDashboardLayout } from "@/components/seller/SellerDashboardLayout";

export default function SellerDashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SellerDashboardLayout>{children}</SellerDashboardLayout>;
}
