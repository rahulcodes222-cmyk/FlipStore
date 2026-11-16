import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sitemap - FlipStore",
  description: "FlipStore Sitemap",
};

export default function SitemapPage() {
  return (
    <div className="bg-[#F1F3F6] min-h-screen py-12">
      <div className="max-w-[800px] mx-auto px-4">
        <div className="bg-white border border-[#E0E0E0] rounded-sm p-6 sm:p-12 shadow-sm">
          <h1 className="text-2xl font-bold text-[#212121] mb-6">Sitemap</h1>
          <nav className="text-[#555] leading-relaxed space-y-2">
            <Link href="/" className="block hover:text-[#2874F0]">Home</Link>
            <Link href="/products" className="block hover:text-[#2874F0]">Products</Link>
            <Link href="/orders" className="block hover:text-[#2874F0]">My Orders</Link>
            <Link href="/account" className="block hover:text-[#2874F0]">Account</Link>
            <Link href="/cart" className="block hover:text-[#2874F0]">Cart</Link>
          </nav>
          <Link href="/" className="text-[#2874F0] font-semibold hover:underline mt-4 inline-block">
            &larr; Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}