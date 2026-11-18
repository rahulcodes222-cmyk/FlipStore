import type { Metadata } from "next";
import { AdminSupportTicketsClient } from "./AdminSupportTicketsClient";

export const metadata: Metadata = {
  title: "Seller Support | FlipStore Admin",
  description: "View and manage seller help & support messages.",
};

export default function AdminSupportTicketsPage() {
  return <AdminSupportTicketsClient />;
}
