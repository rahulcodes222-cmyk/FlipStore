import React from "react";
import type { Metadata } from "next";
import { OrderDetailsClient } from "./OrderDetailsClient";

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export async function generateMetadata({ params }: OrderPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Order Details #${id} | FlipStore India`,
    description: `Track shipment and view order details for order #${id}`,
  };
}

export default async function OrderDetailsPage({ params }: OrderPageProps) {
  const { id } = await params;
  return <OrderDetailsClient orderId={id} />;
}
