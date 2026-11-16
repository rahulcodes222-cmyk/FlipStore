import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact Us - FlipStore",
  description: "FlipStore Contact Us",
};

export default function ContactPage() {
  return (
    <div className="bg-[#F1F3F6] min-h-screen py-12">
      <div className="max-w-[800px] mx-auto px-4">
        <div className="bg-white border border-[#E0E0E0] rounded-sm p-6 sm:p-12 shadow-sm">
          <h1 className="text-2xl font-bold text-[#212121] mb-6">Contact Us</h1>
          <p className="text-[#555] leading-relaxed mb-4">
            Have a question or need help with your order? Reach out to us and we&rsquo;ll get back
            to you as soon as possible.
          </p>
          <p className="text-[#555] mb-4">Email: support@flipstore.in</p>
          <Link href="/" className="text-[#2874F0] font-semibold hover:underline">
            &larr; Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}