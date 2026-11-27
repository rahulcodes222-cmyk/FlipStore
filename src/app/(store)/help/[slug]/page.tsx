import { Metadata } from "next";
import HelpPageClient from "./HelpPageClient";

// Slugs defined here (not imported from "use client" file) so generateStaticParams
// can be evaluated at build time without touching client-only modules.
const HELP_SLUGS = ["payments", "shipping", "returns", "faq", "report"] as const;

const HELP_META: Record<string, { title: string; description: string }> = {
  payments: { title: "Payments",                 description: "Secure and convenient payment options for every order." },
  shipping: { title: "Shipping",                 description: "Everything about delivery timelines, charges, and tracking." },
  returns:  { title: "Cancellation & Returns",   description: "Easy cancellations and hassle-free returns." },
  faq:      { title: "FAQ",                       description: "Frequently asked questions about shopping with us." },
  report:   { title: "Report Infringement",       description: "Report copyright or trademark infringement." },
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const meta = HELP_META[slug];
  return {
    title: meta ? `${meta.title} | Help | FlipStore` : "Help | FlipStore",
    description: meta?.description ?? "Help and support for FlipStore customers.",
  };
}

export function generateStaticParams() {
  return HELP_SLUGS.map((slug) => ({ slug }));
}

export default async function HelpPage({ params }: Props) {
  const { slug } = await params;
  return <HelpPageClient slug={slug} />;
}
