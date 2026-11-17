"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, CheckCircle2, Clock3, Eye, Loader2, RefreshCw, Search, XCircle, AlertTriangle, Ban, FileEdit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { adminService } from "@/services/adminService";
import { useToast } from "@/components/common/Toast";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/utils/formatters";

type ApprovalTab = "all" | "pending" | "under_review" | "approved" | "rejected" | "changes_requested" | "draft";

interface ProductRow {
  id: string;
  sellerId?: string;
  name: string;
  slug?: string;
  sku?: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  price?: number;
  mrp?: number;
  stock?: number;
  thumbnail?: string;
  description?: string;
  approvalStatus?: string;
  productStatus?: string;
  rejectionReason?: string;
  adminComment?: string;
  submittedAt?: string;
  updatedAt?: string;
  createdAt?: string;
  seller?: { id?: string; name?: string; email?: string; storeName?: string; sellerCode?: string } | null;
}

function Badge({ label, tone }: { label: string; tone: string }) {
  return <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold whitespace-nowrap", tone)}>{label}</span>;
}

function ApprovalBadge({ status }: { status?: string }) {
  const s = String(status || "Draft");
  const tone = s === "Approved" ? "bg-green-50 text-green-700 border-green-200" : s === "Rejected" ? "bg-red-50 text-red-700 border-red-200" : s === "Changes Requested" ? "bg-orange-50 text-orange-700 border-orange-200" : s === "Pending Approval" || s === "Under Review" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-gray-50 text-gray-700 border-gray-200";
  return <Badge label={s} tone={tone} />;
}

function PublicationBadge({ status }: { status?: string }) {
  const s = String(status || "Inactive");
  const tone = s === "Active" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-50 text-gray-700 border-gray-200";
  return <Badge label={s} tone={tone} />;
}

