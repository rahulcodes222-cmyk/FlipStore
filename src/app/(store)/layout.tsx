import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

/**
 * Store Layout
 * Wraps all public-facing pages with Header + Footer.
 * Route group: (store)
 */
export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1 min-h-[60vh] overflow-x-hidden transition-all duration-200">{children}</main>
      <Footer />
    </>
  );
}
