"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Globe,
  Share2,
  Link2,
  MessageCircle,
  Shield,
  Truck,
  RefreshCw,
  Headphones,
  CreditCard,
} from "lucide-react";
import {
  getStoreName,
  getSupportEmail,
  getSupportPhone,
} from "@/lib/storeSettings";

const FOOTER_LINKS = {
  "About": [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Press", href: "/press" },
    { label: "Corporate Information", href: "/corporate" },
  ],
  "Help": [
    { label: "Payments", href: "/payments" },
    { label: "Shipping", href: "/shipping" },
    { label: "Cancellation & Returns", href: "/returns" },
    { label: "FAQ", href: "/faq" },
    { label: "Report Infringement", href: "/report-infringement" },
  ],
  "Policy": [
    { label: "Return Policy", href: "/returns" },
    { label: "Terms of Use", href: "/terms" },
    { label: "Security", href: "/security" },
    { label: "Privacy", href: "/privacy" },
    { label: "Sitemap", href: "/sitemap" },
  ],
  "Social": [
    { label: "Contact Us", href: "/contact" },
    { label: "Sell on FlipStore", href: "/sell" },
    { label: "Become Affiliate", href: "/affiliate" },
    { label: "Advertise", href: "/advertise" },
  ],
};

const TRUST_BADGES = [
  { icon: Shield, label: "Secure Payments" },
  { icon: Truck, label: "Free Delivery" },
  { icon: RefreshCw, label: "Easy Returns" },
  { icon: Headphones, label: "24/7 Support" },
  { icon: CreditCard, label: "No Cost EMI" },
];

export function Footer() {
  const [storeName, setStoreName] = useState<string>("FlipStore");
  const [supportEmail, setSupportEmail] = useState<string>("support@flipstore.in");
  const [supportPhone, setSupportPhone] = useState<string>("");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    setStoreName(getStoreName());
    setSupportEmail(getSupportEmail());
    setSupportPhone(getSupportPhone());
  }, []);

  return (
    <footer className="bg-[#172337] text-white mt-auto">
      {/* Trust Badges Strip */}
      <div className="bg-[#f1f3f6] border-t border-[#e0e0e0]">
        <div className="max-w-[1280px] mx-auto px-4 py-5">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-4">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-gray-600">
                <Icon size={20} className="text-[#2874F0]" />
                <span className="text-xs font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-[1280px] mx-auto px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-4">
                {heading}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-300 text-sm hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 my-8" />

        {/* Bottom Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Description */}
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-xl">{storeName}</span>
              <span className="text-[#ffe500] text-xs italic font-medium">India</span>
            </div>
            <p className="text-gray-400 text-xs text-center md:text-left">
              India&apos;s Most Trusted Online Shopping Destination
            </p>
          </div>

          {/* Support Contact */}
          <div className="flex flex-col items-center md:items-start gap-2 hidden md:flex">
            <div className="flex items-center gap-2">
              <Headphones size={14} className="text-[#2874F0]" />
              <div>
                <span className="text-xs font-semibold text-white block">{supportPhone}</span>
                <span className="text-[10px] text-gray-400">Support Helpline</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle size={14} className="text-[#2874F0]" />
              <div>
                <span className="text-xs font-semibold text-white block">{supportEmail}</span>
                <span className="text-[10px] text-gray-400">Support Email</span>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Facebook"
            >
              <Globe size={20} />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Twitter / X"
            >
              <MessageCircle size={20} />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="YouTube"
            >
              <Share2 size={20} />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <Link2 size={20} />
            </a>
          </div>

          {/* Copyright */}
          <div className="text-gray-500 text-xs text-center md:text-right">
            <p>© {new Date().getFullYear()} {storeName} Internet Private Limited.</p>
            <p>All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Bottom Tagline */}
      <div className="bg-[#0e1726] text-center py-3">
        <p className="text-gray-500 text-xs">
          Made with ❤️ in India &nbsp;·&nbsp; Serving crores of happy shoppers
        </p>
      </div>
    </footer>
  );
}
