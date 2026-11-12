import type { Metadata } from "next";
import { AdminCustomersClient } from "./AdminCustomersClient";

export const metadata: Metadata = {
  title: "Customer Directory | FlipStore Admin",
  description: "View and search verified shoppers, account status, and delivery destinations.",
};

export default function AdminCustomersPage() {
  return <AdminCustomersClient />;
}
