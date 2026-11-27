"use client";

import React, { useState, useEffect } from "react";
import { useHydration } from "@/hooks/useHydration";
import { Building2, ShieldCheck, Truck, Headphones, Users, ShoppingBag } from "lucide-react";

export default function AboutPage() {
  const isHydrated = useHydration();
  const [content, setContent] = useState<string>("");
  const [title, setTitle] = useState<string>("About Us");
  const [image, setImage] = useState<string>("");

  useEffect(() => {
    if (!isHydrated) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/static-pages/about-us`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          if (json?.success && json?.data) {
            if (mounted) {
              setContent(json.data.content || "");
              setTitle(json.data.title || "About Us");
              setImage(json.data.image || "");
            }
            return;
          }
        }
      } catch {}
      if (mounted) {
        setContent(defaultContent);
        setTitle("About Us");
        setImage("");
      }
    })();
    return () => { mounted = false; };
  }, [isHydrated]);

  const defaultContent = `
    <h2>About FlipStore</h2>
    <p>FlipStore is built to make online shopping simple, reliable, and accessible for everyone. From everyday essentials to premium products, we bring quality, value, and convenience together on one trusted platform.</p>
    <h3>Our Mission</h3>
    <p>To empower customers and sellers with a seamless digital commerce experience backed by trust, speed, and service.</p>
    <h3>What We Stand For</h3>
    <ul>
      <li>Customer-first shopping experience</li>
      <li>Trusted sellers and quality products</li>
      <li>Secure payments and transparent pricing</li>
      <li>Fast delivery and dependable support</li>
    </ul>
  `;

  return (
    <div className="min-h-[calc(100vh-200px)] bg-[#F1F3F6]">
      <section className="bg-[#2874F0] text-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100 mb-3">FlipStore</p>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">{title}</h1>
          <p className="max-w-2xl text-sm sm:text-base text-blue-50 leading-relaxed">
            India’s trusted online shopping destination, bringing customers and sellers together with convenience, value, and reliability.
          </p>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users, label: "Happy Customers", value: "Millions+" },
            { icon: ShoppingBag, label: "Products", value: "Wide Selection" },
            { icon: Building2, label: "Sellers", value: "Trusted Partners" },
            { icon: Headphones, label: "Support", value: "24/7 Help" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white border border-[#E0E0E0] rounded-sm p-4">
              <Icon className="text-[#2874F0] mb-2" size={20} />
              <div className="text-sm font-bold text-[#212121]">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white border border-[#E0E0E0] rounded-sm p-6 sm:p-8">
            <div
              className="prose prose-sm sm:prose-base max-w-none text-gray-700
                         [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#212121] [&_h2]:mt-0 [&_h2]:mb-3
                         [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-[#212121] [&_h3]:mt-6 [&_h3]:mb-2
                         [&_p]:mb-3 [&_p]:leading-relaxed
                         [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1
                         [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-1
                         [&_a]:text-[#2874F0] [&_a]:underline
                         [&_strong]:font-semibold [&_strong]:text-[#212121]"
              dangerouslySetInnerHTML={{ __html: content || defaultContent }}
            />
          </div>

          <div className="lg:col-span-2 space-y-4">
            {image ? (
              <img src={image} alt={title} className="w-full h-64 object-cover rounded-sm border border-[#E0E0E0] bg-white" />
            ) : (
              <div className="w-full h-64 rounded-sm border border-[#E0E0E0] bg-white flex items-center justify-center text-gray-400 text-sm">
                About image
              </div>
            )}
            <div className="bg-white border border-[#E0E0E0] rounded-sm p-5 space-y-4">
              <h2 className="text-sm font-bold text-[#212121] uppercase tracking-wider">Why Shop With Us</h2>
              <div className="flex gap-3"><ShieldCheck className="text-[#2874F0] shrink-0" size={18} /><div><p className="text-sm font-semibold text-[#212121]">Secure Payments</p><p className="text-xs text-gray-500">Safe and trusted checkout experience.</p></div></div>
              <div className="flex gap-3"><Truck className="text-[#2874F0] shrink-0" size={18} /><div><p className="text-sm font-semibold text-[#212121]">Reliable Delivery</p><p className="text-xs text-gray-500">Fast delivery across many locations.</p></div></div>
              <div className="flex gap-3"><Headphones className="text-[#2874F0] shrink-0" size={18} /><div><p className="text-sm font-semibold text-[#212121]">Customer Support</p><p className="text-xs text-gray-500">Help when you need it.</p></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
