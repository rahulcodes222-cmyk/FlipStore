import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { APP_CONFIG } from "@/lib/theme";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: `${APP_CONFIG.appName} – Online Shopping India`,
    template: `%s | ${APP_CONFIG.appName}`,
  },
  description:
    "Shop the latest electronics, mobiles, fashion, home appliances and more at the best prices. Free delivery on orders above ₹500. Easy returns & EMI available.",
  keywords: [
    "online shopping",
    "flipkart",
    "amazon",
    "india ecommerce",
    "mobiles",
    "electronics",
    "fashion",
    "best prices",
  ],
  authors: [{ name: "FlipStore India" }],
  creator: "FlipStore India",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: APP_CONFIG.appName,
    title: `${APP_CONFIG.appName} – Online Shopping India`,
    description:
      "India's most trusted online shopping destination. Best prices on electronics, fashion, appliances and more.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#2874F0",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[#F1F3F6] text-[#212121] antialiased overflow-x-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
