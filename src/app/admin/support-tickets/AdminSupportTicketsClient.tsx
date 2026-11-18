"use client";

import React, { useEffect, useMemo, useState } from "react";
import { LifeBuoy, RefreshCw, Search, Clock3, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { adminService } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/common/Toast";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

interface SupportTicket {
  id: string;
  sellerId?: string;
  sellerName?: string;
  sellerEmail?: string;
  storeName?: string;
  subject: string;
  message: string;
  status: TicketStatus | string;
  priority: "LOW" | "MEDIUM" | "HIGH" | string;
  createdAt: string;
  updatedAt: string;
}

function StatusBadge({ status }: { status: string }) {
  const s = String(status || "OPEN").toUpperCase();
  const cls = s === "RESOLVED"
    ? "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]"
    : s === "IN_PROGRESS"
    ? "bg-[#FFF3E0] text-[#B26A00] border-[#FFE082]"
    : s === "CLOSED"
    ? "bg-[#F5F5F5] text-[#616161] border-[#E0E0E0]"
    : "bg-[#E3F2FD] text-[#1565C0] border-[#BBDEFB]";
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border", cls)}>{s.replace(/_/g, " ")}</span>;
}

export function AdminSupportTicketsClient() {
  const { success, error } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async (opts?: { silent?: boolean }) => {
    if (opts?.silent) setRefreshing(true); else setLoading(true);
    try {
      const data = await adminService.getSupportTickets({ status: status || undefined, search: search || undefined });
      setTickets(Array.isArray(data) ? data : []);
    } catch (e: any) {
      error(e?.message || "Failed to load seller support tickets");
      setTickets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setTimeout(() => { void load({ silent: true }); }, 300);
    return () => clearTimeout(t);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter((t) =>
      [t.subject, t.message, t.sellerName, t.sellerEmail, t.storeName, t.sellerId, t.priority, t.status]
        .some((v) => String(v || "").toLowerCase().includes(q))
    );
  }, [tickets, search]);

  const counts = useMemo(() => {
    const c = { total: tickets.length, open: 0, inProgress: 0, resolved: 0, closed: 0 };
    for (const t of tickets) {
      const s = String(t.status || "").toUpperCase();
      if (s === "OPEN") c.open++;
      else if (s === "IN_PROGRESS") c.inProgress++;
      else if (s === "RESOLVED") c.resolved++;
      else if (s === "CLOSED") c.closed++;
    }
    return c;
  }, [tickets]);

  const updateStatus = async (id: string, next: TicketStatus) => {
    setUpdatingId(id);
    try {
      await adminService.updateSupportTicketStatus(id, next);
      setTickets((prev) => prev.map((t) => t.id === id ? { ...t, status: next, updatedAt: new Date().toISOString() } : t));
      success("Ticket status updated");
    } catch (e: any) {
      error(e?.message || "Failed to update ticket status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#212121] tracking-tight">Seller Support</h1>
            <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">{filtered.length} Messages</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Messages submitted by sellers from Help & Support.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load({ silent: true })} className="h-9 text-xs font-semibold bg-white border-gray-300" disabled={refreshing || loading}>
          <RefreshCw size={13} className={cn("mr-1.5", (refreshing || loading) && "animate-spin")} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total", value: counts.total, icon: LifeBuoy },
          { label: "Open", value: counts.open, icon: AlertCircle },
          { label: "In Progress", value: counts.inProgress, icon: Clock3 },
          { label: "Resolved", value: counts.resolved, icon: CheckCircle2 },
          { label: "Closed", value: counts.closed, icon: XCircle },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-md border border-gray-200 p-4 shadow-xs">
            <p className="text-[11px] text-gray-500 uppercase font-semibold flex items-center gap-1.5"><c.icon size={12} /> {c.label}</p>
            <p className="text-lg font-bold text-[#212121] mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-md border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex-1 max-w-xl relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by seller, store, subject or message..." className="pl-9 h-9 text-xs bg-gray-50 border-gray-200 focus:bg-white" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 px-3 text-xs bg-white border border-gray-200 rounded-sm w-full sm:w-48">
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-500 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-[#2874F0] mx-auto mb-2" />
          Loading seller support messages...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-gray-500 text-xs bg-white rounded border border-gray-200">
          <LifeBuoy className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="font-bold text-gray-700 text-sm">No seller support messages</p>
          <p className="mt-1">Messages sent by sellers from Help & Support will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => (
            <div key={t.id} className="bg-white rounded-md border border-gray-200 p-4 sm:p-5 shadow-xs">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={t.status} />
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      String(t.priority).toUpperCase() === "HIGH" ? "bg-red-50 text-red-700 border-red-200" :
                      String(t.priority).toUpperCase() === "LOW" ? "bg-gray-50 text-gray-700 border-gray-200" :
                      "bg-amber-50 text-amber-700 border-amber-200")}>{String(t.priority || "MEDIUM")} PRIORITY</span>
                    <span className="text-[10px] text-gray-400">{new Date(t.createdAt).toLocaleString("en-IN")}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#212121]">{t.subject}</h3>
                    <p className="text-xs text-[#555] mt-1 whitespace-pre-wrap break-words">{t.message}</p>
                  </div>
                  <div className="text-[11px] text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                    <span><span className="font-semibold text-gray-700">Seller:</span> {t.sellerName || "Seller"}{t.storeName ? ` (${t.storeName})` : ""}</span>
                    {t.sellerEmail ? <span><span className="font-semibold text-gray-700">Email:</span> {t.sellerEmail}</span> : null}
                    {t.sellerId ? <span><span className="font-semibold text-gray-700">Seller ID:</span> <span className="font-mono">{t.sellerId}</span></span> : null}
                    <span><span className="font-semibold text-gray-700">Updated:</span> {new Date(t.updatedAt || t.createdAt).toLocaleString("en-IN")}</span>
                  </div>
                </div>
                <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
                  {(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as TicketStatus[]).map((s) => (
                    <Button key={s} variant={String(t.status).toUpperCase() === s ? "default" : "outline"} size="sm"
                      className={cn("h-8 text-[11px] justify-start", String(t.status).toUpperCase() === s && "bg-[#2874F0] hover:bg-[#1f63d1] text-white")}
                      disabled={updatingId === t.id || String(t.status).toUpperCase() === s}
                      onClick={() => void updateStatus(t.id, s)}>
                      {updatingId === t.id ? "..." : s.replace(/_/g, " ")}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
