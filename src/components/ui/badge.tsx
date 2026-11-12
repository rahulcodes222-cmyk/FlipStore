import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#2874F0] text-white hover:bg-[#1259c7]",
        secondary:
          "border-transparent bg-[#172337] text-white",
        destructive:
          "border-transparent bg-red-600 text-white",
        outline: "text-[#212121] border-[#E0E0E0]",
        rating: "border-transparent bg-[#388E3C] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-[3px] gap-1",
        discount: "border-transparent bg-[#E8F5E9] text-[#388E3C] font-semibold",
        tag: "border-[#FB641B] bg-[#FFF3ED] text-[#FB641B]",
        assured: "border-transparent text-[#2874F0] font-black italic",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
