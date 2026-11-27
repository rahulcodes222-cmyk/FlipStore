"use client";

import React, { useState, useEffect } from "react";
import { useHydration } from "@/hooks/useHydration";
import { Briefcase, Users, Sparkles, HeartHandshake } from "lucide-react";

export default function CareersPage() {
  const isHydrated = useHydration();
  const [content, setContent] = useState<string>("");
  const [title, setTitle] = useState<string>("Careers");
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (!isHydrated) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/static-pages/careers`, {
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          if (json?.success && json?.data && mounted) {
            setContent(json.data.content || "");
            setTitle(json.data.title || "Careers");
            const imgs = Array.isArray(json.data.images) ? json.data.images.filter((x: any) => typeof x === "string") : [];
            if (imgs.length) setImages(imgs);
            else if (typeof json.data.image === "string" && json.data.image) setImages([json.data.image]);
            return;
          }
        }
      } catch {}
      if (mounted) {
        setContent(defaultContent);
        setTitle("Careers");
      }
    })();
    return () => { mounted = false; };
  }, [isHydrated]);

  const defaultContent = `
    <h2>Build the future of commerce with us</h2>
    <p>At FlipStore, we’re building a trusted shopping experience for millions of customers and empowering sellers across India. We look for curious, driven people who want to solve meaningful problems at scale.</p>
    <h3>Life at FlipStore</h3>
    <p>We value ownership, collaboration, and customer obsession. Our teams move fast, learn continuously, and build products that make everyday shopping better.</p>
    <h3>What You Can Expect</h3>
    <ul>
      <li>Meaningful work with real customer impact</li>
      <li>Growth opportunities and learning culture</li>
      <li>Supportive teams and inclusive workplace</li>
      <li>Competitive compensation and benefits</li>
    </ul>
  `;

  return (
    <div className="min-h-[calc(100vh-200px)] bg-[#F1F3F6]">
      <section className="bg-[#2874F0] text-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100 mb-3">Work With Us</p>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">{title}</h1>
          <p className="max-w-2xl text-sm sm:text-base text-blue-50 leading-relaxed">
            Join FlipStore and help create a better, smarter, and more trusted e-commerce experience for India.
          </p>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Briefcase, label: "Meaningful Roles", value: "Grow" },
            { icon: Users, label: "Collaborative Teams", value: "Together" },
            { icon: Sparkles, label: "Innovation", value: "Build" },
            { icon: HeartHandshake, label: "Customer First", value: "Impact" },
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
                         [&_strong]:font-semibold [&_strong]:text-[#212121]"
              dangerouslySetInnerHTML={{ __html: content || defaultContent }}
            />
          </div>

          <div className="lg:col-span-2 space-y-4">
            {images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {images.map((img, idx) => (
                  <img key={`${img}-${idx}`} src={img} alt={`Careers ${idx + 1}`} className={`w-full object-cover rounded-sm border border-[#E0E0E0] bg-white ${idx === 0 ? "col-span-2 h-56" : "h-32"}`} />
                ))}
              </div>
            ) : (
              <div className="w-full h-64 rounded-sm border border-[#E0E0E0] bg-white flex items-center justify-center text-gray-400 text-sm">Careers images</div>
            )}
            <div className="bg-[#2874F0] text-white rounded-sm p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider mb-2">Join the Team</h2>
              <p className="text-sm text-blue-50 leading-relaxed">We’re always looking for passionate people. Explore opportunities and grow your career with FlipStore.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
