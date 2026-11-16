import { redirect } from "next/navigation";

export const instant = false;

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProductSlugRedirectPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/product/${slug}`);
}
