"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useHydration } from "@/hooks/useHydration";
import { orderService } from "@/services/orderService";
import { authService } from "@/services/authService";
import { createPaymentOrder, verifyPayment } from "@/services/paymentService";
import { useToast } from "@/components/common/Toast";
import { useDeliveryLocationStore } from "@/store/useDeliveryLocationStore";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/common/InputField";
import { Address, Order, OrderItem, PaymentMethod, PaymentStatus } from "@/types";
import {
  Check,
  ShieldCheck,
  MapPin,
  CreditCard,
  ShoppingBag,
  Plus,
  CheckCircle2,
  LogOut,
  Edit2,
  Trash2,
  QrCode,
  Smartphone,
  Building2,
  Banknote,
  AlertTriangle,
  ArrowRight,
  Package,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, cb: (res: any) => void) => void };
    Cashfree?: (config?: any) => { checkout: (opts: any) => Promise<any> };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function loadCashfreeScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Cashfree) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector('script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Delhi", "Gujarat", "Haryana", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu",
  "Telangana", "Uttar Pradesh", "West Bengal",
];

const POPULAR_BANKS = [
  { id: "HDFC", name: "HDFC Bank" },
  { id: "SBI", name: "State Bank of India" },
  { id: "ICICI", name: "ICICI Bank" },
  { id: "AXIS", name: "Axis Bank" },
  { id: "KOTAK", name: "Kotak Mahindra Bank" },
  { id: "PNB", name: "Punjab National Bank" },
];

type Step = 1 | 2 | 3 | 4 | 5;

interface CheckoutSummary {
  items: Array<{
    productId: string;
    variantId?: string;
    productName?: string;
    thumbnail?: string;
    price: number;
    mrp?: number;
    quantity: number;
  }>;
  summary: {
    totalMrp: number;
    discount: number;
    subtotal?: number;
    couponDiscount: number;
    deliveryCharges: number;
    totalAmount: number;
    totalQuantity?: number;
  };
}



function isTempAddressId(id?: string) {
  if (!id) return true;
  return !/^[a-f\d]{24}$/i.test(String(id));
}

