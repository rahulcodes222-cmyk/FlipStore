import { Metadata } from "next";
import HelpPageClient from "../(store)/help/[slug]/HelpPageClient";

export const metadata: Metadata = {
  title: "Become an Affiliate | FlipStore",
  description: "Join the FlipStore affiliate program.",
};

export default function AffiliatePage() {
  return <HelpPageClient slug="affiliate" showRelatedTabs={false} />;
}
