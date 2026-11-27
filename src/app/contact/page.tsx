"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.name) setName((v) => v || user.name);
      if (user.email) setEmail((v) => v || user.email);
      const p = (user as any).phone || (user as any).mobile || "";
      if (p) setPhone((v) => v || String(p));
    }
  }, [isAuthenticated, user]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || "Failed to send message.");
      }
      setSuccess("Message sent successfully. Our team will contact you soon.");
      setMessage("");
    } catch (err: any) {
      setError(err?.message || "Failed to send message.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] bg-[#F1F3F6]">
      <section className="bg-[#2874F0] text-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100 mb-3">Get In Touch</p>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">Contact Us</h1>
          <p className="max-w-2xl text-sm sm:text-base text-blue-50 leading-relaxed">
            Have a question or need help with your order? Send us a message and our support team will get back to you.
          </p>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-[#E0E0E0] rounded-sm p-6 sm:p-8">
            <h2 className="text-lg font-bold text-[#212121] mb-5">Send us a message</h2>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={100}
                    className="w-full h-10 px-3 border border-[#D0D0D0] rounded-sm text-sm focus:outline-none focus:border-[#2874F0]" placeholder="Enter your name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200}
                    className="w-full h-10 px-3 border border-[#D0D0D0] rounded-sm text-sm focus:outline-none focus:border-[#2874F0]" placeholder="Enter your email" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} required minLength={8} maxLength={20}
                  className="w-full h-10 px-3 border border-[#D0D0D0] rounded-sm text-sm focus:outline-none focus:border-[#2874F0]" placeholder="Enter your phone number" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} required minLength={10} maxLength={2000} rows={6}
                  className="w-full px-3 py-2 border border-[#D0D0D0] rounded-sm text-sm focus:outline-none focus:border-[#2874F0] resize-y" placeholder="Describe your issue or question..." />
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-sm">{error}</div>}
              {success && <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-sm flex items-center gap-2"><CheckCircle2 size={16} />{success}</div>}

              <button type="submit" disabled={submitting}
                className="inline-flex items-center gap-2 h-10 px-6 bg-[#2874F0] hover:bg-[#1259c7] text-white text-sm font-bold rounded-sm disabled:opacity-60">
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-[#E0E0E0] rounded-sm p-5 space-y-4">
              <h2 className="text-sm font-bold text-[#212121] uppercase tracking-wider">Contact Information</h2>
              <div className="flex gap-3"><Mail className="text-[#2874F0] shrink-0" size={18} /><div><p className="text-sm font-semibold text-[#212121]">Email</p><p className="text-xs text-gray-500">support@flipstore.in</p></div></div>
              <div className="flex gap-3"><Phone className="text-[#2874F0] shrink-0" size={18} /><div><p className="text-sm font-semibold text-[#212121]">Phone</p><p className="text-xs text-gray-500">1800 208 9898</p></div></div>
              <div className="flex gap-3"><MapPin className="text-[#2874F0] shrink-0" size={18} /><div><p className="text-sm font-semibold text-[#212121]">Office</p><p className="text-xs text-gray-500">Bengaluru, Karnataka, India</p></div></div>
            </div>
            <div className="bg-[#2874F0] text-white rounded-sm p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-2">Need quick help?</h3>
              <p className="text-sm text-blue-50 leading-relaxed">For common questions about orders, payments, and returns, you can also check our Help Centre.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
