import { Metadata } from "next";
import HelpPageClient from "../help/[slug]/HelpPageClient";

export const metadata: Metadata = {
  title: "Sitemap | FlipStore",
  description: "Quick links to important pages on FlipStore.",
};

export default function SitemapPage() {
  return <HelpPageClient slug="sitemap" showRelatedTabs={false} />;
}