export function AdminProductApprovalsClient() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<ApprovalTab>("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1, hasMore: false });
  const [selected, setSelected] = useState<ProductRow | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [activateOnApprove, setActivateOnApprove] = useState(true);

  const fetchData = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await adminService.getProductApprovals({ tab, search: search || undefined, page, limit: 20, sortBy: tab === "pending" || tab === "under_review" ? "oldest" : "submitted_desc" });
      setRows(Array.isArray(res?.data) ? res.data : []);
      setPagination(res?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1, hasMore: false });
      setCounts(res?.counts || {});
    } catch (e: any) {
      toast({ type: "error", title: "Failed to load approvals", message: e?.message || "Please try again." });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab, search, page, toast]);

  useEffect(() => { fetchData(); }, []); // eslint-disable-line
  useEffect(() => { setPage(1); }, [tab]);
  useEffect(() => {
    const t = setTimeout(() => fetchData({ silent: true }), 300);
    return () => clearTimeout(t);
  }, [search, tab, page, fetchData]);

  const openDetail = async (row: ProductRow) => {
    setSelected(row);
    setDetail(null);
    setReason(row.rejectionReason || "");
    setComment(row.adminComment || "");
    setActivateOnApprove(true);
    setDetailLoading(true);
    try {
      const d = await adminService.getProductApprovalById(row.id);
      setDetail(d || row);
      setReason(d?.rejectionReason || "");
      setComment(d?.adminComment || "");
    } catch (e: any) {
      toast({ type: "error", title: "Failed to load details", message: e?.message || "Please try again." });
      setDetail(row);
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshAfterAction = async () => {
    await fetchData({ silent: true });
    if (selected) {
      try { const d = await adminService.getProductApprovalById(selected.id); setDetail(d); } catch {}
    }
  };

  const runAction = async (kind: "approve" | "reject" | "changes", id: string) => {
    const key = `${id}:${kind}`;
    setActionLoading(key);
    try {
      if (kind === "approve") {
        await adminService.approveProductApproval(id, { adminComment: comment.trim() || undefined, activate: activateOnApprove });
        toast({ type: "success", title: "Product approved", message: "Seller notified and approval history updated." });
      } else if (kind === "reject") {
        if (!reason.trim()) throw new Error("Rejection reason is required.");
        await adminService.rejectProductApproval(id, { reason: reason.trim(), adminComment: comment.trim() || undefined });
        toast({ type: "success", title: "Product rejected", message: "Seller notified with reason." });
      } else {
        if (!comment.trim()) throw new Error("Change request comment is required.");
        await adminService.requestProductApprovalChanges(id, { comment: comment.trim() });
        toast({ type: "success", title: "Changes requested", message: "Seller notified to update and resubmit." });
      }
      await refreshAfterAction();
    } catch (e: any) {
      toast({ type: "error", title: "Action failed", message: e?.message || "Could not complete action." });
    } finally {
      setActionLoading(null);
    }
  };

  const tabs: { key: ApprovalTab; label: string; icon: any }[] = [
    { key: "pending", label: "Pending", icon: Clock3 },
    { key: "under_review", label: "Under Review", icon: Eye },
    { key: "changes_requested", label: "Changes Requested", icon: FileEdit },
    { key: "approved", label: "Approved", icon: CheckCircle2 },
    { key: "rejected", label: "Rejected", icon: XCircle },
    { key: "draft", label: "Drafts", icon: AlertTriangle },
    { key: "all", label: "All", icon: BadgeCheck },
  ];

  const summary = useMemo(() => ([
    { label: "Pending", value: counts.pending || 0 },
    { label: "Under Review", value: counts.under_review || 0 },
    { label: "Approved", value: counts.approved || 0 },
    { label: "Rejected", value: counts.rejected || 0 },
    { label: "Changes Requested", value: counts.changes_requested || 0 },
  ]), [counts]);

  const active = detail || selected;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#212121]">Product Approvals</h1>
          <p className="text-xs text-[#878787] mt-0.5">Review seller-submitted products. Approve, reject, or request changes with feedback and history.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchData({ silent: true })} disabled={refreshing} className="gap-1.5">
          {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {summary.map((s) => (
          <Card key={s.label} className="border-[#E0E0E0]"><CardContent className="p-4"><p className="text-[11px] text-[#878787] uppercase font-semibold">{s.label}</p><p className="text-lg font-bold text-[#212121] mt-1">{s.value}</p></CardContent></Card>
        ))}
      </div>

      <Card className="border-[#E0E0E0]"><CardContent className="p-4 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => {
              const Icon = t.icon;
              const count = t.key === "all" ? (counts.all || 0) : t.key === "pending" ? (counts.pending || 0) : t.key === "under_review" ? (counts.under_review || 0) : t.key === "approved" ? (counts.approved || 0) : t.key === "rejected" ? (counts.rejected || 0) : t.key === "changes_requested" ? (counts.changes_requested || 0) : (counts.draft || 0);
              return (
                <button key={t.key} onClick={() => setTab(t.key)} className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-xs font-semibold transition-colors", tab === t.key ? "bg-[#2874F0] text-white border-[#2874F0]" : "bg-white text-[#555] border-[#E0E0E0] hover:bg-[#F8F9FA]")}> 
                  <Icon size={13} /> {t.label} <span className={cn("text-[10px] px-1.5 rounded-full", tab === t.key ? "bg-white/20 text-white" : "bg-[#F1F3F6] text-[#616161]")}>{count}</span>
                </button>
              );
            })}
          </div>
          <div className="flex-1 max-w-xl relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <Input placeholder="Search by product name, SKU, brand, category, seller..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-xs" />
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center text-sm text-[#878787] gap-2"><Loader2 size={16} className="animate-spin" /> Loading product approvals...</div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center">
            <BadgeCheck size={28} className="mx-auto text-[#BDBDBD] mb-2" />
            <p className="text-sm font-semibold text-[#212121]">No products found</p>
            <p className="text-xs text-[#878787] mt-1">Seller submissions matching this filter will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-sm border border-[#F0F0F0]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAFA] text-[#878787] uppercase text-[10px] font-bold border-b border-[#F0F0F0]">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Seller</th>
                  <th className="py-3 px-4">Pricing / Stock</th>
                  <th className="py-3 px-4">Approval</th>
                  <th className="py-3 px-4">Submitted / Updated</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5]">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FCFCFC]">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <div className="w-10 h-10 rounded-sm bg-[#F5F5F5] border border-[#EEEEEE] overflow-hidden flex items-center justify-center shrink-0">
                          {r.thumbnail ? <img src={r.thumbnail} alt={r.name} className="w-full h-full object-contain" /> : <span className="text-[10px] text-[#9E9E9E]">No img</span>}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#212121] truncate">{r.name}</p>
                          <p className="text-[11px] text-[#878787] truncate">{r.category || "-"}{r.brand ? ` • ${r.brand}` : ""}</p>
                          <p className="text-[10px] text-[#9E9E9E] truncate">SKU: {r.sku || "-"} • ID: {r.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-[#555]">
                      <p className="font-medium text-[#212121]">{r.seller?.storeName || r.seller?.name || "Seller"}</p>
                      <p className="text-[#878787]">{r.seller?.email || "-"}</p>
                      <p className="text-[#9E9E9E]">{r.seller?.sellerCode || r.sellerId || "-"}</p>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-[#555]">
                      <p className="font-semibold text-[#212121]">{formatPrice(Number(r.price || 0))}</p>
                      <p className="text-[#878787]">MRP {formatPrice(Number(r.mrp || 0))}</p>
                      <p className={cn(Number(r.stock || 0) > 0 ? "text-[#388E3C]" : "text-[#D32F2F]")}>Stock: {Number(r.stock || 0)}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <ApprovalBadge status={r.approvalStatus} />
                        <PublicationBadge status={r.productStatus} />
                        {(r.rejectionReason || r.adminComment) && <p className="text-[10px] text-[#878787] max-w-[220px] line-clamp-2">{r.rejectionReason || r.adminComment}</p>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-[#555]">
                      <p>Submitted: {r.submittedAt ? new Date(r.submittedAt).toLocaleString("en-IN") : "-"}</p>
                      <p>Updated: {r.updatedAt ? new Date(r.updatedAt).toLocaleString("en-IN") : "-"}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" className="h-7 px-2 text-[11px]" onClick={() => openDetail(r)}><Eye size={12} className="mr-1" /> Review</Button>
                        {String(r.approvalStatus) !== "Approved" && (
                          <Button size="sm" className="h-7 px-2 text-[11px] bg-[#2E7D32] hover:bg-[#256628] text-white" onClick={() => { setSelected(r); setDetail(r); setComment(""); setReason(""); setActivateOnApprove(true); runAction("approve", r.id); }} disabled={actionLoading === `${r.id}:approve`}>
                            {actionLoading === `${r.id}:approve` ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} className="mr-1" />} Approve
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-[#616161]">
            <span>Page {pagination.page} of {pagination.totalPages} • {pagination.total} products</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 px-2" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
              <Button variant="outline" size="sm" className="h-7 px-2" disabled={!pagination.hasMore && page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </CardContent></Card>

      {active && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => { if (!actionLoading) { setSelected(null); setDetail(null); } }}>
          <div className="bg-white w-full sm:max-w-3xl rounded-t-lg sm:rounded-sm max-h-[92vh] overflow-y-auto border border-[#E0E0E0]" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-[#F0F0F0] px-4 py-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#212121]">Product Review</h2>
                <p className="text-[11px] text-[#878787]">{active.name} • {active.id}</p>
              </div>
              <button className="p-1.5 rounded-sm hover:bg-gray-100" onClick={() => { if (!actionLoading) { setSelected(null); setDetail(null); } }}><XCircle size={16} className="text-[#757575]" /></button>
            </div>

            {detailLoading ? (
              <div className="py-16 flex items-center justify-center gap-2 text-sm text-[#878787]"><Loader2 size={16} className="animate-spin" /> Loading product details...</div>
            ) : (
              <div className="p-4 space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4">
                  <div className="w-full h-44 md:h-48 bg-[#F7F7F7] border border-[#EEEEEE] rounded-sm overflow-hidden flex items-center justify-center">
                    {(active.thumbnail || detail?.thumbnail) ? <img src={active.thumbnail || detail?.thumbnail} alt={active.name} className="w-full h-full object-contain" /> : <span className="text-[#9E9E9E]">No image</span>}
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2"><ApprovalBadge status={active.approvalStatus} /><PublicationBadge status={active.productStatus} /></div>
                    <p className="text-sm font-semibold text-[#212121]">{active.name}</p>
                    <p className="text-[#616161]">{active.brand || detail?.brand || "-"} • {active.category || detail?.category || "-"} {active.subcategory || detail?.subcategory ? ` / ${active.subcategory || detail?.subcategory}` : ""}</p>
                    <p><span className="text-[#878787]">Price:</span> <span className="font-semibold text-[#212121]">{formatPrice(Number(active.price || detail?.price || 0))}</span> <span className="text-[#878787]">(MRP {formatPrice(Number(active.mrp || detail?.mrp || 0))})</span></p>
                    <p><span className="text-[#878787]">Stock:</span> {Number(active.stock ?? detail?.stock ?? 0)} • <span className="text-[#878787]">SKU:</span> {active.sku || detail?.sku || "-"}</p>
                    <p><span className="text-[#878787]">Seller:</span> {active.seller?.storeName || detail?.seller?.storeName || active.seller?.name || detail?.seller?.name || "-"} ({active.seller?.email || detail?.seller?.email || "-"})</p>
                    {(active.rejectionReason || detail?.rejectionReason) && <div className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-red-700"><b>Rejection reason:</b> {active.rejectionReason || detail?.rejectionReason}</div>}
                    {(active.adminComment || detail?.adminComment) && <div className="rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800"><b>Admin comment / requested changes:</b> {active.adminComment || detail?.adminComment}</div>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="font-semibold text-[#212121]">Description</p>
                    <div className="rounded-sm border border-[#F0F0F0] bg-[#FAFAFA] p-3 text-[#555] whitespace-pre-wrap min-h-[80px]">{detail?.description || active.description || "No description provided."}</div>
                    {Array.isArray(detail?.highlights) && detail.highlights.length > 0 && (
                      <div>
                        <p className="font-semibold text-[#212121] mb-1">Highlights</p>
                        <ul className="list-disc pl-5 space-y-1 text-[#555]">{detail.highlights.map((h: string, i: number) => <li key={i}>{h}</li>)}</ul>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-[#212121] mb-1">Review Actions</p>
                      <label className="flex items-center gap-2 text-[11px] text-[#555] mb-2">
                        <input type="checkbox" checked={activateOnApprove} onChange={(e) => setActivateOnApprove(e.target.checked)} />
                        Activate product immediately on approval (if stock/visibility rules allow public listing)
                      </label>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[11px] font-medium text-[#616161] mb-1">Admin comment (optional for approve, required for request changes)</label>
                          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="w-full border border-[#E0E0E0] rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#2874F0]" placeholder="Feedback to seller / approval notes" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-[#616161] mb-1">Rejection reason (required for reject)</label>
                          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full border border-[#E0E0E0] rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#2874F0]" placeholder="Clear reason for rejection" />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Button size="sm" className="h-8 px-3 bg-[#2E7D32] hover:bg-[#256628] text-white" disabled={!!actionLoading} onClick={() => runAction("approve", active.id)}>
                          {actionLoading === `${active.id}:approve` ? <Loader2 size={13} className="animate-spin mr-1" /> : <CheckCircle2 size={13} className="mr-1" />} Approve
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 px-3 border-orange-200 text-orange-700 hover:bg-orange-50" disabled={!!actionLoading} onClick={() => runAction("changes", active.id)}>
                          {actionLoading === `${active.id}:changes` ? <Loader2 size={13} className="animate-spin mr-1" /> : <FileEdit size={13} className="mr-1" />} Request Changes
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 px-3 border-red-200 text-red-700 hover:bg-red-50" disabled={!!actionLoading} onClick={() => runAction("reject", active.id)}>
                          {actionLoading === `${active.id}:reject` ? <Loader2 size={13} className="animate-spin mr-1" /> : <Ban size={13} className="mr-1" />} Reject
                        </Button>
                      </div>
                      <p className="text-[10px] text-[#878787] mt-2">Actions are backend-enforced and recorded in approval history/audit logs. Sellers cannot self-approve.</p>
                    </div>
                    {Array.isArray(detail?.approvalHistory) && detail.approvalHistory.length > 0 && (
                      <div>
                        <p className="font-semibold text-[#212121] mb-1">Approval History</p>
                        <div className="max-h-48 overflow-y-auto rounded-sm border border-[#F0F0F0] divide-y divide-[#F5F5F5]">
                          {[...detail.approvalHistory].reverse().map((h: any, i: number) => (
                            <div key={i} className="p-2.5 bg-white">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-[#212121]">{h.action || "ACTION"}</span>
                                <span className="text-[10px] text-[#878787]">{h.createdAt ? new Date(h.createdAt).toLocaleString("en-IN") : ""}</span>
                              </div>
                              <p className="text-[#616161] mt-0.5">{h.fromApprovalStatus || "-"} → {h.toApprovalStatus || "-"} {h.toProductStatus ? `(${h.toProductStatus})` : ""}</p>
                              {(h.reason || h.comment) && <p className="text-[#757575] mt-0.5">{h.reason || h.comment}</p>}
                              <p className="text-[10px] text-[#9E9E9E] mt-0.5">By: {h.actorName || h.actorRole || "system"}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
