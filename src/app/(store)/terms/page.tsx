import { Metadata } from "next";
import HelpPageClient from "../help/[slug]/HelpPageClient";

export const metadata: Metadata = {
  title: "Terms of Use | FlipStore",
  description: "FlipStore Terms of Use.",
};

export default function TermsPage() {
  return <HelpPageClient slug="terms" showRelatedTabs={false} />;
}
