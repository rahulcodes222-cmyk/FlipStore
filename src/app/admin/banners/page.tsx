import type { Metadata } from "next";
import { AdminBannersClient } from "./AdminBannersClient";

export const metadata: Metadata = {
  title: "Banners | FlipStore Admin",
  description: "Upload and manage homepage banners.",
};

export default function AdminBannersPage() {
  return <AdminBannersClient />;
}
