import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Security - FlipStore",
  description: "FlipStore Security Policy",
};

export default function SecurityPage() {
  return (
    <div className="bg-[#F1F3F6] min-h-screen py-12">
      <div className="max-w-[800px] mx-auto px-4">
        <div className="bg-white border border-[#E0E0E0] rounded-sm p-6 sm:p-12 shadow-sm">
          <h1 className="text-2xl font-bold text-[#212121] mb-6">Security</h1>
          <p className="text-[#555] leading-relaxed mb-4">
            Your security is our priority. FlipStore uses industry-standard encryption to protect
            your personal and payment information.
          </p>
          <p className="text-[#555] leading-relaxed mb-4">
            All transactions are processed through secure payment gateways. We never store your
            full card details on our servers.
          </p>
          <Link href="/" className="text-[#2874F0] font-semibold hover:underline">
            &larr; Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}