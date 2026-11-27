"use client";

import React, { useState, useEffect } from "react";
import { useHydration } from "@/hooks/useHydration";
import { Building2, FileText, Mail } from "lucide-react";

export default function CorporatePage() {
  const isHydrated = useHydration();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("Corporate Information");
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (!isHydrated) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/static-pages/corporate`, {
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          if (json?.success && json?.data && mounted) {
            setContent(json.data.content || "");
            setTitle(json.data.title || "Corporate Information");
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
    <h2>Corporate Information</h2>
    <p>FlipStore India Private Limited</p>
    <h3>Company Details</h3>
    <ul>
      <li><strong>Company Name:</strong> FlipStore India Private Limited</li>
      <li><strong>CIN:</strong> U72900KA2020PTC123456</li>
      <li><strong>GSTIN:</strong> 29ABCDE1234F1Z5</li>
      <li><strong>PAN:</strong> ABCDE1234F</li>
    </ul>
    <h3>Registered Office</h3>
    <p>
      FlipStore India Private Limited<br>
      #123, Electronic City<br>
      Bengaluru, Karnataka 560100<br>
      India
    </p>
    <h3>Corporate Office</h3>
    <p>
      FlipStore India Private Limited<br>
      #456, Koramangala<br>
      Bengaluru, Karnataka 560095<br>
      India
    </p>
    <h3>Contact</h3>
    <p>Email: corporate@flipstore.in</p>
    <p>Phone: +91 1800 208 9898</p>
  `;

  return (
    <div className="min-h-[calc(100vh-200px)] bg-[#F1F3F6]">
      <section className="bg-[#2874F0] text-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100 mb-3">Company</p>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">{title}</h1>
          <p className="max-w-2xl text-sm sm:text-base text-blue-50 leading-relaxed">
            Corporate information and legal details of FlipStore.
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
              <h2 className="text-sm font-bold text-[#212121] uppercase tracking-wider">Corporate</h2>
              <div className="flex gap-3"><Building2 className="text-[#2874F0] shrink-0" size={18} /><div><p className="text-sm font-semibold text-[#212121]">Registered Entity</p><p className="text-xs text-gray-500">FlipStore India Private Limited.</p></div></div>
              <div className="flex gap-3"><FileText className="text-[#2874F0] shrink-0" size={18} /><div><p className="text-sm font-semibold text-[#212121]">Compliance</p><p className="text-xs text-gray-500">Company and statutory information.</p></div></div>
              <div className="flex gap-3"><Mail className="text-[#2874F0] shrink-0" size={18} /><div><p className="text-sm font-semibold text-[#212121]">Contact</p><p className="text-xs text-gray-500">corporate@flipstore.in</p></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
