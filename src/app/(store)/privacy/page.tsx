import { Metadata } from "next";
import HelpPageClient from "../help/[slug]/HelpPageClient";

export const metadata: Metadata = {
  title: "Privacy Policy | FlipStore",
  description: "FlipStore Privacy Policy.",
};

export default function PrivacyPage() {
  return <HelpPageClient slug="privacy" showRelatedTabs={false} />;
}