const buildDefaultAddresses = (user?: { name?: string; phone?: string; addresses?: Address[] } | null): Address[] => {
  if (user?.addresses && user.addresses.length > 0) return user.addresses;
  return [
    {
      id: "addr-default-1",
      name: user?.name || "Customer",
      phone: user?.phone || "9999999999",
      pincode: "560034",
      locality: "Koramangala 4th Block",
      street: "Flat 402, Green Glen Apartments, 17th Main Road",
      city: "Bengaluru",
      state: "Karnataka",
      landmark: "Near Sony World Signal",
      type: "home",
      isDefault: true,
    },
  ];
};

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const isHydrated = useHydration();

  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const { user, isAuthenticated, logout } = useAuthStore();

  const { location: deliveryLocation } = useDeliveryLocationStore();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [addresses, setAddresses] = useState<Address[]>(() => buildDefaultAddresses(user));
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);

  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formHouseNo, setFormHouseNo] = useState("");
  const [formStreet, setFormStreet] = useState("");
  const [formCity, setFormCity] = useState("Bengaluru");
  const [formStateVal, setFormStateVal] = useState("Karnataka");
  const [formPincode, setFormPincode] = useState("");
  const [formType, setFormType] = useState<"home" | "work">("home");
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [upiMethod, setUpiMethod] = useState<"id" | "qr">("id");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC");
  const [codCaptcha, setCodCaptcha] = useState("");
  const [expectedCaptcha] = useState("7482");
  const [simulateFailure, setSimulateFailure] = useState(false);

  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const [couponCode, setCouponCode] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = (params.get("coupon") || "").trim().toUpperCase();
      const saved = (localStorage.getItem("checkout_coupon_code_v1") || "").trim().toUpperCase();
      return fromUrl || saved || "";
    } catch { return ""; }
  });
  const [appliedCouponCode, setAppliedCouponCode] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = (params.get("coupon") || "").trim().toUpperCase();
      const saved = (localStorage.getItem("checkout_coupon_code_v1") || "").trim().toUpperCase();
      return fromUrl || saved || "";
    } catch { return ""; }
  });
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const autoAppliedCouponRef = useRef(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = (params.get("coupon") || "").trim().toUpperCase();
      const saved = (localStorage.getItem("checkout_coupon_code_v1") || "").trim().toUpperCase();
      const code = fromUrl || saved;
      if (code) {
        setCouponCode((prev) => prev || code);
        setAppliedCouponCode((prev) => prev || code);
        try { localStorage.setItem("checkout_coupon_code_v1", code); } catch {}
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await authService.getAddresses();
        if (cancelled || !Array.isArray(data)) return;
        setAddresses((prev) => {
          const fetched = data as Address[];
          if (fetched.length > 0) {
            const defIdx = fetched.findIndex((a) => a.isDefault);
            if (defIdx >= 0) setSelectedAddressIndex(defIdx);
            return fetched;
          }
          return prev.length ? prev : buildDefaultAddresses(user);
        });
      } catch {
        // keep local fallback addresses
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!deliveryLocation?.pincode) return;
    if (currentStep === 5) return;
    const pin = String(deliveryLocation.pincode || "").trim();
    const city = String(deliveryLocation.city || deliveryLocation.area || "").trim().toLowerCase();
    setSelectedAddressIndex((prevIdx) => {
      const idx = addresses.findIndex((a) =>
        String(a.pincode || "").trim() === pin &&
        (!city || String(a.city || "").trim().toLowerCase().includes(city) || String(a.locality || "").trim().toLowerCase().includes(city))
      );
      return idx >= 0 ? idx : prevIdx;
    });
  }, [deliveryLocation?.pincode, deliveryLocation?.city, deliveryLocation?.area, addresses, currentStep]);

  useEffect(() => {
    if (user) {
      setAddresses((prev) => (prev.length ? prev : buildDefaultAddresses(user)));
    }
  }, [user]);

  const selectedAddress = addresses[selectedAddressIndex] || addresses[0];
  const isSelectedIndex = (idx: number) => idx === selectedAddressIndex;

  const localSummary = useMemo<CheckoutSummary>(() => {
    const totalMrp = items.reduce((sum, i) => sum + (i.product.mrp || i.product.price) * i.quantity, 0);
    const totalAmountRaw = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const discount = Math.max(0, totalMrp - totalAmountRaw);
    const deliveryCharges = totalAmountRaw >= 499 ? 0 : (items.length ? 40 : 0);
    return {
      items: items.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
        price: i.product.price,
        mrp: i.product.mrp,
        productName: i.product.title,
        thumbnail: i.product.thumbnail || i.product.images[0],
        variantId: i.selectedVariants?.variantId,
      })),
      summary: {
        totalMrp,
        discount,
        subtotal: totalAmountRaw,
        couponDiscount: 0,
        deliveryCharges,
        totalAmount: totalAmountRaw + deliveryCharges,
        totalQuantity: items.reduce((s, i) => s + i.quantity, 0),
      },
    };
  }, [items]);

  const currentSummary = summary || localSummary;

  useEffect(() => {
    if (!isAuthenticated || !user || !selectedAddress || items.length === 0 || currentStep === 5) return;
    let cancelled = false;
    const loadSummary = async () => {
      setSummaryLoading(true);
      setSummaryError(null);
      try {
        const summaryData = await orderService.getCheckoutSummary({
          shippingAddressId: selectedAddress.id,
          paymentMethod,
          couponCode: appliedCouponCode || undefined,
          items: items.map((i) => ({
            productId: i.product.id,
            variantId: i.selectedVariants?.variantId,
            quantity: i.quantity,
          })),
        });
        if (!cancelled) {
          setSummary(summaryData);
          if (appliedCouponCode) {
            const disc = Number((summaryData as any)?.summary?.couponDiscount || 0);
            if (disc > 0) {
              setCouponError(null);
              setCouponMessage(`Coupon "${appliedCouponCode}" applied. You saved ₹${disc.toLocaleString("en-IN")}.`);
            } else {
              // keep coupon (cart carry-over) visible for retry; show plain totals
              setAppliedCouponCode("");
              setCouponMessage(null);
              setCouponError("Coupon could not be applied to this order. Please check conditions and try Apply again.");
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to fetch checkout summary.";
          if (appliedCouponCode) {
            // preserve cart-applied coupon code for retry; show error and fallback to plain summary (no storage wipe)
            setAppliedCouponCode("");
            setCouponError(msg);
            setCouponMessage(null);
            try {
              const plain = await orderService.getCheckoutSummary({
                shippingAddressId: selectedAddress.id,
                paymentMethod,
                items: items.map((i) => ({ productId: i.product.id, variantId: i.selectedVariants?.variantId, quantity: i.quantity })),
              });
              if (!cancelled) { setSummary(plain); setSummaryError(null); }
            } catch {
              if (!cancelled) { setSummary(null); setSummaryError(msg); }
            }
          } else {
            setSummary(null);
            setSummaryError(msg);
          }
        }
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    };
    loadSummary();
    return () => { cancelled = true; };
  }, [isAuthenticated, user, selectedAddress?.id, paymentMethod, items, currentStep, appliedCouponCode]);

  if (!isHydrated) {
    return <div className="max-w-[1100px] mx-auto p-12 text-center text-sm text-[#878787]">Preparing your checkout session...</div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-[480px] mx-auto p-8 text-center bg-white border border-[#E0E0E0] rounded-sm my-12 shadow-xs">
        <div className="w-16 h-16 bg-blue-50 text-[#2874F0] rounded-full flex items-center justify-center mx-auto mb-4"><ShieldCheck size={32} /></div>
        <h2 className="text-lg font-bold text-[#212121]">Sign in to Complete Checkout</h2>
        <p className="text-xs text-[#878787] mt-1 mb-6">Please log in to select delivery address and place your order.</p>
        <Link href="/login?redirect=/checkout"><Button variant="buyNow" fullWidth className="font-bold text-sm">Sign In &amp; Continue Checkout</Button></Link>
      </div>
    );
  }

  if (items.length === 0 && currentStep !== 5) {
    return (
      <div className="max-w-[900px] mx-auto p-12 text-center bg-white border border-[#E0E0E0] rounded-sm my-8 shadow-xs">
        <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
        <h2 className="text-lg font-bold text-[#212121]">Your cart is empty</h2>
        <p className="text-xs text-[#878787] mt-1 mb-6">Add items to your cart before proceeding to checkout.</p>
        <Link href="/"><Button variant="primary">Browse Products</Button></Link>
      </div>
    );
  }

  const openAddAddressForm = () => {
    setEditingAddressId(null);
    setFormName(user.name || "");
    setFormPhone(user.phone || "");
    setFormHouseNo("");
    setFormStreet("");
    setFormCity("Bengaluru");
    setFormStateVal("Karnataka");
    setFormPincode("");
    setFormType("home");
    setAddressErrors({});
    setIsAddressFormOpen(true);
  };

  const openEditAddressForm = (addr: Address) => {
    setEditingAddressId(addr.id);
    setFormName(addr.name);
    setFormPhone(addr.phone);
    const parts = addr.street.split(", ");
    setFormHouseNo(parts[0] || "");
    setFormStreet(parts.slice(1).join(", ") || addr.locality || "");
    setFormCity(addr.city);
    setFormStateVal(addr.state);
    setFormPincode(addr.pincode);
    setFormType(addr.type === "work" ? "work" : "home");
    setAddressErrors({});
    setIsAddressFormOpen(true);
  };

  const validateAddressForm = () => {
    const errs: Record<string, string> = {};
    if (!formName.trim()) errs.name = "Full name is required";
    if (!/^[6-9]\d{9}$/.test(formPhone.replace(/\D/g, ""))) errs.phone = "Enter a valid 10-digit mobile number";
    if (!formHouseNo.trim()) errs.houseNo = "House / Flat number is required";
    if (!formStreet.trim()) errs.street = "Street / Area is required";
    if (!formCity.trim()) errs.city = "City is required";
    if (!/^\d{6}$/.test(formPincode.trim())) errs.pincode = "Enter a valid 6-digit PIN code";
    setAddressErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAddressForm()) {
      toast({ type: "error", message: "Please correct errors in the address form" });
      return;
    }
    const fullStreet = `${formHouseNo.trim()}, ${formStreet.trim()}`;
    if (editingAddressId) {
      setAddresses((prev) => prev.map((a) => (a.id === editingAddressId ? { ...a, name: formName.trim(), phone: formPhone.trim(), street: fullStreet, locality: formStreet.trim(), city: formCity.trim(), state: formStateVal, pincode: formPincode.trim(), type: formType } : a)));
      toast({ type: "success", message: "Address updated successfully" });
    } else {
      const created: Address = {
        id: `addr-${Date.now()}`,
        name: formName.trim(),
        phone: formPhone.trim(),
        street: fullStreet,
        locality: formStreet.trim(),
        city: formCity.trim(),
        state: formStateVal,
        pincode: formPincode.trim(),
        type: formType,
        isDefault: false,
      };
      setAddresses((prev) => [created, ...prev]);
      setSelectedAddressIndex(0);
      toast({ type: "success", message: "New delivery address added" });
    }
    setIsAddressFormOpen(false);
  };

  const handleDeleteAddress = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (addresses.length <= 1) {
      toast({ type: "error", message: "You must keep at least one delivery address" });
      return;
    }
    if (window.confirm("Are you sure you want to delete this address?")) {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      setSelectedAddressIndex(0);
      toast({ type: "info", message: "Address removed" });
    }
  };

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError("Enter a coupon code.");
      setCouponMessage(null);
      return;
    }
    if (!selectedAddress) return;
    setCouponApplying(true);
    setCouponError(null);
    setCouponMessage(null);
    try {
      const validated = await orderService.validateCoupon({
        couponCode: code,
        shippingAddressId: selectedAddress.id,
        items: items.map((i) => ({ productId: i.product.id, variantId: i.selectedVariants?.variantId, quantity: i.quantity })),
      });
      const discount = Number((validated as any)?.summary?.couponDiscount || 0);
      if (discount <= 0) throw new Error("This coupon is not applicable for the current cart.");
      setCouponCode(code);
      setAppliedCouponCode(code);
      try { localStorage.setItem("checkout_coupon_code_v1", code); } catch {}
      setSummary(validated);
      setCouponMessage(`Coupon "${code}" applied. You saved ₹${discount.toLocaleString("en-IN")}.`);
      setCouponError(null);
      toast({ type: "success", message: `Coupon ${code} applied` });
    } catch (err) {
      setAppliedCouponCode("");
      try { localStorage.removeItem("checkout_coupon_code_v1"); } catch {}
      setCouponError(err instanceof Error ? err.message : "Invalid coupon code.");
      setCouponMessage(null);
    } finally {
      setCouponApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCouponCode("");
    setCouponError(null);
    setCouponMessage("Coupon removed.");
    autoAppliedCouponRef.current = true; // prevent auto reapply after manual remove
    try { localStorage.removeItem("checkout_coupon_code_v1"); } catch {}
  };

  // Auto-apply coupon carried from cart (once) when checkout is ready
  useEffect(() => {
    if (autoAppliedCouponRef.current) return;
    if (currentStep === 5) return;
    if (!isHydrated || !isAuthenticated || !user || !selectedAddress || items.length === 0) return;
    const pending = (localStorage.getItem("checkout_coupon_code_v1") || couponCode || "").trim().toUpperCase();
    if (!pending) return;
    autoAppliedCouponRef.current = true;
    if (!appliedCouponCode) setAppliedCouponCode(pending);
    if (!couponCode) setCouponCode(pending);
  }, [isHydrated, isAuthenticated, user, selectedAddress?.id, items.length, currentStep, couponCode, appliedCouponCode]);

  const handlePlaceOrder = async () => {
    if (!selectedAddress) return;
    setPaymentError(null);

    if (paymentMethod === "COD" && codCaptcha.trim() !== expectedCaptcha) {
      setPaymentError(`Incorrect security code. Please type ${expectedCaptcha}`);
      return;
    }

    setIsProcessingPayment(true);
    const idempotencyKey = `checkout:${user.id}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

    try {
      // Server creates order with server-calculated pricing/status (online starts PENDING).
      const created = await orderService.createOrder({
        shippingAddressId: selectedAddress.id,
        paymentMethod,
        ...(appliedCouponCode ? { couponCode: appliedCouponCode } : {}),
        cartItems: items.map((i) => ({
          productId: i.product.id,
          variantId: i.selectedVariants?.variantId,
          quantity: i.quantity,
        })),
      });
      const orderId = created.id;

      if (paymentMethod === "COD") {
        if (simulateFailure) {
          throw new Error("Simulated failure (COD). Order was created as pending; please check your orders.");
        }
        // Try to load full order details; fall back to created data if DB lookup fails
        let fullOrder: Order | null = null;
        try {
          fullOrder = await orderService.getOrderById(created.orderNumber || orderId);
        } catch {
          // DB may be temporarily unreachable; order was still created server-side
          fullOrder = null;
        }
        if (!fullOrder) {
          // Build a minimal order object from the creation response so the success page still works
          fullOrder = (created as unknown as Order);
          toast({
            type: "warning",
            title: "Order Placed",
            message: `Order ID: ${created.orderNumber || orderId}. Order details will refresh shortly.`,
          });
        } else {
          clearCart();
          toast({ type: "success", title: "Order Placed Successfully!", message: `Order ID: ${(fullOrder as any).orderNumber || created.orderNumber}` });
        }
        clearCart();
        setConfirmedOrder(fullOrder as Order);
        setCurrentStep(5);
        return;
      }

      // Online: create gateway order (Cashfree/Razorpay) and verify server-side.
      const payInit = await createPaymentOrder(orderId, idempotencyKey);
      if (payInit.alreadyPaid) {
        const fullOrder = await orderService.getOrderById(created.orderNumber || orderId);
        clearCart();
        setConfirmedOrder((fullOrder as Order) || (created as unknown as Order));
        setCurrentStep(5);
        toast({ type: "success", title: "Payment already verified", message: `Order ID: ${created.orderNumber}` });
        return;
      }

      const gateway = String((payInit as any).gateway || 'RAZORPAY').toUpperCase();
      const gatewayOrderId = String((payInit as any).gatewayOrderId || (payInit as any).cashfreeOrderId || payInit.razorpayOrderId || payInit.razorpayOrder?.id || '');
      const completeSandbox = async () => {
        if (simulateFailure) throw new Error("Payment cancelled or failed (simulated). Order remains pending payment.");
        const fakePaymentId = `pay_sandbox_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        if (gateway === 'CASHFREE') {
          await verifyPayment({
            paymentId: payInit.paymentId,
            gateway: 'CASHFREE',
            gatewayOrderId: gatewayOrderId || `order_sandbox_${created.orderNumber}`,
            cashfreeOrderId: gatewayOrderId || `order_sandbox_${created.orderNumber}`,
          } as any);
        } else {
          await verifyPayment({
            paymentId: payInit.paymentId,
            razorpayOrderId: gatewayOrderId || `order_sandbox_${created.orderNumber}`,
            razorpayPaymentId: fakePaymentId,
            razorpaySignature: "sandbox_signature",
          } as any);
        }
      };

      let usedRealGateway = false;
      if (gateway === 'CASHFREE' && !(payInit as any).sandbox && (payInit as any).paymentSessionId) {
        const loaded = await loadCashfreeScript();
        if (loaded && window.Cashfree) {
          usedRealGateway = true;
          const cashfree = window.Cashfree({ mode: String((payInit as any).cashfreeEnv || 'sandbox') === 'production' ? 'production' : 'sandbox' });
          const cfResult: any = await cashfree.checkout({
            paymentSessionId: (payInit as any).paymentSessionId,
            redirectTarget: '_modal',
          });
          if (cfResult?.error) {
            throw new Error(cfResult.error?.message || "Payment cancelled. Order remains pending payment.");
          }
          const verified = await verifyPayment({
            paymentId: payInit.paymentId,
            gateway: 'CASHFREE',
            gatewayOrderId,
            cashfreeOrderId: gatewayOrderId,
          } as any);
          if (!(verified as any)?.verified) throw new Error('Payment not confirmed by gateway.');
        }
      } else if (gateway !== 'CASHFREE' && !payInit.sandbox && payInit.keyId && gatewayOrderId) {
        const loaded = await loadRazorpayScript();
        if (loaded && window.Razorpay) {
          usedRealGateway = true;
          await new Promise<void>((resolve, reject) => {
            try {
              const rzp = new window.Razorpay!({
                key: payInit.keyId,
                amount: Math.round((payInit.amount || created.pricing?.totalAmount || 0) * 100),
                currency: payInit.currency || "INR",
                name: "ShopHub (Test Mode)",
                description: `Order ${created.orderNumber}`,
                order_id: gatewayOrderId,
                prefill: { name: user.name, email: user.email, contact: user.phone },
                notes: { orderId },
                theme: { color: "#2874F0" },
                handler: async (response: any) => {
                  try {
                    await verifyPayment({
                      paymentId: payInit.paymentId,
                      razorpayOrderId: response.razorpay_order_id || gatewayOrderId,
                      razorpayPaymentId: response.razorpay_payment_id,
                      razorpaySignature: response.razorpay_signature,
                    } as any);
                    resolve();
                  } catch (e) {
                    reject(e);
                  }
                },
                modal: { ondismiss: () => reject(new Error("Payment cancelled. Order remains pending payment.")) },
              });
              rzp.on("payment.failed", (resp: any) => reject(new Error(resp?.error?.description || "Payment failed. Order remains pending payment.")));
              rzp.open();
            } catch (e) {
              reject(e);
            }
          });
        }
      }
      if (!usedRealGateway) {
        // Sandbox-ready fallback (no keys/SDK unavailable) — no real money charged.
        await completeSandbox();
        const gw = String((payInit as any).gateway || "RAZORPAY").toUpperCase();
        toast({
          type: "info",
          title: (payInit as any).sandbox ? "Sandbox mode (no real charge)" : "Sandbox payment",
          message: (payInit as any).sandbox
            ? `${gw} keys not configured. Payment simulated and server-verified in sandbox mode.`
            : `${gw} checkout unavailable; payment simulated and server-verified (no real charge).`,
        });
      }

      const fullOrder = await orderService.getOrderById(created.orderNumber || orderId);
      clearCart();
      setConfirmedOrder((fullOrder as Order) || (created as unknown as Order));
      setCurrentStep(5);
      toast({ type: "success", title: "Payment verified", message: `Order ID: ${created.orderNumber}` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment/order failed. Please try again.";
      setCurrentStep((s) => (s < 4 ? 4 : s));
      if (/authentication required|unauthor|session expired|token/i.test(msg)) {
        setPaymentError("Session expired. Please log out and log in again, then retry.");
      } else {
        setPaymentError(msg);
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (currentStep === 5 && confirmedOrder) {
    return (
      <div className="bg-[#F1F3F6] min-h-screen py-8">
        <div className="max-w-[850px] mx-auto px-4">
          <div className="bg-white border border-[#E0E0E0] rounded-sm p-6 sm:p-8 shadow-sm">
            <div className="text-center pb-6 border-b border-[#F0F0F0]">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"><CheckCircle2 size={40} className="text-[#388E3C]" /></div>
              <span className="text-xs uppercase font-bold tracking-wider text-[#388E3C] bg-green-50 px-3 py-1 rounded-full border border-green-200">Order Confirmed</span>
              <h1 className="text-2xl font-bold text-[#212121] mt-3">Thank you, {user.name.split(" ")[0]}!</h1>
              <p className="text-xs text-[#878787] mt-1">Your order has been placed and will be processed shortly.</p>
              <div className="inline-block mt-3 bg-gray-50 border border-gray-200 px-4 py-2 rounded-xs text-sm"><span className="text-[#878787]">Order ID: </span><span className="font-bold text-[#212121]">{confirmedOrder.orderNumber}</span></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6 border-b border-[#F0F0F0]">
              <div className="p-3 bg-gray-50 rounded-xs">
                <div className="flex items-center gap-2 font-bold text-[#212121] mb-1"><MapPin size={14} className="text-[#2874F0]" /><span>Shipping Address</span></div>
                <p className="text-sm font-semibold text-[#212121]">{confirmedOrder.shippingAddress.name}</p>
                <p className="text-[#555] mt-0.5">{confirmedOrder.shippingAddress.street}</p>
                <p className="text-[#555]">{confirmedOrder.shippingAddress.city}, {confirmedOrder.shippingAddress.state} - {confirmedOrder.shippingAddress.pincode}</p>
                <p className="text-[#878787] mt-1">Phone: {confirmedOrder.shippingAddress.phone}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xs">
                <div className="flex items-center gap-2 font-bold text-[#212121] mb-1"><CreditCard size={14} className="text-[#2874F0]" /><span>Payment Details</span></div>
                <p className="text-[#555]">Method: <strong className="text-[#212121]">{confirmedOrder.paymentMethod}</strong></p>
                <p className="text-[#555] mt-0.5">Status: <span className={cn("font-bold", confirmedOrder.paymentStatus === "PAID" ? "text-[#388E3C]" : "text-amber-600")}>{confirmedOrder.paymentStatus}</span></p>
                <p className="text-[#212121] font-bold text-sm mt-2">Total: ₹{confirmedOrder.pricing.totalAmount.toLocaleString("en-IN")}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xs">
                <div className="flex items-center gap-2 font-bold text-[#212121] mb-1"><Calendar size={14} className="text-[#388E3C]" /><span>Estimated Delivery</span></div>
                <p className="text-[#388E3C] font-bold text-sm">Arriving in 2-3 Days</p>
                <p className="text-[#878787] mt-1">Updates will be sent to <strong className="text-[#555]">{(confirmedOrder as Order & { customerEmail?: string }).customerEmail || user.email}</strong></p>
              </div>
            </div>
            <div className="py-6 border-b border-[#F0F0F0]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#878787] mb-3">Items in this order ({confirmedOrder.items.length})</h3>
              <div className="space-y-3">
                {confirmedOrder.items.map((it, idx) => (
                  <div key={`${it.productId}-${idx}`} className="flex gap-3.5 items-center">
                    <div className="relative w-16 h-16 bg-gray-50 border border-gray-100 rounded-xs overflow-hidden shrink-0"><Image src={it.thumbnail || "/placeholder.png"} alt={it.title} fill sizes="64px" className="object-contain p-1" /></div>
                    <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-[#212121] truncate">{it.title}</p><p className="text-[11px] text-[#878787]">Qty: {it.quantity}</p></div>
                    <div className="text-right"><p className="text-xs font-bold text-[#212121]">₹{(it.price * it.quantity).toLocaleString("en-IN")}</p></div>
                  </div>
                ))}
              </div>
              <div className="pt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Link href={`/orders/${confirmedOrder.orderNumber}`} className="flex-1 max-w-xs"><Button variant="buyNow" fullWidth className="text-xs font-bold"><Package size={14} className="mr-1.5" /><span>Track Order</span></Button></Link>
                <Link href="/orders" className="flex-1 max-w-xs"><Button variant="primary" fullWidth className="text-xs font-semibold">View All Orders</Button></Link>
                <Link href="/" className="flex-1 max-w-xs"><Button variant="outline" fullWidth className="text-xs font-semibold">Continue Shopping</Button></Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderStepHeader = (num: Step, label: string) => (
    <div className="flex items-center justify-between p-4 bg-[#FAFAFA] border-b border-[#F0F0F0]">
      <div className="flex items-center gap-2">
        <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold", currentStep > num ? "bg-[#388E3C] text-white" : "bg-[#2874F0] text-white")}>{currentStep > num ? <Check size={13} /> : String(num)}</span>
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#212121]">{label}</h2>
      </div>
      {currentStep > num && <button onClick={() => setCurrentStep(num)} className="text-xs text-[#2874F0] font-semibold hover:underline cursor-pointer">Change</button>}
    </div>
  );

  return (
    <div className="bg-[#F1F3F6] min-h-screen py-6">
      <div className="max-w-[1180px] mx-auto px-3 sm:px-4">
        <div className="bg-white border border-[#E0E0E0] rounded-sm p-3 mb-4 shadow-2xs">
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
            {[{ num: 1, label: "Customer" }, { num: 2, label: "Address" }, { num: 3, label: "Summary" }, { num: 4, label: "Payment" }].map((s) => (
              <div key={s.num} className={cn("flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-xs", currentStep === s.num ? "bg-[#2874F0] text-white" : currentStep > s.num ? "text-[#388E3C]" : "text-gray-400")}>
                <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px]", currentStep === s.num ? "bg-white/20 text-white" : currentStep > s.num ? "bg-[#388E3C] text-white" : "bg-gray-200 text-gray-500")}>{currentStep > s.num ? <Check size={12} /> : s.num}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
          <div className="space-y-4">
            <div className="bg-white border border-[#E0E0E0] rounded-sm shadow-2xs overflow-hidden">
              {renderStepHeader(1, "Customer Information")}
              {currentStep === 1 ? (
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between bg-[#FAFAFA] border border-[#F0F0F0] rounded-sm p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#2874F0] text-white font-bold flex items-center justify-center text-base">{user.name.charAt(0).toUpperCase()}</div>
                      <div><p className="font-bold text-sm text-[#212121]">{user.name}</p><p className="text-xs text-[#555]">{user.email}{user.phone ? ` · ${user.phone}` : ""}</p></div>
                    </div>
                    <button onClick={async () => { await authService.logout().catch(() => undefined); logout(); router.push("/login?redirect=/checkout"); }} className="text-xs text-red-500 font-semibold flex items-center gap-1 hover:underline cursor-pointer"><LogOut size={12} /> Switch</button>
                  </div>
                  <Button variant="buyNow" onClick={() => setCurrentStep(2)} className="font-bold text-xs flex items-center gap-1"><span>Continue to Delivery Address</span><ArrowRight size={14} /></Button>
                </div>
              ) : (<div className="p-3 px-4 text-xs text-[#555] bg-white">Logged in as <strong>{user.name}</strong> ({user.email})</div>)}
            </div>

            <div className="bg-white border border-[#E0E0E0] rounded-sm shadow-2xs overflow-hidden">
              {renderStepHeader(2, "Delivery Address")}
              {currentStep === 2 ? (
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="space-y-3">
                    {addresses.map((addr, idx) => (
                      <div key={addr.id} onClick={() => setSelectedAddressIndex(idx)} className={cn("p-3.5 border rounded-sm cursor-pointer transition-colors", isSelectedIndex(idx) ? "border-[#2874F0] bg-blue-50/30 ring-1 ring-[#2874F0]" : "border-[#E0E0E0] hover:border-gray-400 bg-white")}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <div className="w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center shrink-0 border-[#2874F0]">{isSelectedIndex(idx) && <div className="w-2 h-2 rounded-full bg-[#2874F0]" />}</div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap"><p className="font-bold text-sm text-[#212121]">{addr.name}</p><span className="text-[10px] font-bold text-[#555] bg-gray-100 px-1.5 py-0.5 rounded-xs uppercase">{addr.type}</span></div>
                              <p className="text-xs text-[#555] mt-0.5">{addr.phone}</p>
                              <p className="text-xs text-[#555] mt-1 leading-relaxed">{addr.street}, {addr.locality}, {addr.city}, {addr.state} - <strong className="text-[#212121]">{addr.pincode}</strong></p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button type="button" onClick={(e) => { e.stopPropagation(); openEditAddressForm(addr); }} className="text-xs text-[#2874F0] font-semibold flex items-center gap-1 hover:underline cursor-pointer"><Edit2 size={12} /> Edit</button>
                            <button type="button" onClick={(e) => handleDeleteAddress(addr.id, e)} className="text-xs text-red-500 font-semibold flex items-center gap-1 hover:underline cursor-pointer"><Trash2 size={12} /> Delete</button>
                          </div>
                        </div>
                        {isSelectedIndex(idx) && (<div className="mt-3 pt-3 border-t border-blue-100"><Button variant="buyNow" size="sm" onClick={(e) => { e.stopPropagation(); setCurrentStep(3); }} className="text-xs font-bold flex items-center gap-1"><span>Deliver Here</span><ArrowRight size={14} /></Button></div>)}
                      </div>
                    ))}
                    <button type="button" onClick={openAddAddressForm} className="w-full p-3 border-2 border-dashed border-[#2874F0] rounded-xs text-[#2874F0] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-50 transition-colors cursor-pointer"><Plus size={15} /> Add a New Delivery Address</button>
                  </div>
                  {isAddressFormOpen && (
                    <form onSubmit={handleSaveAddress} className="border border-[#E0E0E0] rounded-sm p-4 bg-[#FAFAFA] space-y-3">
                      <h3 className="text-sm font-bold text-[#212121]">{editingAddressId ? "Edit Address" : "Add New Address"}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <InputField label="Full Name" value={formName} onChange={(e) => setFormName(e.target.value)} error={addressErrors.name} />
                        <InputField label="Phone" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} error={addressErrors.phone} />
                        <InputField label="House / Flat No." value={formHouseNo} onChange={(e) => setFormHouseNo(e.target.value)} error={addressErrors.houseNo} />
                        <InputField label="Street / Area" value={formStreet} onChange={(e) => setFormStreet(e.target.value)} error={addressErrors.street} />
                        <InputField label="City" value={formCity} onChange={(e) => setFormCity(e.target.value)} error={addressErrors.city} />
                        <div><label className="block text-xs font-semibold text-[#555] mb-1">State</label><select value={formStateVal} onChange={(e) => setFormStateVal(e.target.value)} className="w-full h-10 border border-gray-300 rounded-xs px-3 text-sm bg-white">{INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
                        <InputField label="PIN Code" value={formPincode} onChange={(e) => setFormPincode(e.target.value)} error={addressErrors.pincode} />
                        <div><label className="block text-xs font-semibold text-[#555] mb-1">Address Type</label><div className="flex gap-2">{(["home", "work"] as const).map((t) => (<button key={t} type="button" onClick={() => setFormType(t)} className={cn("px-3 h-10 border rounded-xs text-xs font-semibold uppercase", formType === t ? "border-[#2874F0] text-[#2874F0] bg-blue-50" : "border-gray-300 text-[#555] bg-white")}>{t}</button>))}</div></div>
                      </div>
                      <div className="flex gap-2"><Button type="submit" variant="primary" size="sm">Save Address</Button><Button type="button" variant="outline" size="sm" onClick={() => setIsAddressFormOpen(false)}>Cancel</Button></div>
                    </form>
                  )}
                </div>
              ) : (selectedAddress && <div className="p-3 px-4 text-xs text-[#555] bg-white">Delivering to <strong>{selectedAddress.name}</strong>, {selectedAddress.street}, {selectedAddress.city} - {selectedAddress.pincode}</div>)}
            </div>

            <div className="bg-white border border-[#E0E0E0] rounded-sm shadow-2xs overflow-hidden">
              {renderStepHeader(3, `Order Summary (${items.length} ${items.length === 1 ? "item" : "items"})`)}
              {currentStep === 3 ? (
                <div className="p-4 sm:p-5 space-y-4">
                  {summaryError && <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xs p-2 flex items-start gap-2"><AlertTriangle size={14} className="mt-0.5 shrink-0" /><span>{summaryError} Showing estimated totals.</span></div>}
                  <div className="divide-y divide-[#F0F0F0] border-y border-[#F0F0F0]">
                    {items.map(({ product, quantity }) => (
                      <div key={product.id} className="py-3 flex gap-3.5 items-center">
                        <div className="relative w-16 h-16 bg-gray-50 border border-gray-100 rounded-xs overflow-hidden shrink-0"><Image src={product.thumbnail || product.images[0] || "/placeholder.png"} alt={product.title} fill sizes="64px" className="object-contain p-1" /></div>
                        <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-[#212121] line-clamp-2">{product.title}</p><p className="text-[11px] text-[#878787]">Qty: {quantity}</p></div>
                        <div className="text-right"><p className="text-xs font-bold text-[#212121]">₹{(product.price * quantity).toLocaleString("en-IN")}</p>{product.mrp > product.price && <p className="text-[10px] text-[#878787] line-through">₹{(product.mrp * quantity).toLocaleString("en-IN")}</p>}</div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="buyNow"
                    onClick={() => {
                      setPaymentError(null);
                      if (paymentMethod === "COD") {
                        setCurrentStep(4);
                      } else {
                        void handlePlaceOrder();
                      }
                    }}
                    disabled={isProcessingPayment || summaryLoading}
                    className="font-bold text-xs flex items-center gap-1"
                  >
                    <span>{isProcessingPayment ? "Processing..." : "Continue to Payment"}</span>
                    {!isProcessingPayment && <ArrowRight size={14} />}
                  </Button>
                </div>
              ) : currentStep > 3 ? (<div className="p-3 px-4 text-xs text-[#555] bg-white">{items.length} {items.length === 1 ? "item" : "items"} ready for dispatch</div>) : null}
            </div>

            <div className="bg-white border border-[#E0E0E0] rounded-sm shadow-2xs overflow-hidden">
              {renderStepHeader(4, "Payment Options")}
              {currentStep === 4 && (
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="space-y-2">
                    {[
                      { id: "UPI" as PaymentMethod, label: "UPI", icon: Smartphone, desc: "Pay using UPI ID or QR" },
                      { id: "CARD" as PaymentMethod, label: "Credit / Debit Card", icon: CreditCard, desc: "Visa, Mastercard, RuPay" },
                      { id: "NET_BANKING" as PaymentMethod, label: "Net Banking", icon: Building2, desc: "Pay from your bank account" },
                      { id: "COD" as PaymentMethod, label: "Cash on Delivery", icon: Banknote, desc: "Pay when you receive" },
                    ].map((opt) => (
                      <label key={opt.id} className={cn("flex items-start gap-3 p-3 border rounded-sm cursor-pointer", paymentMethod === opt.id ? "border-[#2874F0] bg-blue-50/30" : "border-[#E0E0E0] hover:border-gray-300")}>
                        <input type="radio" name="payment" checked={paymentMethod === opt.id} onChange={() => { setPaymentMethod(opt.id); setPaymentError(null); }} className="mt-1" />
                        <opt.icon size={18} className="text-[#2874F0] mt-0.5" />
                        <div><p className="text-sm font-semibold text-[#212121]">{opt.label}</p><p className="text-xs text-[#878787]">{opt.desc}</p></div>
                      </label>
                    ))}
                  </div>

                  {paymentMethod === "UPI" && (
                    <div className="border border-[#E0E0E0] rounded-sm p-3 space-y-3 bg-[#FAFAFA]">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setUpiMethod("id")} className={cn("px-3 py-1.5 text-xs font-semibold rounded-xs border", upiMethod === "id" ? "border-[#2874F0] text-[#2874F0] bg-blue-50" : "border-gray-300")}>UPI ID</button>
                        <button type="button" onClick={() => setUpiMethod("qr")} className={cn("px-3 py-1.5 text-xs font-semibold rounded-xs border", upiMethod === "qr" ? "border-[#2874F0] text-[#2874F0] bg-blue-50" : "border-gray-300")}>QR Code</button>
                      </div>
                      {upiMethod === "id" ? <InputField label="UPI ID" placeholder="yourname@bank" value={upiId} onChange={(e) => setUpiId(e.target.value)} /> : <div className="text-xs text-[#555] flex items-center gap-2 p-3 bg-white border border-dashed border-gray-300 rounded-xs"><QrCode size={18} /><span>Scan QR with your UPI app at payment time (simulated).</span></div>}
                    </div>
                  )}

                  {paymentMethod === "CARD" && (
                    <div className="border border-[#E0E0E0] rounded-sm p-3 space-y-3 bg-[#FAFAFA]">
                      <InputField label="Card Number" placeholder="1234 5678 9012 3456" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
                      <InputField label="Card Holder Name" placeholder="Name on card" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} />
                      <div className="grid grid-cols-2 gap-3"><InputField label="Expiry (MM/YY)" placeholder="MM/YY" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} /><InputField label="CVV" placeholder="123" value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} type="password" /></div>
                    </div>
                  )}

                  {paymentMethod === "NET_BANKING" && (
                    <div className="border border-[#E0E0E0] rounded-sm p-3 space-y-3 bg-[#FAFAFA]">
                      <label className="block text-xs font-semibold text-[#555] mb-1">Select Bank</label>
                      <select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)} className="w-full h-10 border border-gray-300 rounded-xs px-3 text-sm bg-white">{POPULAR_BANKS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
                    </div>
                  )}

                  {paymentMethod === "COD" && (
                    <div className="border border-[#E0E0E0] rounded-sm p-3 space-y-3 bg-[#FAFAFA]">
                      <p className="text-xs text-[#555]">Enter the security code to confirm Cash on Delivery.</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="px-3 py-2 bg-white border border-gray-300 rounded-xs font-mono font-bold tracking-widest text-[#212121] select-none">{expectedCaptcha}</div>
                        <div className="min-w-[160px] flex-1"><InputField label="Security Code" value={codCaptcha} onChange={(e) => setCodCaptcha(e.target.value)} /></div>
                        <button
                          type="button"
                          onClick={() => { setCodCaptcha(expectedCaptcha); setSimulateFailure(false); setPaymentError(null); }}
                          className="h-10 px-3 text-xs font-semibold border border-[#388E3C] text-[#388E3C] bg-white rounded-xs hover:bg-green-50 cursor-pointer"
                        >
                          Use code &amp; confirm COD
                        </button>
                      </div>
                      <p className="text-[11px] text-[#388E3C]">Click to auto-fill code for successful COD, then place order.</p>
                    </div>
                  )}

                  <label className="flex items-center gap-2 text-xs text-[#555] cursor-pointer"><input type="checkbox" checked={simulateFailure} onChange={(e) => setSimulateFailure(e.target.checked)} />Simulate payment failure (testing)</label>
                  {paymentError && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xs p-2 flex items-start gap-2"><AlertTriangle size={14} className="mt-0.5 shrink-0" /><span>{paymentError}</span></div>}
                  <Button variant="buyNow" onClick={handlePlaceOrder} disabled={isProcessingPayment || summaryLoading} className="font-bold text-xs w-full sm:w-auto">{isProcessingPayment ? "Processing..." : `Place Order · ₹${currentSummary.summary.totalAmount.toLocaleString("en-IN")}`}</Button>
                </div>
              )}
            </div>
          </div>

          <aside className="bg-white border border-[#E0E0E0] rounded-sm shadow-2xs overflow-hidden lg:sticky lg:top-4">
            <div className="p-4 border-b border-[#F0F0F0]"><h3 className="text-sm font-bold uppercase tracking-wider text-[#878787]">Price Details</h3></div>
            <div className="p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#555]">Price ({items.length} items)</span><span>₹{currentSummary.summary.totalMrp.toLocaleString("en-IN")}</span></div>
              <div className="flex justify-between text-[#388E3C]"><span>Discount</span><span>- ₹{currentSummary.summary.discount.toLocaleString("en-IN")}</span></div>
              {currentSummary.summary.couponDiscount > 0 && <div className="flex justify-between text-[#388E3C]"><span>Coupon{appliedCouponCode ? ` (${appliedCouponCode})` : ""}</span><span>- ₹{currentSummary.summary.couponDiscount.toLocaleString("en-IN")}</span></div>}
              <div className="flex justify-between"><span className="text-[#555]">Delivery Charges</span><span className={currentSummary.summary.deliveryCharges === 0 ? "text-[#388E3C]" : ""}>{currentSummary.summary.deliveryCharges === 0 ? "FREE" : `₹${currentSummary.summary.deliveryCharges.toLocaleString("en-IN")}`}</span></div>
              <div className="border-t border-dashed border-gray-300 pt-2 mt-2 flex justify-between font-bold text-[#212121] text-base"><span>Total Amount</span><span>₹{currentSummary.summary.totalAmount.toLocaleString("en-IN")}</span></div>
              <div className="pt-3 border-t border-[#F0F0F0] mt-2 space-y-2">
                <label className="block text-xs font-semibold text-[#555]">Apply Coupon</label>
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null); }}
                    placeholder="Enter coupon code"
                    className="flex-1 h-9 px-2.5 border border-gray-300 rounded-xs text-xs uppercase tracking-wide"
                    disabled={couponApplying}
                  />
                  {appliedCouponCode ? (
                    <button type="button" onClick={handleRemoveCoupon} className="h-9 px-3 text-xs font-semibold border border-gray-300 rounded-xs hover:bg-gray-50">Remove</button>
                  ) : (
                    <button type="button" onClick={handleApplyCoupon} disabled={couponApplying || !couponCode.trim()} className="h-9 px-3 text-xs font-semibold bg-[#2874F0] text-white rounded-xs hover:bg-blue-700 disabled:opacity-50">{couponApplying ? "Applying..." : "Apply"}</button>
                  )}
                </div>
                {couponMessage && <p className="text-[11px] text-[#388E3C]">{couponMessage}</p>}
                {couponError && <p className="text-[11px] text-red-600">{couponError}</p>}
              </div>
            </div>
            <div className="px-4 pb-4 space-y-2">{summaryLoading && <p className="text-xs text-[#878787]">Updating server pricing...</p>}<div className="flex items-center gap-2 text-xs text-[#388E3C] font-semibold"><ShieldCheck size={14} /><span>Safe and Secure Payments</span></div></div>
          </aside>
        </div>
      </div>
    </div>
  );
}
