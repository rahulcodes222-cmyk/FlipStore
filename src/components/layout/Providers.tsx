"use client";

import React from "react";
import { ToastProvider } from "@/components/common/Toast";

/**
 * Client-side Providers wrapper.
 * Provides Toast notifications, theme contexts, and global state boundaries.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

