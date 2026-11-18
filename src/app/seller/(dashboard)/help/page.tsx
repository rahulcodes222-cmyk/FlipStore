"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, HelpCircle, Ticket, MessageCircle, CheckCircle2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MOCK_FAQS } from "@/data";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/common/Toast";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

type SupportTicketItem = {
  id: string;
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | string;
  priority: "LOW" | "MEDIUM" | "HIGH" | string;
  createdAt: string;
  updatedAt: string;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || json?.error?.message || `Request failed (${res.status})`);
  }
  return (json?.data ?? json) as T;
}

export default function SellerHelpPage() {
  const { success, error } = useToast();
  const [search, setSearch] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketPriority, setTicketPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);

  const loadTickets = async () => {
    setLoadingTickets(true);
    try {
      const data = await api<any>("/api/v1/vendor/support-tickets");
      const rows = Array.isArray(data?.tickets) ? data.tickets : Array.isArray(data) ? data : [];
      setTickets(rows as SupportTicketItem[]);
    } catch (e: any) {
      error(e?.message || "Failed to load support tickets");
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    void loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredFaqs = useMemo(() => (MOCK_FAQS || []).filter((f: any) => {
    const q = search.toLowerCase();
    return String(f?.question || "").toLowerCase().includes(q) ||
      String(f?.answer || "").toLowerCase().includes(q) ||
      String(f?.category || "").toLowerCase().includes(q);
  }), [search]);

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    const subject = ticketSubject.trim();
    const message = ticketMessage.trim();
    if (subject.length < 3) { error("Subject must be at least 3 characters."); return; }
    if (message.length < 10) { error("Message must be at least 10 characters."); return; }
    setSubmitting(true);
    try {
      const data = await api<any>("/api/v1/vendor/support-tickets", {
        method: "POST",
        body: JSON.stringify({ subject, message, priority: ticketPriority }),
      });
      const ticket = data?.ticket as SupportTicketItem | undefined;
      if (ticket) setTickets((prev) => [ticket, ...prev]);
      else await loadTickets();
      setSubmitted(true);
      setTicketSubject("");
      setTicketMessage("");
      setTicketPriority("MEDIUM");
      success("Support ticket submitted");
    } catch (e: any) {
      error(e?.message || "Failed to submit support ticket");
    } finally {
      setSubmitting(false);
    }
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
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-sm border border-[#E0E0E0] bg-white p-4 shadow-sm">
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#878787]" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search help center..."
                className="pl-10"
              />
            </div>
            <h2 className="text-sm font-bold text-[#212121] mb-3">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {filteredFaqs.map((faq: any) => (
                <div key={faq.id} className="border border-[#E0E0E0] rounded-sm overflow-hidden">
                  <div className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-[#212121] bg-white">
                    {faq.question}
                    <HelpCircle size={14} className="text-[#878787]" />
                  </div>
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
                  Your message has been sent to admin support. You can track its status below.
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
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Priority</label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")}
                    className="flex h-10 w-full rounded-sm border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#212121] focus-visible:ring-1 focus-visible:ring-[#2874F0]"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Message</label>
                  <textarea
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    rows={4}
                    required
                    className="flex min-h-[96px] w-full rounded-sm border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#212121] focus-visible:ring-1 focus-visible:ring-[#2874F0]"
                    placeholder="Describe your issue..."
                  />
                </div>
                <Button variant="primary" type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            )}
          </div>

          <div className="rounded-sm border border-[#E0E0E0] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#212121] flex items-center gap-2">
                <Ticket size={16} className="text-[#2874F0]" />
                Support Tickets
              </h2>
              <Button variant="outline" size="sm" onClick={() => void loadTickets()} disabled={loadingTickets}>
                <RefreshCcw size={14} /> Refresh
              </Button>
            </div>
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {loadingTickets ? (
                <div className="h-20 rounded-sm bg-[#E8E8E8] animate-skeleton" />
              ) : tickets.length === 0 ? (
                <p className="text-sm text-[#878787] text-center py-4">No support tickets yet.</p>
              ) : tickets.map((t) => (
                <div key={t.id} className="border border-[#E0E0E0] rounded-sm p-3">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="text-[11px] font-bold text-[#212121] line-clamp-1" title={t.subject}>{t.subject}</span>
                    <span
                      className={cn(
                        "text-[10px] font-bold rounded-full px-2 py-0.5 border shrink-0",
                        t.status === "RESOLVED"
                          ? "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]"
                          : t.status === "IN_PROGRESS"
                          ? "bg-[#FFF3E0] text-[#B26A00] border-[#FFE082]"
                          : t.status === "CLOSED"
                          ? "bg-[#F5F5F5] text-[#616161] border-[#E0E0E0]"
                          : "bg-[#E3F2FD] text-[#1565C0] border-[#BBDEFB]"
                      )}
                    >
                      {String(t.status || "OPEN").replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#616161] mb-2 whitespace-pre-wrap break-words">{t.message}</p>
                  <div className="flex justify-between text-[10px] text-[#9E9E9E]">
                    <span>{String(t.priority || "MEDIUM").charAt(0) + String(t.priority || "MEDIUM").slice(1).toLowerCase()} priority</span>
                    <span>{new Date(t.updatedAt || t.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
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
