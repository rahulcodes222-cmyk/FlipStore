import type { Metadata } from "next";
import { AdminOrdersClient } from "./AdminOrdersClient";

export const metadata: Metadata = {
  title: "Order Management | FlipStore Admin",
  description: "View customer orders, tracking history, invoice totals, and update shipment stages.",
};

export default function AdminOrdersPage() {
  return <AdminOrdersClient />;
}
