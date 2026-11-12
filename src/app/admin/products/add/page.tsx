import type { Metadata } from "next";
import { AdminProductAddClient } from "./AdminProductAddClient";

export const metadata: Metadata = {
  title: "Add New Product | FlipStore Admin",
  description: "Create a new catalog item with local image upload and real-time stock setup.",
};

export default function AdminProductAddPage() {
  return <AdminProductAddClient />;
}
