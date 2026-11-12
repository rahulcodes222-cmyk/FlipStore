"use client";

import React, { useState } from "react";
import { Mail, CheckCircle2, Gift, ShieldCheck, Loader2 } from "lucide-react";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { success, warning } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();

    if (!trimmed || !trimmed.includes("@") || !trimmed.includes(".")) {
      warning("Please enter a valid email address.", "Invalid Email");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubscribed(true);
      success(
        "Welcome to FlipStore! Use coupon code 'WELCOME100' for ₹100 off on your first order.",
        "Subscribed Successfully!"
      );
    }, 600);
  };

  return (
    <section className="w-full bg-gradient-to-r from-[#172337] via-[#1f314f] to-[#172337] text-white rounded-sm border border-gray-700 p-6 sm:p-10 mb-8 shadow-sm">
      <div className="max-w-3xl mx-auto text-center space-y-4">
        {/* Gift Badge */}
        <div className="inline-flex items-center gap-1.5 bg-[#ffe500] text-[#172337] text-xs font-black uppercase px-3 py-1 rounded-full shadow-xs">
          <Gift size={14} />
          <span>Get Flat ₹100 Off Your First Order</span>
        </div>

        {/* Headline */}
        <h2 className="text-xl sm:text-3xl font-black tracking-tight">
          Never Miss a Flash Deal or Big Billion Fest
        </h2>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-gray-300 max-w-lg mx-auto leading-relaxed">
          Join over 5,00,000+ shoppers who receive curated deals, exclusive member coupons,
          and instant alerts on price drops.
        </p>

        {/* Subscription Form */}
        {isSubscribed ? (
          <div className="p-4 bg-[#E8F5E9]/10 border border-[#388E3C] rounded-sm text-[#388E3C] inline-flex items-center gap-2 text-sm font-bold animate-in zoom-in-95">
            <CheckCircle2 size={18} />
            <span>You&apos;re subscribed! Use coupon code <span className="underline">WELCOME100</span> at checkout.</span>
          </div>
        ) : (
          <form
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-md mx-auto pt-2"
          >
            <div className="relative w-full">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full h-11 pl-10 pr-3 rounded-xs bg-white text-[#212121] text-sm placeholder:text-[#878787] border border-transparent focus:outline-none focus:ring-2 focus:ring-[#FB641B]"
                required
              />
            </div>
            <Button
              type="submit"
              variant="buyNow"
              size="default"
              disabled={isSubmitting}
              className="w-full sm:w-auto h-11 px-6 font-bold shrink-0 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Subscribing...</span>
                </>
              ) : (
                "Subscribe"
              )}
            </Button>
          </form>
        )}

        {/* Trust Points */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-3 text-[11px] text-gray-400">
          <span className="flex items-center gap-1">
            <ShieldCheck size={14} className="text-[#388E3C]" />
            <span>No spam, unsubscribe anytime</span>
          </span>
          <span>•</span>
          <span>Verified Secure Subscriptions</span>
          <span>•</span>
          <span>Pan-India Deals</span>
        </div>
      </div>
    </section>
  );
}
