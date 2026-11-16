import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Advertise - FlipStore",
  description: "FlipStore Advertising",
};

export default function AdvertisePage() {
  return (
    <div className="bg-[#F1F3F6] min-h-screen py-12">
      <div className="max-w-[800px] mx-auto px-4">
        <div className="bg-white border border-[#E0E0E0] rounded-sm p-6 sm:p-12 shadow-sm">
          <h1 className="text-2xl font-bold text-[#212121] mb-6">Advertise with Us</h1>
          <p className="text-[#555] leading-relaxed mb-4">
            Reach millions of shoppers on FlipStore. Advertise your brand and grow your business
            with our platform.
          </p>
          <Link href="/" className="text-[#2874F0] font-semibold hover:underline">
            &larr; Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}