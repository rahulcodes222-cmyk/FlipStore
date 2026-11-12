import { MOCK_COUPONS } from "@/data";
import { Coupon } from "@/types";

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  discountAmount?: number;
  message: string;
}

export const couponService = {
  /**
   * Get all active public coupons
   */
  async getAvailableCoupons(): Promise<Coupon[]> {
    return MOCK_COUPONS.filter((c) => c.isActive);
  },

  /**
   * Validate a coupon against the current cart order value
   */
  async validateCoupon(code: string, subtotal: number): Promise<CouponValidationResult> {
    const cleanCode = code.trim().toUpperCase();
    const coupon = MOCK_COUPONS.find((c) => c.code.toUpperCase() === cleanCode && c.isActive);

    if (!coupon) {
      return {
        valid: false,
        message: "Invalid coupon code. Please try another code.",
      };
    }

    if (subtotal < coupon.minOrderValue) {
      return {
        valid: false,
        coupon,
        message: `This coupon requires a minimum cart value of ₹${coupon.minOrderValue}.`,
      };
    }

    let discountAmount = 0;
    if (coupon.discountType === "FLAT") {
      discountAmount = coupon.discountValue;
    } else {
      const calculated = Math.round((subtotal * coupon.discountValue) / 100);
      discountAmount = coupon.maxDiscount ? Math.min(calculated, coupon.maxDiscount) : calculated;
    }

    return {
      valid: true,
      coupon,
      discountAmount,
      message: `Coupon "${coupon.code}" applied successfully! You saved ₹${discountAmount}.`,
    };
  },
};
