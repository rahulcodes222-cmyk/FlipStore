"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  XCircle,
  Eye,
  Clock3,
  Ban,
  X,
  FileText,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { adminService } from "@/services/adminService";
import { useToast } from "@/components/common/Toast";
import { cn } from "@/lib/utils";

type VendorStatus = "Draft" | "Pending" | "Under Review" | "Approved" | "Rejected" | "Suspended";

interface VendorRow {
  id: string;
  sellerId?: string;
  userId?: string;
  storeName?: string;
  storeSlug?: string;
  applicationStatus: VendorStatus;
  approvalStatus?: string;
  rejectionReason?: string;
  suspensionReason?: string;
  adminNotes?: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  suspendedAt?: string;
  lastReviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  businessDetails?: {
    businessName?: string;
    businessType?: string;
    businessDescription?: string;
    businessEmail?: string;
    businessPhone?: string;
    category?: string;
    address?: any;
  };
  gstNumber?: string;
  panNumber?: string;
  storeProfile?: { storeName?: string; storeSlug?: string; description?: string; logoUrl?: string; bannerUrl?: string; supportEmail?: string; supportPhone?: string };
  bankDetails?: { accountHolderName?: string; bankName?: string; accountNumberMasked?: string; accountLast4?: string; ifscCode?: string; upiId?: string; branchName?: string; updatedAt?: string };
  documents?: Array<{
    id: string;
    type: string;
    fileName: string;
    fileUrl: string;
    mimeType: string;
    status: string;
    uploadedAt: string;
  }>;
  auditLog?: Array<{
    action: string;
    fromStatus: string;
    toStatus: string;
    note: string;
    actorId: string;
    actorRole: string;
    actorName: string;
    createdAt: string;
  }>;
  commissionRate?: number;
  rating?: number;
  totalSales?: number;
  totalOrders?: number;
  totalProducts?: number;
  availableBalance?: number;
  totalEarnings?: number;
  pendingOrders?: number;
  cancelledOrders?: number;
}

function StatusBadge({ status }: { status: string }) {
  const st = String(status || "").toLowerCase();
  const cls =
    st === "approved" ? "bg-green-50 text-green-700 border-green-200" :
    st === "rejected" ? "bg-red-50 text-red-700 border-red-200" :
    st === "suspended" ? "bg-orange-50 text-orange-700 border-orange-200" :
    st === "under review" ? "bg-blue-50 text-blue-700 border-blue-200" :
    st === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
    "bg-gray-50 text-gray-700 border-gray-200";
  const Icon = st === "approved" ? CheckCircle2 : st === "rejected" ? XCircle : st === "suspended" ? Ban : st === "under review" ? Eye : st === "pending" ? Clock3 : Store;
  return <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold", cls)}><Icon size={10} /> {status || "Draft"}</span>;
}

