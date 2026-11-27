import { Metadata } from "next";
import HelpPageClient from "../help/[slug]/HelpPageClient";

export const metadata: Metadata = {
  title: "Report Infringement | FlipStore",
  description: "Report copyright or trademark infringement.",
};

export default function ReportInfringementPage() {
  return <HelpPageClient slug="report" showRelatedTabs={false} />;
}
