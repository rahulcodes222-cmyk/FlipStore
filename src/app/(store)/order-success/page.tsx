import React, { Suspense } from "react";
import type { Metadata } from "next";
import { OrderSuccessClient } from "./OrderSuccessClient";

export const metadata: Metadata = {
  title: "Order Placed Successfully | FlipStore India",
  description: "Your order has been placed successfully and will be delivered shortly.",
};

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[800px] mx-auto p-12 text-center text-sm text-[#878787]">
          Loading order confirmation...
        </div>
      }
    >
      <OrderSuccessClient />
    </Suspense>
  );
}
