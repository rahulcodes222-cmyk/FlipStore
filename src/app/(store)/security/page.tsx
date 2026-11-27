import { Metadata } from "next";
import HelpPageClient from "../help/[slug]/HelpPageClient";

export const metadata: Metadata = {
  title: "Security | FlipStore",
  description: "FlipStore Security Policy.",
};

export default function SecurityPage() {
  return <HelpPageClient slug="security" showRelatedTabs={false} />;
}
