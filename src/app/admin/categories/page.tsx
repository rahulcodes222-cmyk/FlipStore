import type { Metadata } from "next";
import { AdminCategoriesClient } from "./AdminCategoriesClient";

export const metadata: Metadata = {
  title: "Categories Management | FlipStore Admin",
  description: "Add, edit, or delete store categories, slugs, and banners.",
};

export default function AdminCategoriesPage() {
  return <AdminCategoriesClient />;
}
