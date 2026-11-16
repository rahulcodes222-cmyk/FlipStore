"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, HelpCircle, Ticket, MessageCircle, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MOCK_FAQS, MOCK_SUPPORT_TICKETS } from "@/data";
import { cn } from "@/lib/utils";

export default function SellerHelpPage() {
  const [search, setSearch] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const filteredFaqs = MOCK_FAQS.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-lg font-bold text-[#212121]">Help & Support</h1>
        <Link
          href="/seller/dashboard"
          className="text-[11px] font-semibold text-[#2874F0] hover:underline flex items-center gap-1"
        >
          <span>← Back to Dashboard</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Help Center */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878787]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search help center…"
                className="pl-10"
              />
            </div>
            <h2 className="text-sm font-bold text-[#212121] mb-3">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {filteredFaqs.map((faq) => (
                <div key={faq.id} className="border border-[#E0E0E0] rounded-sm overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-[#212121] hover:bg-[#F1F3F6] transition-colors"
                  >
                    {faq.question}
                    <HelpCircle size={14} className="text-[#878787]" />
                  </button>
                  <div className="px-4 py-3 border-t border-[#F0F0F0] text-sm text-[#878787]">
                    {faq.answer}
                    <p className="text-[10px] text-[#B0B0B0] mt-2 uppercase tracking-wider font-medium">
                      {faq.category}
                    </p>
                  </div>
                </div>
              ))}
              {filteredFaqs.length === 0 && (
                <p className="text-sm text-[#878787] text-center py-4">No results found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Contact & Tickets */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-sm border border-[#E0E0E0] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#212121] mb-4 flex items-center gap-2">
              <MessageCircle size={16} className="text-[#2874F0]" />
              Contact Support
            </h2>
            {submitted ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-[#2E7D32]" />
                  <span className="text-sm font-medium text-[#212121]">Ticket submitted</span>
                </div>
                <p className="text-xs text-[#878787]">
                  Our support team will get back to you within 24 hours.
                </p>
                <Button variant="outline" onClick={() => setSubmitted(false)} className="w-auto">
                  Submit Another
                </Button>
              </div>
            ) : (
              <form onSubmit={handleContact} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Subject</label>
                  <Input
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="e.g. Payout delay"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Message</label>
                  <textarea
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    rows={4}
                    className="flex h-32 w-full rounded-sm border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#212121] focus-visible:ring-1 focus-visible:ring-[#2874F0]"
                  />
                </div>
                <Button variant="primary" type="submit" className="w-full">
                  Send Message
                </Button>
              </form>
            )}
          </div>

          <div className="rounded-sm border border-[#E0E0E0] bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-[#212121] mb-4 flex items-center gap-2">
              <Ticket size={16} className="text-[#2874F0]" />
              Support Tickets
            </h2>
            <div className="space-y-3">
              {MOCK_SUPPORT_TICKETS.map((t) => (
                <div key={t.id} className="border border-[#E0E0E0] rounded-sm p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-[#878787] uppercase">{t.subject}</span>
                    <span
                      className={cn(
                        "text-[10px] font-bold rounded-full px-2 py-0.5 border",
                        t.status === "RESOLVED"
                          ? "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]"
                          : t.status === "IN_PROGRESS"
                          ? "bg-[#FFF3E0] text-[#B26A00] border-[#FFE082]"
                          : t.status === "CLOSED"
                          ? "bg-[#F5F5F5] text-[#616161] border-[#E0E0E0]"
                          : "bg-[#E3F2FD] text-[#1565C0] border-[#BBDEFB]"
                      )}
                    >
                      {t.status.charAt(0) + t.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#878787] mb-2">{t.message}</p>
                  <div className="flex justify-between text-[10px] text-[#B0B0B0]">
                    <span>{t.priority.charAt(0) + t.priority.slice(1).toLowerCase()} priority</span>
                    <span>{new Date(t.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
