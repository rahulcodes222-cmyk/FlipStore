import type { Payout, PayoutStatus } from "@/types";
import { cn } from "@/lib/utils";

const PAYOUT_STATUS_CONFIG: Record<string, string> = {
  PENDING: "bg-[#FFF8E1] text-[#B26A00] border-[#FFE082]",
  UNDER_REVIEW: "bg-[#E3F2FD] text-[#1565C0] border-[#BBDEFB]",
  APPROVED: "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]",
  PROCESSING: "bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]",
  COMPLETED: "bg-[#E8F5E9] text-[#1B5E20] border-[#C8E6C9]",
  REJECTED: "bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]",
  FAILED: "bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]",
  PAID: "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]",
  CANCELLED: "bg-[#F5F5F5] text-[#616161] border-[#E0E0E0]",
};

interface PayoutHistoryTableProps {
  payouts: Payout[];
  className?: string;
}

function label(status: string) {
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PayoutHistoryTable({ payouts, className }: PayoutHistoryTableProps) {
  if (payouts.length === 0) {
    return (
      <div className={cn("rounded-sm border border-[#E0E0E0] bg-white p-8 shadow-sm", className)}>
        <div className="text-center"><p className="text-sm text-[#878787]">No payout history found.</p></div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-sm border border-[#E0E0E0] bg-white shadow-sm", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="border-b border-[#F0F0F0] bg-[#F9FAFB]">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Payout ID</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Date</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Bank</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Account</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Reference</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0F0]">
            {payouts.map((payout) => (
              <tr key={payout.id} className="hover:bg-[#F1F3F6] transition-colors">
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-[#212121]">{payout.payoutNumber || payout.id}</div>
                  <div className="text-[10px] text-[#878787]">{payout.id}</div>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-[#212121]">₹{Number(payout.amount || 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-sm text-[#212121]">{new Date(payout.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                <td className="px-4 py-3 text-sm text-[#212121]">{payout.bankName}</td>
                <td className="px-4 py-3 text-sm text-[#212121]">{payout.bankAccount}</td>
                <td className="px-4 py-3 text-sm text-[#212121]">
                  <div>{payout.transactionReference || payout.referenceId || "-"}</div>
                  {payout.reconciliationStatus ? <div className="text-[10px] text-[#878787]">{label(payout.reconciliationStatus)}</div> : null}
                </td>
                <td className="px-4 py-3">
                  <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border", PAYOUT_STATUS_CONFIG[payout.status] || PAYOUT_STATUS_CONFIG.PENDING)}>
                    {label(payout.status)}
                  </span>
                  {payout.rejectionReason ? <div className="text-[10px] text-[#C62828] mt-1">{payout.rejectionReason}</div> : null}
                  {payout.failureReason ? <div className="text-[10px] text-[#C62828] mt-1">{payout.failureReason}</div> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
