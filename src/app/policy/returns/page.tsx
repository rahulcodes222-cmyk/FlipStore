import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Return Policy - FlipStore",
  description: "FlipStore Return and Refund Policy",
};

export default function ReturnsPolicyPage() {
  return (
    <div className="bg-[#F1F3F6] min-h-screen py-12">
      <div className="max-w-[800px] mx-auto px-4">
        <div className="bg-white border border-[#E0E0E0] rounded-sm p-6 sm:p-12 shadow-sm">
          <h1 className="text-2xl font-bold text-[#212121] mb-6">Return Policy</h1>
          <p className="text-[#555] leading-relaxed mb-4">
            At FlipStore, we want you to be happy with your purchase. If you&rsquo;re not satisfied,
            you can return most items within 7 days of delivery.
          </p>
          <p className="text-[#555] leading-relaxed mb-4">
            Items must be in original condition with all tags and packaging intact. COD orders are
            eligible for return subject to verification.
          </p>
          <Link href="/" className="text-[#2874F0] font-semibold hover:underline">
            &larr; Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}