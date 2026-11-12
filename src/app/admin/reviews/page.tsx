import type { Metadata } from "next";
import { AdminReviewsClient } from "./AdminReviewsClient";

export const metadata: Metadata = {
  title: "Review Moderation | FlipStore Admin",
  description: "Inspect customer ratings, review comments, and moderate feedback.",
};

export default function AdminReviewsPage() {
  return <AdminReviewsClient />;
}
