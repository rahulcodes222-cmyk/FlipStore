import type { Metadata } from "next";
import { MOCK_PRODUCTS } from "@/data";
import { AdminProductEditClient } from "./AdminProductEditClient";

export const instant = false;

export async function generateStaticParams() {
  return [{ id: "placeholder" }, ...MOCK_PRODUCTS.map((p) => ({ id: p.id }))];
}

export const metadata: Metadata = {
  title: "Edit Product | FlipStore Admin",
  description: "Modify product details, pricing, and stock inventory.",
};

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminProductEditPage({ params }: EditProductPageProps) {
  const { id } = await params;
  return <AdminProductEditClient productId={id} />;
}
