"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReportType } from "@/types";
import { cn } from "@/lib/utils";

const REPORT_LABELS: Record<ReportType, string> = {
  SALES: "Sales Report",
  ORDERS: "Orders Report",
  INVENTORY: "Inventory Report",
  EARNINGS: "Earnings Report",
  PAYMENTS: "Payments Report",
};

interface ReportExportButtonProps {
  type: ReportType;
  onDownload?: () => void;
  className?: string;
}

export function ReportExportButton({ type, onDownload, className }: ReportExportButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        onDownload?.();
        const reportName = REPORT_LABELS[type];
        const blob = new Blob(["Mock report data for " + reportName], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${reportName.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }}
      className={cn("flex items-center gap-2", className)}
      leftIcon={<Download size={14} />}
    >
      Export {REPORT_LABELS[type]}
    </Button>
  );
}
