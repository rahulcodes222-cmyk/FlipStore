import { Metadata } from "next";
import HelpPageClient from "../help/[slug]/HelpPageClient";

export const metadata: Metadata = {
  title: "Cancellation & Returns | FlipStore",
  description: "Easy cancellations and hassle-free returns.",
};

export default function ReturnsHelpPage() {
  return <HelpPageClient slug="returns" showRelatedTabs={false} />;
}
