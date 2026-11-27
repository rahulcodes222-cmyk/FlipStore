import { Metadata } from "next";
import HelpPageClient from "../help/[slug]/HelpPageClient";

export const metadata: Metadata = {
  title: "Shipping | FlipStore",
  description: "Everything about delivery timelines, charges, and tracking.",
};

export default function ShippingPage() {
  return <HelpPageClient slug="shipping" showRelatedTabs={false} />;
}
