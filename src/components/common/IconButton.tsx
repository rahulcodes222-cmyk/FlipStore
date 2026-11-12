"use client";

import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface IconButtonProps extends Omit<ButtonProps, "leftIcon" | "rightIcon"> {
  "aria-label": string;
  icon: React.ReactNode;
  badge?: number | string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, icon, "aria-label": ariaLabel, badge, size = "icon", variant = "ghost", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        aria-label={ariaLabel}
        className={cn("relative shrink-0", className)}
        {...props}
      >
        {icon}
        {badge !== undefined && badge !== null && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FB641B] px-1 text-[10px] font-bold text-white shadow-sm animate-in fade-in zoom-in-75">
            {badge}
          </span>
        )}
      </Button>
    );
  }
);
IconButton.displayName = "IconButton";
