import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-all duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2874F0] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Primary Flipkart Blue
        primary: "bg-[#2874F0] text-white hover:bg-[#1259c7] shadow-sm hover:shadow",
        default: "bg-[#2874F0] text-white hover:bg-[#1259c7] shadow-sm hover:shadow",
        // Flipkart Orange Accent (Buy Now)
        buyNow: "bg-[#FB641B] text-white font-semibold hover:bg-[#e04e05] shadow hover:shadow-md",
        accent: "bg-[#FB641B] text-white font-semibold hover:bg-[#e04e05] shadow hover:shadow-md",
        // Add to Cart Yellow/Amber
        addToCart: "bg-[#FF9F00] text-white font-semibold hover:bg-[#e68f00] shadow hover:shadow-md",
        // Secondary Dark Navy
        secondary: "bg-[#172337] text-white hover:bg-[#21314d] shadow-sm",
        // Outline Button
        outline: "border border-[#2874F0] text-[#2874F0] bg-white hover:bg-[#eaf2ff]",
        outlineMuted: "border border-[#E0E0E0] text-[#212121] bg-white hover:bg-[#F1F3F6]",
        // Destructive
        destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        // Ghost / Subtle
        ghost: "hover:bg-gray-100 text-[#212121]",
        // Link Style
        link: "text-[#2874F0] underline-offset-4 hover:underline p-0 h-auto font-normal",
        subtle: "bg-[#F1F3F6] text-[#212121] hover:bg-gray-200",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base font-semibold",
        xl: "h-14 px-10 text-lg font-semibold",
        icon: "h-9 w-9 p-0",
        iconSm: "h-7 w-7 p-0",
        iconLg: "h-11 w-11 p-0",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
