import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-sm border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#212121] ring-offset-background placeholder:text-[#878787] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2874F0] focus-visible:border-[#2874F0] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
