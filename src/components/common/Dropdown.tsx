"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface DropdownProps {
  label?: string;
  items: DropdownItem[];
  selectedId?: string;
  onSelect: (item: DropdownItem) => void;
  trigger?: React.ReactNode;
  align?: "left" | "right";
  placeholder?: string;
  className?: string;
}

export function Dropdown({
  label,
  items,
  selectedId,
  onSelect,
  trigger,
  align = "left",
  placeholder = "Select option",
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedItem = items.find((item) => item.id === selectedId);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left", className)}>
      {trigger ? (
        <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-full items-center justify-between gap-2 rounded-sm border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#212121] shadow-2xs hover:border-[#2874F0] focus:border-[#2874F0] focus:outline-none transition-colors"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="truncate">
            {selectedItem ? (
              <span className="flex items-center gap-2">
                {selectedItem.icon}
                <span>{selectedItem.label}</span>
              </span>
            ) : (
              <span className="text-[#878787]">{placeholder}</span>
            )}
          </span>
          <ChevronDown
            size={16}
            className={cn("text-gray-500 transition-transform duration-200", isOpen && "rotate-180")}
          />
        </button>
      )}

      {/* Dropdown Menu Container */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-1 min-w-[200px] rounded-sm border border-[#E0E0E0] bg-white py-1 shadow-lg animate-in fade-in-50 zoom-in-95",
            align === "right" ? "right-0" : "left-0"
          )}
          role="listbox"
        >
          {label && (
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#878787] border-b border-[#F0F0F0]">
              {label}
            </div>
          )}

          <div className="max-h-60 overflow-y-auto py-1">
            {items.map((item) => {
              const isSelected = item.id === selectedId;

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    if (!item.disabled) {
                      onSelect(item);
                      setIsOpen(false);
                    }
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors",
                    item.disabled
                      ? "cursor-not-allowed opacity-40 text-gray-400"
                      : "cursor-pointer hover:bg-[#F1F3F6]",
                    isSelected ? "bg-[#eaf2ff] font-semibold text-[#2874F0]" : "text-[#212121]"
                  )}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <div>
                      <div>{item.label}</div>
                      {item.description && (
                        <div className="text-xs text-[#878787] font-normal">{item.description}</div>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check size={16} className="text-[#2874F0] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
