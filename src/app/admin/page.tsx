import type { Metadata } from "next";
import { AdminDashboardClient } from "./AdminDashboardClient";

export const metadata: Metadata = {
  title: "Admin Dashboard | FlipStore India",
  description: "Real-time store metrics, recent orders, sales chart, and inventory management.",
};

export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
