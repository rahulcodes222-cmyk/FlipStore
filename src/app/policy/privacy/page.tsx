import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - FlipStore",
  description: "FlipStore Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="bg-[#F1F3F6] min-h-screen py-12">
      <div className="max-w-[800px] mx-auto px-4">
        <div className="bg-white border border-[#E0E0E0] rounded-sm p-6 sm:p-12 shadow-sm">
          <h1 className="text-2xl font-bold text-[#212121] mb-6">Privacy Policy</h1>
          <p className="text-[#555] leading-relaxed mb-4">
            FlipStore respects your privacy. We collect personal information only to process your
            orders and improve your shopping experience.
          </p>
          <p className="text-[#555] leading-relaxed mb-4">
            We do not sell or share your data with third parties except as necessary to deliver
            your orders (e.g., shipping partners, payment providers).
          </p>
          <Link href="/" className="text-[#2874F0] font-semibold hover:underline">
            &larr; Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}