import { Metadata } from "next";
import HelpPageClient from "../help/[slug]/HelpPageClient";

export const metadata: Metadata = {
  title: "FAQ | FlipStore",
  description: "Frequently asked questions about shopping with us.",
};

export default function FAQPage() {
  return <HelpPageClient slug="faq" showRelatedTabs={false} />;
}
