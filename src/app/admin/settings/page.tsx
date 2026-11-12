import type { Metadata } from "next";
import { AdminSettingsClient } from "./AdminSettingsClient";

export const metadata: Metadata = {
  title: "Store Settings | FlipStore Admin",
  description: "Configure store identity, delivery thresholds, taxes, and announcements.",
};

export default function AdminSettingsPage() {
  return <AdminSettingsClient />;
}
