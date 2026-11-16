import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use - FlipStore",
  description: "FlipStore Terms of Use",
};

export default function TermsPage() {
  return (
    <div className="bg-[#F1F3F6] min-h-screen py-12">
      <div className="max-w-[800px] mx-auto px-4">
        <div className="bg-white border border-[#E0E0E0] rounded-sm p-6 sm:p-12 shadow-sm">
          <h1 className="text-2xl font-bold text-[#212121] mb-6">Terms of Use</h1>
          <p className="text-[#555] leading-relaxed mb-4">
            Welcome to FlipStore. By accessing or using our website and services, you agree to be
            bound by these Terms of Use.
          </p>
          <p className="text-[#555] leading-relaxed mb-4">
            Please read these terms carefully. If you do not agree, you may not use our services.
          </p>
          <Link href="/" className="text-[#2874F0] font-semibold hover:underline">
            &larr; Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}