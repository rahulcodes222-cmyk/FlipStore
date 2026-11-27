import { Metadata } from "next";
import HelpPageClient from "../help/[slug]/HelpPageClient";

export const metadata: Metadata = {
  title: "Payments | FlipStore",
  description: "Secure and convenient payment options for every order.",
};

export default function PaymentsPage() {
  return <HelpPageClient slug="payments" showRelatedTabs={false} />;
}
