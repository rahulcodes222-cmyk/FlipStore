"use client";

import React, { useState, useEffect } from "react";
import { useHydration } from "@/hooks/useHydration";
import { Newspaper, Megaphone, Mail } from "lucide-react";

export default function PressPage() {
  const isHydrated = useHydration();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("Press & Media");
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (!isHydrated) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/static-pages/press`, {
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          if (json?.success && json?.data && mounted) {
            setContent(json.data.content || "");
            setTitle(json.data.title || "Press & Media");
            const imgs = Array.isArray(json.data.images) ? json.data.images.filter((x: any) => typeof x === "string" && x) : [];
            if (imgs.length) setImages(imgs);
            else if (typeof json.data.image === "string" && json.data.image) setImages([json.data.image]);
            return;
          }
        }
      } catch {}
      if (mounted) setContent(defaultContent);
    })();
    return () => { mounted = false; };
  }, [isHydrated]);

  const defaultContent = `
    <h2>Press & Media</h2>
    <p>Press releases, media coverage, and company announcements from FlipStore.</p>
    <h3>Latest Press Releases</h3>
    <ul>
      <li><strong>December 2025:</strong> FlipStore Announces Expansion to Tier-2 and Tier-3 Cities</li>
      <li><strong>November 2025:</strong> FlipStore Launches New Seller Dashboard with Enhanced Features</li>
      <li><strong>October 2025:</strong> FlipStore Celebrates 1 Million Happy Customers</li>
    </ul>
    <h3>Media Coverage</h3>
    <ul>
      <li><strong>Economic Times:</strong> "FlipStore disrupts Indian e-commerce with seller-first approach"</li>
      <li><strong>Business Today:</strong> "How FlipStore is empowering small sellers across India"</li>
      <li><strong>YourStory:</strong> "FlipStore founder on building a multi-vendor marketplace"</li>
    </ul>
    <h3>Media Contact</h3>
    <p>For press inquiries, please contact:</p>
    <p>press@flipstore.in</p>
    <p>+91 1800 208 9898</p>
  `;

  return (
    <div className="min-h-[calc(100vh-200px)] bg-[#F1F3F6]">
      <section className="bg-[#2874F0] text-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100 mb-3">Newsroom</p>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">{title}</h1>
          <p className="max-w-2xl text-sm sm:text-base text-blue-50 leading-relaxed">
            Press releases, media coverage, and company announcements from FlipStore.
          </p>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {images.length > 0 && (
          <div className={`grid gap-4 ${images.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
            {images.map((img, idx) => (
              <img key={`${img}-${idx}`} src={img} alt={`${title} ${idx + 1}`} className="w-full h-64 sm:h-80 object-cover rounded-sm border border-[#E0E0E0] bg-white" />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-[#E0E0E0] rounded-sm p-6 sm:p-8">
            <div
              className="prose prose-sm sm:prose-base max-w-none text-gray-700
                         [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#212121] [&_h2]:mt-0 [&_h2]:mb-3
                         [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-[#212121] [&_h3]:mt-6 [&_h3]:mb-2
                         [&_p]:mb-3 [&_p]:leading-relaxed
                         [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1
                         [&_strong]:font-semibold [&_strong]:text-[#212121]"
              dangerouslySetInnerHTML={{ __html: content || defaultContent }}
            />
          </div>
          <div className="space-y-4">
            <div className="bg-white border border-[#E0E0E0] rounded-sm p-5 space-y-4">
              <h2 className="text-sm font-bold text-[#212121] uppercase tracking-wider">Media Resources</h2>
              <div className="flex gap-3"><Newspaper className="text-[#2874F0] shrink-0" size={18} /><div><p className="text-sm font-semibold text-[#212121]">Press Releases</p><p className="text-xs text-gray-500">Latest company updates and announcements.</p></div></div>
              <div className="flex gap-3"><Megaphone className="text-[#2874F0] shrink-0" size={18} /><div><p className="text-sm font-semibold text-[#212121]">Media Coverage</p><p className="text-xs text-gray-500">FlipStore in the news.</p></div></div>
              <div className="flex gap-3"><Mail className="text-[#2874F0] shrink-0" size={18} /><div><p className="text-sm font-semibold text-[#212121]">Press Contact</p><p className="text-xs text-gray-500">press@flipstore.in</p></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
