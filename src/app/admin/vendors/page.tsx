import type { Metadata } from "next";
import { AdminVendorsClient } from "./AdminVendorsClient";

export const metadata: Metadata = {
  title: "Seller Requests | FlipStore Admin",
  description: "Review seller applications and approve or reject access.",
};

export default function AdminVendorsPage() {
  return <AdminVendorsClient />;
}
