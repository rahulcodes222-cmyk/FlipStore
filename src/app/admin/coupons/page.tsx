import type { Metadata } from "next";
import { AdminCouponsClient } from "./AdminCouponsClient";

export const metadata: Metadata = {
  title: "Coupon Management | FlipStore Admin",
  description: "Create, edit, and manage discount promo vouchers and deals.",
};

export default function AdminCouponsPage() {
  return <AdminCouponsClient />;
}
