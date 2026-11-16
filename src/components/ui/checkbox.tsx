"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  indeterminate?: boolean;
}

export function Checkbox({
  className,
  checked = false,
  onCheckedChange,
  indeterminate = false,
  ...props
}: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={cn(
        "w-4 h-4 rounded-sm border-[#E0E0E0] text-[#2874F0] bg-white focus-visible:ring-1 focus-visible:ring-[#2874F0] cursor-pointer disabled:opacity-50",
        className
      )}
      checked={checked}
      defaultChecked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      onMouseDown={(e) => e.preventDefault()}
      ref={(el) => {
        if (el) el.indeterminate = indeterminate;
      }}
      {...props}
    />
  );
}