export function AdminVendorsClient() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<VendorRow | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [viewingDocument, setViewingDocument] = useState<{ fileUrl: string; fileName: string; mimeType: string } | null>(null);

  const resolveDocumentUrl = (fileUrl: string): string => {
    if (!fileUrl) return "";
    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
      return fileUrl;
    }
    if (fileUrl.startsWith("/")) {
      return `${window.location.origin}${fileUrl}`;
    }
    return fileUrl;
  };

  const openDocument = (fileUrl: string, fileName: string, mimeType: string) => {
    const absoluteUrl = resolveDocumentUrl(fileUrl);
    if (!absoluteUrl) return;

    // Blob URLs are document-local — show inline in a viewer modal
    if (absoluteUrl.startsWith("blob:")) {
      setViewingDocument({ fileUrl: absoluteUrl, fileName, mimeType });
      return;
    }

    // Regular HTTP(S) URLs open in a new tab
    window.open(absoluteUrl, "_blank");
  };

  const fetchVendors = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await adminService.getVendors({ status: status || undefined, search: search || undefined, page: 1, limit: 100 });
      setVendors(Array.isArray(res?.vendors) ? res.vendors : []);
    } catch (e: any) {
      toast({ type: "error", title: "Failed to load seller requests", message: e?.message || "Please try again." });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, status, toast]);

  useEffect(() => { fetchVendors(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setTimeout(() => { fetchVendors({ silent: true }); }, 300);
    return () => clearTimeout(t);
  }, [search, status, fetchVendors]);

  const counts = useMemo(() => {
    const c = { total: vendors.length, pending: 0, underReview: 0, approved: 0, rejected: 0 };
    for (const v of vendors) {
      const s = String(v.applicationStatus || "").toLowerCase();
      if (s === "pending") c.pending++;
      else if (s === "under review") c.underReview++;
      else if (s === "approved") c.approved++;
      else if (s === "rejected") c.rejected++;
    }
    return c;
  }, [vendors]);

  const handleStatus = async (vendor: VendorRow, nextStatus: VendorStatus) => {
    setActionLoading(`${vendor.id}:${nextStatus}`);
    try {
      await adminService.updateVendorStatus(vendor.id, nextStatus, {
        reason: reason.trim() || undefined,
        note: reason.trim() || `Status changed to ${nextStatus} by admin`,
      });
      toast({ type: "success", title: "Status updated", message: `${vendor.storeName || vendor.businessDetails?.businessName || "Seller"} marked as ${nextStatus}.` });
      setReason("");
      setSelected(null);
      await fetchVendors({ silent: true });
    } catch (e: any) {
      toast({ type: "error", title: "Update failed", message: e?.message || "Could not update seller status." });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#212121]">Seller Requests</h1>
          <p className="text-xs text-[#878787] mt-0.5">Review seller applications, inspect submitted details, and approve or reject access.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchVendors({ silent: true })} disabled={refreshing} className="gap-1.5">
          {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total", value: counts.total },
          { label: "Pending", value: counts.pending },
          { label: "Under Review", value: counts.underReview },
          { label: "Approved", value: counts.approved },
          { label: "Rejected", value: counts.rejected },
        ].map((s) => (
          <Card key={s.label} className="border-[#E0E0E0]"><CardContent className="p-4">
            <p className="text-[11px] text-[#878787] uppercase font-semibold">{s.label}</p>
            <p className="text-lg font-bold text-[#212121] mt-1">{s.value}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card className="border-[#E0E0E0]"><CardContent className="p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex-1 max-w-xl relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <Input placeholder="Search by store, seller ID, business name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-xs" />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 px-3 text-xs bg-white border border-[#E0E0E0] rounded-sm w-full lg:w-56">
            <option value="">All statuses</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Suspended">Suspended</option>
            <option value="Draft">Draft</option>
          </select>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center text-sm text-[#878787] gap-2"><Loader2 size={16} className="animate-spin" /> Loading seller requests...</div>
        ) : vendors.length === 0 ? (
          <div className="py-16 text-center">
            <Store size={28} className="mx-auto text-[#BDBDBD] mb-2" />
            <p className="text-sm font-semibold text-[#212121]">No seller applications found</p>
            <p className="text-xs text-[#878787] mt-1">Applications submitted from /sell will appear here for review.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-sm border border-[#F0F0F0]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAFA] text-[#878787] uppercase text-[10px] font-bold border-b border-[#F0F0F0]">
                <tr>
                  <th className="py-3 px-4">Seller / Store</th>
                  <th className="py-3 px-4">Business Details</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F5F5]">
                {vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-[#FCFCFC]">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#212121]">{v.storeName || v.businessDetails?.businessName || "Seller Application"}</p>
                      <p className="text-[11px] text-[#878787]">{v.sellerId || v.id}</p>
                      <p className="text-[11px] text-[#878787]">{v.businessDetails?.businessEmail || v.storeProfile?.supportEmail || "-"}</p>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-[#555] space-y-0.5">
                      <p><span className="text-[#878787]">Type:</span> {v.businessDetails?.businessType || "-"}</p>
                      <p><span className="text-[#878787]">Phone:</span> {v.businessDetails?.businessPhone || v.storeProfile?.supportPhone || "-"}</p>
                      <p><span className="text-[#878787]">GST/PAN:</span> {v.gstNumber || "-"} / {v.panNumber || "-"}</p>
                    </td>
                    <td className="py-3 px-4"><StatusBadge status={v.applicationStatus} /></td>
                    <td className="py-3 px-4 text-[11px] text-[#555]">{v.submittedAt ? new Date(v.submittedAt).toLocaleString("en-IN") : v.createdAt ? new Date(v.createdAt).toLocaleString("en-IN") : "-"}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" className="h-7 px-2 text-[11px]" onClick={() => { setSelected(v); setReason(v.rejectionReason || v.adminNotes || ""); }}><Eye size={12} className="mr-1" /> View</Button>
                        {v.applicationStatus !== "Approved" && (
                          <Button size="sm" className="h-7 px-2 text-[11px] bg-[#2E7D32] hover:bg-[#256628] text-white" onClick={() => handleStatus(v, "Approved")} disabled={actionLoading === `${v.id}:Approved`}>
                            {actionLoading === `${v.id}:Approved` ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} className="mr-1" />} Approve
                          </Button>
                        )}
                        {v.applicationStatus !== "Rejected" && (
                          <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleStatus(v, "Rejected")} disabled={actionLoading === `${v.id}:Rejected`}>
                            {actionLoading === `${v.id}:Rejected` ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} className="mr-1" />} Reject
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
      </CardContent></Card>

      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-sm max-w-3xl w-full max-h-[90vh] overflow-y-auto p-5 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 border-b border-[#F0F0F0] pb-3">
              <div>
                <p className="font-semibold text-sm text-[#212121]">{selected.storeName || selected.businessDetails?.businessName || "Vendor Application"}</p>
                <p className="text-[11px] text-[#878787]">Vendor ID: {selected.sellerId || selected.id}</p>
              </div>
              <div className="flex items-center gap-2"><StatusBadge status={selected.applicationStatus} /><button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button></div>
            </div>

            {/* Store Profile & Logo */}
            {(selected.storeProfile?.logoUrl || selected.storeProfile?.bannerUrl || selected.storeName) && (
              <div className="border border-[#F0F0F0] rounded-sm p-3 space-y-2">
                <p className="font-semibold text-[#212121] text-xs">Store Profile</p>
                <div className="flex items-center gap-3">
                  {selected.storeProfile?.logoUrl && (
                    <div className="w-16 h-16 rounded border border-[#E0E0E0] overflow-hidden">
                      <img src={selected.storeProfile.logoUrl} alt="Store Logo" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p><span className="text-[#878787]">Store Name:</span> {selected.storeProfile?.storeName || selected.storeName || "-"}</p>
                    {selected.storeProfile?.description && (
                      <p className="text-[11px] text-[#555] mt-0.5">{selected.storeProfile.description}</p>
                    )}
                  </div>
                </div>
                {selected.storeProfile?.bannerUrl && (
                  <div className="mt-2 w-full h-24 rounded border border-[#E0E0E0] overflow-hidden">
                    <img src={selected.storeProfile.bannerUrl} alt="Store Banner" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="border border-[#F0F0F0] rounded-sm p-3 space-y-1.5">
                <p className="font-semibold text-[#212121]">Business</p>
                <p><span className="text-[#878787]">Name:</span> {selected.businessDetails?.businessName || "-"}</p>
                <p><span className="text-[#878787]">Type:</span> {selected.businessDetails?.businessType || "-"}</p>
                <p><span className="text-[#878787]">Category:</span> {selected.businessDetails?.category || "-"}</p>
                <p><span className="text-[#878787]">Description:</span> {selected.businessDetails?.businessDescription || "-"}</p>
                <p><span className="text-[#878787]">Email:</span> {selected.businessDetails?.businessEmail || "-"}</p>
                <p><span className="text-[#878787]">Phone:</span> {selected.businessDetails?.businessPhone || "-"}</p>
                <p><span className="text-[#878787]">GST:</span> {selected.gstNumber || "-"}</p>
                <p><span className="text-[#878787]">PAN:</span> {selected.panNumber || "-"}</p>
              </div>
              <div className="border border-[#F0F0F0] rounded-sm p-3 space-y-1.5">
                <p className="font-semibold text-[#212121]">Bank Details</p>
                <p><span className="text-[#878787]">Account Holder:</span> {selected.bankDetails?.accountHolderName || "-"}</p>
                <p><span className="text-[#878787]">Bank:</span> {selected.bankDetails?.bankName || "-"}</p>
                <p><span className="text-[#878787]">Account:</span> {selected.bankDetails?.accountNumberMasked || selected.bankDetails?.accountLast4 || "-"}</p>
                <p><span className="text-[#878787]">IFSC:</span> {selected.bankDetails?.ifscCode || "-"}</p>
                {selected.bankDetails?.upiId && (
                  <p><span className="text-[#878787]">UPI ID:</span> {selected.bankDetails.upiId}</p>
                )}
                {selected.bankDetails?.branchName && (
                  <p><span className="text-[#878787]">Branch:</span> {selected.bankDetails.branchName}</p>
                )}
                {selected.bankDetails?.updatedAt && (
                  <p><span className="text-[#878787]">Updated:</span> {new Date(selected.bankDetails.updatedAt).toLocaleString("en-IN")}</p>
                )}
              </div>
            </div>

            {selected.businessDetails?.address && (
              <div className="border border-[#F0F0F0] rounded-sm p-3 text-xs">
                <p className="font-semibold text-[#212121] mb-1">Business Address</p>
                <p className="text-[#555]">{[selected.businessDetails.address.street, selected.businessDetails.address.locality, selected.businessDetails.address.city, selected.businessDetails.address.state, selected.businessDetails.address.pincode].filter(Boolean).join(", ")}</p>
              </div>
            )}

            {/* Documents */}
            {selected.documents && selected.documents.length > 0 && (
              <div className="border border-[#F0F0F0] rounded-sm p-3 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-[#212121]">Uploaded Documents ({selected.documents.length})</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selected.documents.map((doc) => (
                    <div key={doc.id} className="border border-[#E0E0E0] rounded-sm p-2 bg-[#FAFAFA]">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded bg-[#E0E0E0] flex items-center justify-center text-[10px] text-[#555]">
                          {doc.mimeType?.startsWith("image/") ? <ImageIcon size={14} /> : <FileText size={14} />}
                        </div>
                        <span className="text-[10px] font-semibold text-[#212121]">{doc.type}</span>
                        <span className={`text-[9px] px-1 py-0 rounded ${
                          doc.status === "approved" ? "bg-green-50 text-green-700" :
                          doc.status === "rejected" ? "bg-red-50 text-red-700" :
                          doc.status === "under review" ? "bg-blue-50 text-blue-700" :
                          "bg-gray-50 text-gray-700"
                        }`}>{doc.status}</span>
                      </div>
                      <p className="text-[10px] text-[#555] truncate" title={doc.fileName}>{doc.fileName}</p>
                      <p className="text-[9px] text-[#878787]">{doc.mimeType}</p>
                      <button
                        onClick={() => openDocument(doc.fileUrl, doc.fileName, doc.mimeType)}
                        className="text-[10px] text-[#2874F0] underline hover:text-[#1259c7] flex items-center gap-1 cursor-pointer"
                      >
                        <Upload size={10} className="mr-1" /> View Document
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Log */}
            {selected.auditLog && selected.auditLog.length > 0 && (
              <div className="border border-[#F0F0F0] rounded-sm p-3 text-xs">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-[#212121]">Audit Log ({selected.auditLog.length})</p>
                </div>
                <div className="space-y-2">
                  {selected.auditLog.map((log) => (
                    <div key={log.createdAt + log.action} className="border-b border-[#F0F0F0] pb-2 last:border-0">
                      <div className="flex items-center gap-2 text-xs mb-0.5">
                        <span className="text-[#878787] font-semibold">{log.action}</span>
                        <span
                          className={`px-1 py-0 rounded text-[9px] font-bold ${
                            log.toStatus?.toLowerCase() === "approved"
                              ? "bg-green-50 text-green-700"
                              : log.toStatus?.toLowerCase() === "rejected"
                              ? "bg-red-50 text-red-700"
                              : log.toStatus?.toLowerCase() === "under review"
                              ? "bg-blue-50 text-blue-700"
                              : log.toStatus?.toLowerCase() === "pending"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-gray-50 text-gray-700"
                          }`}
                        >
                          {log.fromStatus || "-"} → {log.toStatus || "-"}
                        </span>
                        <span className="text-[9px] text-[#555]">
                          {new Date(log.createdAt).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {log.note && (
                        <p className="text-[10px] text-[#555] ml-6">{log.note}</p>
                      )}
                      {log.actorName && (
                        <p className="text-[10px] text-[#555] ml-6">
                          <span className="text-[#878787]">By:</span>{" "}
                          {log.actorName} ({log.actorRole})
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Business Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <Card className="border-[#E0E0E0]"><CardContent className="p-3">
                <p className="text-[10px] text-[#878787] uppercase font-semibold">Rating</p>
                <p className="text-lg font-bold text-[#212121]">{selected.rating || 0}</p>
              </CardContent></Card>
              <Card className="border-[#E0E0E0]"><CardContent className="p-3">
                <p className="text-[10px] text-[#878787] uppercase font-semibold">Total Sales</p>
                <p className="text-lg font-bold text-[#212121]">{selected.totalSales || 0}</p>
              </CardContent></Card>
              <Card className="border-[#E0E0E0]"><CardContent className="p-3">
                <p className="text-[10px] text-[#878787] uppercase font-semibold">Total Orders</p>
                <p className="text-lg font-bold text-[#212121]">{selected.totalOrders || 0}</p>
              </CardContent></Card>
              <Card className="border-[#E0E0E0]"><CardContent className="p-3">
                <p className="text-[10px] text-[#878787] uppercase font-semibold">Total Products</p>
                <p className="text-lg font-bold text-[#212121]">{selected.totalProducts || 0}</p>
              </CardContent></Card>
            </div>

            <div className="border border-[#F0F0F0] rounded-sm p-3 space-y-2">
              <p className="font-semibold text-[#212121] text-xs">Admin Action Note (optional)</p>
              <textarea className="w-full min-h-[80px] border border-[#E0E0E0] rounded-sm p-2 text-xs focus:outline-none focus:border-[#2874F0]" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Add reason/note for approval, rejection, or suspension..." />
              <div className="flex flex-wrap gap-2 justify-end">
                {selected.applicationStatus !== "Under Review" && (
                  <Button variant="outline" size="sm" onClick={() => handleStatus(selected, "Under Review")} disabled={actionLoading === `${selected.id}:Under Review`}>
                    {actionLoading === `${selected.id}:Under Review` ? <Loader2 size={14} className="animate-spin mr-1" /> : <ShieldCheck size={14} className="mr-1" />} Mark Under Review
                  </Button>
                )}
                {selected.applicationStatus !== "Approved" && (
                  <Button size="sm" className="bg-[#2E7D32] hover:bg-[#256628] text-white" onClick={() => handleStatus(selected, "Approved")} disabled={actionLoading === `${selected.id}:Approved`}>
                    {actionLoading === `${selected.id}:Approved` ? <Loader2 size={14} className="animate-spin mr-1" /> : <CheckCircle2 size={14} className="mr-1" />} Approve
                  </Button>
                )}
                {selected.applicationStatus !== "Rejected" && (
                  <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => handleStatus(selected, "Rejected")} disabled={actionLoading === `${selected.id}:Rejected`}>
                    {actionLoading === `${selected.id}:Rejected` ? <Loader2 size={14} className="animate-spin mr-1" /> : <XCircle size={14} className="mr-1" />} Reject
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Document Viewer Modal (for blob URLs) ───────────────────────────── */}
      {viewingDocument && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setViewingDocument(null)}>
          <div className="bg-white rounded-sm max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#E0E0E0] p-4">
              <h2 className="text-base font-bold text-[#212121]">{viewingDocument.fileName}</h2>
              <button onClick={() => setViewingDocument(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-[#F1F3F6] p-4 flex items-center justify-center">
              {viewingDocument.mimeType.startsWith("image/") ? (
                <img src={viewingDocument.fileUrl} alt={viewingDocument.fileName} className="max-w-full max-h-full object-contain" />
              ) : viewingDocument.mimeType.includes("pdf") ? (
                <iframe src={viewingDocument.fileUrl} className="w-full h-full" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-[#878787] text-sm">
                  <FileText size={48} className="mb-2 text-gray-400" />
                  <p>Document preview not supported for this file type.</p>
                  <p className="text-[10px] text-[#555] mt-1">{viewingDocument.mimeType}</p>
                </div>
              )}
            </div>
            <div className="border-t border-[#E0E0E0] p-3 flex justify-end">
              <button onClick={() => setViewingDocument(null)} className="text-xs text-[#2874F0] underline hover:text-[#1259c7]">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
