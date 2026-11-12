import React from "react";
import { Skeleton } from "@/components/common/Skeleton";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#F1F3F6] p-4 flex flex-col items-center justify-center space-y-4">
      <div className="w-10 h-10 border-4 border-[#2874F0] border-t-transparent rounded-full animate-spin" />
      <Skeleton className="h-4 w-32 rounded-xs" />
    </div>
  );
}
