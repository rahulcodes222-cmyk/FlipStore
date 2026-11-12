import { Coupon } from "@/types";

export const MOCK_COUPONS: Coupon[] = [
  {
    id: "coup-welcome100",
    code: "WELCOME100",
    discountType: "FLAT",
    discountValue: 100,
    minOrderValue: 499,
    description: "Flat ₹100 Off on your first order above ₹499",
    validTill: "2026-12-31",
    isActive: true,
  },
  {
    id: "coup-festive20",
    code: "FESTIVE20",
    discountType: "PERCENTAGE",
    discountValue: 20,
    minOrderValue: 1999,
    maxDiscount: 1500,
    description: "20% Instant Discount up to ₹1,500 on orders above ₹1,999",
    validTill: "2026-12-31",
    isActive: true,
  },
  {
    id: "coup-flat500",
    code: "FLAT500",
    discountType: "FLAT",
    discountValue: 500,
    minOrderValue: 4999,
    description: "Flat ₹500 Discount on orders above ₹4,999",
    validTill: "2026-12-31",
    isActive: true,
  },
];
