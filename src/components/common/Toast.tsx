"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (options: { type?: ToastType; title?: string; message: string; duration?: number }) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({
      type = "info",
      title,
      message,
      duration = 4000,
    }: {
      type?: ToastType;
      title?: string;
      message: string;
      duration?: number;
    }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((msg: string, title?: string) => toast({ type: "success", message: msg, title }), [toast]);
  const error = useCallback((msg: string, title?: string) => toast({ type: "error", message: msg, title }), [toast]);
  const info = useCallback((msg: string, title?: string) => toast({ type: "info", message: msg, title }), [toast]);
  const warning = useCallback((msg: string, title?: string) => toast({ type: "warning", message: msg, title }), [toast]);

  const typeStyles = {
    success: {
      border: "border-l-4 border-l-[#388E3C]",
      icon: <CheckCircle2 size={18} className="text-[#388E3C] shrink-0" />,
      titleColor: "text-[#388E3C]",
    },
    error: {
      border: "border-l-4 border-l-[#D32F2F]",
      icon: <AlertCircle size={18} className="text-[#D32F2F] shrink-0" />,
      titleColor: "text-[#D32F2F]",
    },
    warning: {
      border: "border-l-4 border-l-[#FF9F00]",
      icon: <AlertTriangle size={18} className="text-[#FF9F00] shrink-0" />,
      titleColor: "text-[#FF9F00]",
    },
    info: {
      border: "border-l-4 border-l-[#2874F0]",
      icon: <Info size={18} className="text-[#2874F0] shrink-0" />,
      titleColor: "text-[#2874F0]",
    },
  };

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning, removeToast }}>
      {children}
      {/* Toast Viewport Container */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const config = typeStyles[t.type];
          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 bg-white p-3.5 rounded-sm shadow-xl border border-[#E0E0E0] animate-in slide-in-from-bottom-3 duration-200",
                config.border
              )}
            >
              <div className="mt-0.5">{config.icon}</div>
              <div className="flex-1 min-w-0">
                {t.title && <h5 className={cn("text-xs font-bold leading-none mb-1", config.titleColor)}>{t.title}</h5>}
                <p className="text-xs text-[#212121] leading-relaxed break-words">{t.message}</p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-gray-400 hover:text-gray-700 p-0.5 rounded transition-colors"
                aria-label="Close notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
