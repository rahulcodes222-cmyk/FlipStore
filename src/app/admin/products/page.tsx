import type { Metadata } from "next";
import { AdminProductsClient } from "./AdminProductsClient";

export const metadata: Metadata = {
  title: "Product Management | FlipStore Admin",
  description: "View, search, filter, and manage catalog inventory and stock levels.",
};

export default function AdminProductsPage() {
  return <AdminProductsClient />;
}
