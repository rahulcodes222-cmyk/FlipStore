"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const couponSchema = z.object({
  code: z.string().min(3, "Coupon code must be at least 3 characters").toUpperCase(),
  discountType: z.enum(["PERCENTAGE", "FLAT"]),
  discountValue: z.preprocess((val) => Number(val), z.number().min(1, "Discount value must be at least 1")),
  minOrderValue: z.preprocess((val) => Number(val), z.number().min(0, "Minimum order value must be positive")),
  maxDiscount: z.preprocess((val) => (val === "" || val === undefined ? undefined : Number(val)), z.number().min(0).optional()),
  startDate: z.string().min(1, "Start date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  usageLimit: z.preprocess((val) => Number(val), z.number().min(1, "Usage limit must be at least 1")),
});

type CouponFormValues = z.infer<typeof couponSchema>;

interface CouponFormProps {
  onSubmit: (values: CouponFormValues) => void;
  initialValues?: Partial<CouponFormValues>;
  isLoading?: boolean;
  className?: string;
}

export function CouponForm({ onSubmit, initialValues, isLoading = false, className }: CouponFormProps) {
const form = useForm<CouponFormValues>({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolver: zodResolver(couponSchema) as any,
    defaultValues: {
      code: "",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minOrderValue: 0,
      maxDiscount: undefined,
      startDate: "",
      expiryDate: "",
      usageLimit: 100,
      ...initialValues,
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Coupon Code</label>
          <Input {...form.register("code")} placeholder="e.g. DIWALI20" />
          {form.formState.errors.code && (
            <p className="text-[10px] text-[#E53935]">{form.formState.errors.code.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Discount Type</label>
          <select
            {...form.register("discountType")}
            className="flex h-10 w-full rounded-sm border border-[#E0E0E0] bg-white px-3 py-2 text-sm text-[#212121] focus-visible:ring-1 focus-visible:ring-[#2874F0]"
          >
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FLAT">Flat Amount (₹)</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Discount Value</label>
          <Input {...form.register("discountValue")} type="number" />
          {form.formState.errors.discountValue && (
            <p className="text-[10px] text-[#E53935]">{form.formState.errors.discountValue.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Min Order Value (₹)</label>
          <Input {...form.register("minOrderValue")} type="number" />
          {form.formState.errors.minOrderValue && (
            <p className="text-[10px] text-[#E53935]">{form.formState.errors.minOrderValue.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Max Discount (₹)</label>
          <Input {...form.register("maxDiscount")} type="number" placeholder="Optional" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Start Date</label>
          <Input {...form.register("startDate")} type="date" />
          {form.formState.errors.startDate && (
            <p className="text-[10px] text-[#E53935]">{form.formState.errors.startDate.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Expiry Date</label>
          <Input {...form.register("expiryDate")} type="date" />
          {form.formState.errors.expiryDate && (
            <p className="text-[10px] text-[#E53935]">{form.formState.errors.expiryDate.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#878787] uppercase tracking-wider">Usage Limit</label>
          <Input {...form.register("usageLimit")} type="number" />
          {form.formState.errors.usageLimit && (
            <p className="text-[10px] text-[#E53935]">{form.formState.errors.usageLimit.message}</p>
          )}
        </div>
      </div>
      <Button type="submit" variant="primary" isLoading={isLoading} className="w-auto">
        Create Coupon
      </Button>
    </form>
  );
}
