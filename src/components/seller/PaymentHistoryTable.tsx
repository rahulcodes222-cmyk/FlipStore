"use client";

import type { PaymentTransaction } from "@/types";
import { cn } from "@/lib/utils";

const PAYMENT_STATUS_CONFIG: Record<string, string> = {
  PENDING: "bg-[#FFF8E1] text-[#B26A00] border-[#FFE082]",
  PROCESSING: "bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]",
  PAID: "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]",
  FAILED: "bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]",
  REFUNDED: "bg-[#F5F5F5] text-[#616161] border-[#E0E0E0]",
};

interface PaymentHistoryTableProps {
  transactions: PaymentTransaction[];
  className?: string;
}

export function PaymentHistoryTable({ transactions, className }: PaymentHistoryTableProps) {
  if (transactions.length === 0) {
    return (
      <div className={cn("rounded-sm border border-[#E0E0E0] bg-white p-8 shadow-sm", className)}>
        <div className="text-center"><p className="text-sm text-[#878787]">No payment transactions found.</p></div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-sm border border-[#E0E0E0] bg-white shadow-sm", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="border-b border-[#F0F0F0] bg-[#F9FAFB]">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Transaction ID</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Order ID</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Description</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Date</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Gross Amount</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Commission</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Net Amount</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Type</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-[#878787] uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0F0F0]">
            {transactions.map((txn) => (
              <tr key={txn.id} className="hover:bg-[#F1F3F6] transition-colors">
                <td className="px-4 py-3"><div className="text-sm font-medium text-[#212121]">{txn.transactionId}</div><div className="text-[10px] text-[#878787]">{txn.id}</div></td>
                <td className="px-4 py-3 text-sm text-[#212121]">{txn.orderNumber}</td>
                <td className="px-4 py-3"><div className="text-sm font-medium text-[#212121]">{txn.customerName}</div></td>
                <td className="px-4 py-3 text-sm text-[#212121]">{new Date(txn.paymentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                <td className="px-4 py-3 text-sm font-medium text-[#212121]">₹{Number(txn.grossAmount || 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-sm font-medium text-[#E53935]">-₹{Number(txn.commission || 0).toLocaleString("en-IN")}</td>
                <td className={cn("px-4 py-3 text-sm font-medium", Number(txn.netAmount || 0) < 0 ? "text-[#E53935]" : "text-[#212121]")}>₹{Number(txn.netAmount || 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-xs text-[#212121]">{String(txn.paymentMethod || "").replace(/_/g, " ")}</td>
                <td className="px-4 py-3"><span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold border", PAYMENT_STATUS_CONFIG[txn.status] || PAYMENT_STATUS_CONFIG.PENDING)}>{String(txn.status || "").charAt(0) + String(txn.status || "").slice(1).toLowerCase()}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
