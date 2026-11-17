import type { Metadata } from "next";
import { AdminProductApprovalsClient } from "./AdminProductApprovalsClient";

export const metadata: Metadata = {
  title: "Product Approvals | FlipStore Admin",
  description: "Review, approve, reject, or request changes for seller-submitted products.",
};

export default function AdminProductApprovalsPage() {
  return <AdminProductApprovalsClient />;
}
