import React, { Suspense } from "react";
import type { Metadata } from "next";
import { CustomerDashboardClient } from "./CustomerDashboardClient";

export const metadata: Metadata = {
  title: "My Account | FlipStore India",
  description: "Manage your profile, view orders, saved addresses, wishlist, and account settings.",
};

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1200px] mx-auto p-12 text-center text-sm text-[#878787]">
          Loading your customer dashboard...
        </div>
      }
    >
      <CustomerDashboardClient />
    </Suspense>
  );
}
