"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  position?: "left" | "right" | "bottom";
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Drawer({
  isOpen,
  onClose,
  position = "right",
  title,
  description,
  children,
  footer,
  className,
}: DrawerProps) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const positionClasses = {
    right: "top-0 right-0 h-full w-full max-w-md animate-in slide-in-from-right duration-300",
    left: "top-0 left-0 h-full w-full max-w-md animate-in slide-in-from-left duration-300",
    bottom: "bottom-0 left-0 right-0 max-h-[85vh] rounded-t-lg animate-in slide-in-from-bottom duration-300",
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "fixed bg-white shadow-2xl flex flex-col z-50 overflow-hidden",
          positionClasses[position],
          className
        )}
      >
        {/* Mobile bottom sheet grab handle */}
        {position === "bottom" && (
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#F0F0F0] bg-white">
          <div>
            {title && <h3 className="font-bold text-base text-[#212121]">{title}</h3>}
            {description && <p className="text-xs text-[#878787] mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-sm text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 text-sm text-[#212121]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-[#F0F0F0] bg-[#F9FAFB] flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
