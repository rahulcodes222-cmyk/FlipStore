import { Metadata } from "next";
import HelpPageClient from "../(store)/help/[slug]/HelpPageClient";

export const metadata: Metadata = {
  title: "Advertise with Us | FlipStore",
  description: "Advertise your brand on FlipStore.",
};

export default function AdvertisePage() {
  return <HelpPageClient slug="advertise" showRelatedTabs={false} />;
}
