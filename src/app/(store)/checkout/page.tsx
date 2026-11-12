"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useHydration } from "@/hooks/useHydration";
import { orderService } from "@/services/orderService";
import { authService } from "@/services/authService";
import { useToast } from "@/components/common/Toast";
import { PriceDisplay } from "@/components/common/PriceDisplay";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/common/InputField";
import { Address, Order, PaymentMethod } from "@/types";
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
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Indian States for dropdown ────────────────────────────────────────────────
const INDIAN_STATES = [
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Delhi",
  "Gujarat",
  "Haryana",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "West Bengal",
];

// ─── Popular Indian Banks for Net Banking ──────────────────────────────────────
const POPULAR_BANKS = [
  { id: "HDFC", name: "HDFC Bank" },
  { id: "SBI", name: "State Bank of India" },
  { id: "ICICI", name: "ICICI Bank" },
  { id: "AXIS", name: "Axis Bank" },
  { id: "KOTAK", name: "Kotak Mahindra Bank" },
  { id: "PNB", name: "Punjab National Bank" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const isHydrated = useHydration();

  const items = useCartStore((state) => state.items);
  const getSummary = useCartStore((state) => state.getSummary);
  const clearCart = useCartStore((state) => state.clearCart);

  const { user, isAuthenticated, logout } = useAuthStore();

  // Active step: 1: Customer Info, 2: Address, 3: Order Summary, 4: Payment, 5: Confirmation
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Address state
  const [addresses, setAddresses] = useState<Address[]>(() => {
    if (user?.addresses && user.addresses.length > 0) {
      return user.addresses;
    }
    return [
      {
        id: "addr-default-1",
        name: user?.name || "Aarav Mehta",
        phone: user?.phone || "9876543210",
        pincode: "560034",
        locality: "Koramangala 4th Block",
        street: "Flat 402, Green Glen Apartments, 17th Main Road",
        city: "Bengaluru",
        state: "Karnataka",
        landmark: "Near Sony World Signal",
        type: "home",
        isDefault: true,
      },
      {
        id: "addr-default-2",
        name: user?.name || "Aarav Mehta",
        phone: user?.phone || "9876543210",
        pincode: "560103",
        locality: "Bellandur Outer Ring Road",
        street: "Tower B, 6th Floor, EcoWorld Tech Park",
        city: "Bengaluru",
        state: "Karnataka",
        landmark: "Opposite Intel Campus",
        type: "work",
        isDefault: false,
      },
    ];
  });
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);

  // Address Form state (for both Add and Edit)
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

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [upiMethod, setUpiMethod] = useState<"id" | "qr">("id");
  const [upiId, setUpiId] = useState("aarav@okaxis");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC");
  const [codCaptcha, setCodCaptcha] = useState("");
  const [expectedCaptcha] = useState("7482");

  // Payment simulation & test switches
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Order confirmation state
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  if (!isHydrated) {
    return (
      <div className="max-w-[1100px] mx-auto p-12 text-center text-sm text-[#878787]">
        Preparing your checkout session...
      </div>
    );
  }

  // Client-side protected route guard
  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-[480px] mx-auto p-8 text-center bg-white border border-[#E0E0E0] rounded-sm my-12 shadow-xs">
        <div className="w-16 h-16 bg-blue-50 text-[#2874F0] rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-lg font-bold text-[#212121]">Sign in to Complete Checkout</h2>
        <p className="text-xs text-[#878787] mt-1 mb-6">
          Please log in to your FlipStore account to select delivery address and place your order.
        </p>
        <Link href="/login?redirect=/checkout">
          <Button variant="buyNow" fullWidth className="font-bold text-sm">
            Sign In &amp; Continue Checkout
          </Button>
        </Link>
      </div>
    );
  }

  // Empty Cart check (unless already in Confirmation step)
  if (items.length === 0 && currentStep !== 5) {
    return (
      <div className="max-w-[900px] mx-auto p-12 text-center bg-white border border-[#E0E0E0] rounded-sm my-8 shadow-xs">
        <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
        <h2 className="text-lg font-bold text-[#212121]">Your cart is empty</h2>
        <p className="text-xs text-[#878787] mt-1 mb-6">
          Add items to your cart before proceeding to checkout.
        </p>
        <Link href="/">
          <Button variant="primary">Browse Products</Button>
        </Link>
      </div>
    );
  }

  const summary = getSummary();
  const selectedAddress = addresses[selectedAddressIndex] || addresses[0];

  // ── Address Handlers ────────────────────────────────────────────────────────
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
    setFormType(addr.type);
    setAddressErrors({});
    setIsAddressFormOpen(true);
  };

  const validateAddressForm = () => {
    const errs: Record<string, string> = {};
    if (!formName.trim()) errs.name = "Full name is required";
    if (!/^[6-9]\d{9}$/.test(formPhone.replace(/\D/g, ""))) {
      errs.phone = "Enter a valid 10-digit mobile number";
    }
    if (!formHouseNo.trim()) errs.houseNo = "House / Flat number is required";
    if (!formStreet.trim()) errs.street = "Street / Area is required";
    if (!formCity.trim()) errs.city = "City is required";
    if (!/^\d{6}$/.test(formPincode.trim())) {
      errs.pincode = "Enter a valid 6-digit PIN code";
    }
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
      // Edit existing
      setAddresses((prev) =>
        prev.map((a) =>
          a.id === editingAddressId
            ? {
                ...a,
                name: formName.trim(),
                phone: formPhone.trim(),
                street: fullStreet,
                locality: formStreet.trim(),
                city: formCity.trim(),
                state: formStateVal,
                pincode: formPincode.trim(),
                type: formType,
              }
            : a
        )
      );
      toast({ type: "success", message: "Address updated successfully" });
    } else {
      // Add new
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
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    setSelectedAddressIndex(0);
    toast({ type: "info", message: "Address removed" });
  };

  // ── Payment & Place Order Handlers ──────────────────────────────────────────
  const handlePlaceOrder = async () => {
    setPaymentError(null);

    // Validate payment inputs
    if (paymentMethod === "UPI" && upiMethod === "id") {
      if (!upiId.includes("@") || upiId.length < 5) {
        setPaymentError("Please enter a valid UPI ID (e.g. yourname@okhdfcbank)");
        return;
      }
    }

    if (paymentMethod === "CARD") {
      const cleanCard = cardNumber.replace(/\s/g, "");
      if (cleanCard.length < 15) {
        setPaymentError("Please enter a valid 16-digit Card Number");
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        setPaymentError("Please enter card expiry in MM/YY format");
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        setPaymentError("Please enter a valid 3-digit CVV");
        return;
      }
    }

    if (paymentMethod === "COD") {
      if (codCaptcha.trim() !== expectedCaptcha) {
        setPaymentError(`Incorrect security code. Please type ${expectedCaptcha}`);
        return;
      }
    }

    setIsProcessingPayment(true);

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Handle simulated payment failure
    if (simulateFailure) {
      setIsProcessingPayment(false);
      setPaymentError(
        "Payment verification failed from your bank. Transaction declined. Please try again or choose another payment method."
      );
      toast({
        type: "error",
        title: "Payment Declined",
        message: "Simulated payment failure triggered. You can retry with another method.",
      });
      return;
    }

    try {
      const orderItems = items.map((i) => ({
        productId: i.product.id,
        title: i.product.title,
        thumbnail: i.product.thumbnail || i.product.images[0],
        price: i.product.price,
        mrp: i.product.mrp,
        quantity: i.quantity,
        selectedVariants: i.selectedVariants,
      }));

      const newOrder = await orderService.createOrder({
        userId: user.id,
        items: orderItems,
        shippingAddress: selectedAddress,
        paymentMethod,
        pricing: {
          totalMrp: summary.totalMrp,
          discount: summary.discountOnMrp,
          couponDiscount: summary.couponDiscount,
          deliveryCharges: summary.deliveryCharges,
          totalAmount: summary.totalPayable,
        },
      });

      // Clear Cart and proceed to Step 5 (Confirmation)
      clearCart();
      setConfirmedOrder(newOrder);
      setCurrentStep(5);
      setIsProcessingPayment(false);
      toast({
        type: "success",
        title: "Order Placed Successfully! 🎉",
        message: `Order ID: ${newOrder.orderNumber}`,
      });
    } catch {
      setIsProcessingPayment(false);
      setPaymentError("An error occurred while creating your order. Please retry.");
    }
  };

  // ── STEP 5: Order Confirmation View ─────────────────────────────────────────
  if (currentStep === 5 && confirmedOrder) {
    return (
      <div className="bg-[#F1F3F6] min-h-screen py-8">
        <div className="max-w-[850px] mx-auto px-4">
          <div className="bg-white border border-[#E0E0E0] rounded-sm p-6 sm:p-8 shadow-sm">
            {/* Header / Celebratory banner */}
            <div className="text-center pb-6 border-b border-[#F0F0F0]">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={40} className="text-[#388E3C]" />
              </div>
              <span className="text-xs uppercase font-bold tracking-wider text-[#388E3C] bg-green-50 px-3 py-1 rounded-full border border-green-200">
                Order Confirmed
              </span>
              <h1 className="text-2xl font-bold text-[#212121] mt-3">
                Thank you, {user.name.split(" ")[0]}!
              </h1>
              <p className="text-xs text-[#878787] mt-1">
                Your order has been placed and will be delivered shortly.
              </p>
              <div className="inline-block mt-3 bg-gray-50 border border-gray-200 px-4 py-2 rounded-xs text-sm">
                <span className="text-[#878787]">Order ID: </span>
                <span className="font-bold text-[#212121]">{confirmedOrder.orderNumber}</span>
              </div>
            </div>

            {/* Order details grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6 border-b border-[#F0F0F0] text-xs">
              <div className="p-3 bg-gray-50 rounded-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#212121] mb-1">
                  <MapPin size={14} className="text-[#2874F0]" />
                  <span>Delivery Address</span>
                </div>
                <p className="font-semibold text-[#212121]">{confirmedOrder.shippingAddress.name}</p>
                <p className="text-[#555] mt-0.5">{confirmedOrder.shippingAddress.street}</p>
                <p className="text-[#555]">
                  {confirmedOrder.shippingAddress.city}, {confirmedOrder.shippingAddress.state} -{" "}
                  {confirmedOrder.shippingAddress.pincode}
                </p>
                <p className="text-[#878787] mt-1">Phone: {confirmedOrder.shippingAddress.phone}</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#212121] mb-1">
                  <CreditCard size={14} className="text-[#2874F0]" />
                  <span>Payment Details</span>
                </div>
                <p className="text-[#555]">
                  Method: <strong className="text-[#212121]">{confirmedOrder.paymentMethod}</strong>
                </p>
                <p className="text-[#555] mt-0.5">
                  Status:{" "}
                  <span
                    className={cn(
                      "font-bold",
                      confirmedOrder.paymentStatus === "PAID"
                        ? "text-[#388E3C]"
                        : "text-amber-600"
                    )}
                  >
                    {confirmedOrder.paymentStatus}
                  </span>
                </p>
                <p className="text-[#212121] font-bold text-sm mt-2">
                  Total: ₹{confirmedOrder.pricing.totalAmount.toLocaleString("en-IN")}
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#212121] mb-1">
                  <Calendar size={14} className="text-[#388E3C]" />
                  <span>Estimated Delivery</span>
                </div>
                <p className="text-[#388E3C] font-bold text-sm">Arriving in 2-3 Days</p>
                <p className="text-[#878787] mt-1">
                  We will send dispatch updates to{" "}
                  <strong className="text-[#555]">{user.email}</strong>
                </p>
              </div>
            </div>

            {/* Items list summary */}
            <div className="py-6 border-b border-[#F0F0F0]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#878787] mb-3">
                Items in this order ({confirmedOrder.items.length})
              </h3>
              <div className="space-y-3">
                {confirmedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <div className="relative w-14 h-14 bg-gray-50 border border-gray-100 rounded-xs overflow-hidden shrink-0">
                      <Image
                        src={it.thumbnail}
                        alt={it.title}
                        fill
                        sizes="56px"
                        className="object-contain p-1"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#212121] truncate">{it.title}</p>
                      <p className="text-[11px] text-[#878787]">Qty: {it.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#212121]">
                        ₹{(it.price * it.quantity).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/orders/${confirmedOrder.orderNumber}`} className="flex-1 max-w-xs">
                <Button variant="buyNow" fullWidth className="text-xs font-bold">
                  <Package size={14} className="mr-1.5" />
                  Track Live Shipment
                </Button>
              </Link>
              <Link href="/orders" className="flex-1 max-w-xs">
                <Button variant="primary" fullWidth className="text-xs font-semibold">
                  View All Orders
                </Button>
              </Link>
              <Link href="/" className="flex-1 max-w-xs">
                <Button variant="outline" fullWidth className="text-xs font-semibold">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── STEPS 1-4: Active Multi-Step Checkout Flow ──────────────────────────────
  return (
    <div className="bg-[#F1F3F6] min-h-screen py-6">
      <div className="max-w-[1180px] mx-auto px-3 sm:px-4">
        {/* Stepper Header Bar */}
        <div className="bg-white border border-[#E0E0E0] rounded-sm p-3 mb-4 shadow-2xs">
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
            {[
              { num: 1, label: "Customer Info" },
              { num: 2, label: "Delivery Address" },
              { num: 3, label: "Order Summary" },
              { num: 4, label: "Payment" },
            ].map((s) => (
              <div
                key={s.num}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-xs transition-colors",
                  currentStep === s.num
                    ? "bg-blue-50 text-[#2874F0] border border-blue-200"
                    : currentStep > s.num
                    ? "text-[#388E3C]"
                    : "text-gray-400"
                )}
              >
                <span
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px]",
                    currentStep === s.num
                      ? "bg-[#2874F0] text-white"
                      : currentStep > s.num
                      ? "bg-[#388E3C] text-white"
                      : "bg-gray-200 text-gray-500"
                  )}
                >
                  {currentStep > s.num ? <Check size={11} /> : s.num}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ── Left Column: Multi-Step Accordion ────────────────────────────── */}
          <div className="lg:col-span-2 space-y-3">
            {/* ── STEP 1: CUSTOMER INFORMATION ──────────────────────────────── */}
            <div className="bg-white border border-[#E0E0E0] rounded-sm shadow-2xs overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-[#FAFAFA] border-b border-[#F0F0F0]">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      currentStep > 1
                        ? "bg-[#388E3C] text-white"
                        : "bg-[#2874F0] text-white"
                    )}
                  >
                    {currentStep > 1 ? <Check size={13} /> : "1"}
                  </span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#212121]">
                    Customer Information
                  </h2>
                </div>
                {currentStep > 1 && (
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-xs text-[#2874F0] font-semibold hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                )}
              </div>

              {currentStep === 1 ? (
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="flex items-start justify-between bg-blue-50/60 p-3 rounded-xs border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#2874F0] text-white font-bold flex items-center justify-center text-base">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-[#212121]">{user.name}</p>
                          <span className="text-[10px] font-bold text-[#388E3C] bg-green-50 px-1.5 py-0.5 rounded-xs border border-green-200">
                            Verified
                          </span>
                        </div>
                        <p className="text-xs text-[#555]">
                          {user.email} · {user.phone}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        await authService.logout();
                        logout();
                        router.push("/login?redirect=/checkout");
                      }}
                      className="text-xs text-red-500 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <LogOut size={12} /> Switch
                    </button>
                  </div>

                  <p className="text-xs text-[#878787]">
                    Order tracking notifications and digital tax invoices will be sent to this email
                    and phone number.
                  </p>

                  <Button
                    variant="buyNow"
                    onClick={() => setCurrentStep(2)}
                    className="font-bold text-xs flex items-center gap-1"
                  >
                    <span>Continue to Delivery Address</span>
                    <ArrowRight size={14} />
                  </Button>
                </div>
              ) : (
                <div className="p-3 px-4 text-xs text-[#555] flex justify-between items-center bg-white">
                  <span>
                    Logged in as <strong>{user.name}</strong> ({user.email})
                  </span>
                </div>
              )}
            </div>

            {/* ── STEP 2: DELIVERY ADDRESS ───────────────────────────────────── */}
            <div className="bg-white border border-[#E0E0E0] rounded-sm shadow-2xs overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-[#FAFAFA] border-b border-[#F0F0F0]">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      currentStep > 2
                        ? "bg-[#388E3C] text-white"
                        : currentStep === 2
                        ? "bg-[#2874F0] text-white"
                        : "bg-gray-200 text-gray-500"
                    )}
                  >
                    {currentStep > 2 ? <Check size={13} /> : "2"}
                  </span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#212121]">
                    Delivery Address
                  </h2>
                </div>
                {currentStep > 2 && (
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="text-xs text-[#2874F0] font-semibold hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                )}
              </div>

              {currentStep === 2 ? (
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Saved Addresses List */}
                  {!isAddressFormOpen && (
                    <div className="space-y-3">
                      {addresses.map((addr, idx) => {
                        const isSelected = selectedAddressIndex === idx;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => setSelectedAddressIndex(idx)}
                            className={cn(
                              "p-3.5 border rounded-xs transition-all cursor-pointer relative",
                              isSelected
                                ? "border-[#2874F0] bg-blue-50/30 ring-1 ring-[#2874F0]"
                                : "border-[#E0E0E0] hover:border-gray-400 bg-white"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5">
                                <input
                                  type="radio"
                                  name="selectedAddress"
                                  checked={isSelected}
                                  onChange={() => setSelectedAddressIndex(idx)}
                                  className="mt-1 accent-[#2874F0]"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-[#212121]">
                                      {addr.name}
                                    </span>
                                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-xs bg-gray-100 text-gray-600">
                                      {addr.type}
                                    </span>
                                    <span className="text-xs font-medium text-[#555]">
                                      {addr.phone}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[#555] mt-1 leading-relaxed">
                                    {addr.street}, {addr.locality}, {addr.city}, {addr.state} -{" "}
                                    <strong className="text-[#212121]">{addr.pincode}</strong>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditAddressForm(addr);
                                  }}
                                  className="text-xs text-[#2874F0] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit2 size={12} /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteAddress(addr.id, e)}
                                  className="text-xs text-red-500 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>

                            {isSelected && (
                              <div className="mt-3 pt-3 border-t border-blue-100 flex justify-start">
                                <Button
                                  variant="buyNow"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentStep(3);
                                  }}
                                  className="text-xs font-bold"
                                >
                                  Deliver Here
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Add new address button */}
                      <button
                        type="button"
                        onClick={openAddAddressForm}
                        className="w-full p-3 border-2 border-dashed border-[#2874F0] rounded-xs text-[#2874F0] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <Plus size={15} /> Add a New Delivery Address
                      </button>
                    </div>
                  )}

                  {/* Add / Edit Address Form */}
                  {isAddressFormOpen && (
                    <form
                      onSubmit={handleSaveAddress}
                      className="bg-gray-50 border border-[#E0E0E0] p-4 rounded-xs space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-[#E0E0E0] pb-2">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-[#212121]">
                          {editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setIsAddressFormOpen(false)}
                          className="text-xs text-red-500 hover:underline cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <InputField
                          label="Full Name"
                          type="text"
                          placeholder="e.g. Ramesh Kumar"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          error={addressErrors.name}
                          required
                        />

                        <InputField
                          label="Mobile Number (10 digits)"
                          type="tel"
                          placeholder="9876543210"
                          value={formPhone}
                          onChange={(e) =>
                            setFormPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                          }
                          prefixText="+91"
                          maxLength={10}
                          error={addressErrors.phone}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <InputField
                          label="House / Flat / Building No."
                          type="text"
                          placeholder="Flat 402, Green Glen Towers"
                          value={formHouseNo}
                          onChange={(e) => setFormHouseNo(e.target.value)}
                          error={addressErrors.houseNo}
                          required
                        />

                        <InputField
                          label="Street / Colony / Area"
                          type="text"
                          placeholder="17th Main, Sector 4"
                          value={formStreet}
                          onChange={(e) => setFormStreet(e.target.value)}
                          error={addressErrors.street}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <InputField
                          label="City / District"
                          type="text"
                          value={formCity}
                          onChange={(e) => setFormCity(e.target.value)}
                          error={addressErrors.city}
                          required
                        />

                        <div>
                          <label className="block text-xs font-semibold text-[#212121] uppercase tracking-wider mb-1.5">
                            State <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={formStateVal}
                            onChange={(e) => setFormStateVal(e.target.value)}
                            className="w-full h-10 px-3 text-xs bg-white border border-[#E0E0E0] rounded-xs focus:outline-none focus:border-[#2874F0]"
                          >
                            {INDIAN_STATES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>

                        <InputField
                          label="6-Digit PIN Code"
                          type="text"
                          placeholder="560034"
                          maxLength={6}
                          value={formPincode}
                          onChange={(e) =>
                            setFormPincode(e.target.value.replace(/\D/g, "").slice(0, 6))
                          }
                          error={addressErrors.pincode}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#212121] uppercase tracking-wider mb-1.5">
                          Address Type
                        </label>
                        <div className="flex gap-4 text-xs">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="addrType"
                              value="home"
                              checked={formType === "home"}
                              onChange={() => setFormType("home")}
                              className="accent-[#2874F0]"
                            />
                            <span>Home (All day delivery)</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="addrType"
                              value="work"
                              checked={formType === "work"}
                              onChange={() => setFormType("work")}
                              className="accent-[#2874F0]"
                            />
                            <span>Work (10 AM - 5 PM delivery)</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button type="submit" variant="buyNow" size="sm" className="font-bold text-xs">
                          {editingAddressId ? "Save Changes" : "Save & Deliver Here"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddressFormOpen(false)}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <div className="p-3 px-4 text-xs text-[#555] flex justify-between items-center bg-white">
                  <span>
                    Delivering to <strong>{selectedAddress.name}</strong>,{" "}
                    {selectedAddress.street}, {selectedAddress.city} - {selectedAddress.pincode}
                  </span>
                </div>
              )}
            </div>

            {/* ── STEP 3: ORDER SUMMARY ──────────────────────────────────────── */}
            <div className="bg-white border border-[#E0E0E0] rounded-sm shadow-2xs overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-[#FAFAFA] border-b border-[#F0F0F0]">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      currentStep > 3
                        ? "bg-[#388E3C] text-white"
                        : currentStep === 3
                        ? "bg-[#2874F0] text-white"
                        : "bg-gray-200 text-gray-500"
                    )}
                  >
                    {currentStep > 3 ? <Check size={13} /> : "3"}
                  </span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#212121]">
                    Order Summary ({items.length} {items.length === 1 ? "Item" : "Items"})
                  </h2>
                </div>
                {currentStep > 3 && (
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="text-xs text-[#2874F0] font-semibold hover:underline cursor-pointer"
                  >
                    Review Items
                  </button>
                )}
              </div>

              {currentStep === 3 ? (
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="divide-y divide-[#F0F0F0]">
                    {items.map(({ id, product, quantity, selectedVariants }) => (
                      <div key={id} className="py-3 flex gap-3.5 items-start first:pt-0 last:pb-0">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 border border-gray-100 rounded-xs overflow-hidden shrink-0">
                          <Image
                            src={product.thumbnail || product.images[0]}
                            alt={product.title}
                            fill
                            sizes="80px"
                            className="object-contain p-1"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-[#212121] line-clamp-1">
                            {product.title}
                          </p>
                          <p className="text-[11px] text-[#878787]">Seller: {product.seller.name}</p>

                          {selectedVariants && Object.keys(selectedVariants).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 text-[10px] text-[#555]">
                              {Object.entries(selectedVariants).map(([k, v]) => (
                                <span key={k} className="bg-gray-100 px-1.5 py-0.5 rounded-xs">
                                  {k}: {v}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-3 mt-1.5">
                            <PriceDisplay
                              price={product.price * quantity}
                              mrp={product.mrp * quantity}
                              discountPercentage={product.discountPercentage}
                              size="sm"
                            />
                            <span className="text-xs text-[#878787]">Qty: {quantity}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xs text-xs text-[#555] flex items-center justify-between">
                    <span>
                      Order confirmation email will be sent to <strong>{user.email}</strong>
                    </span>
                    <span className="text-[#388E3C] font-semibold">Free Delivery</span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <Link
                      href="/cart"
                      className="text-xs text-[#2874F0] font-semibold hover:underline"
                    >
                      ← Modify Cart
                    </Link>
                    <Button
                      variant="buyNow"
                      onClick={() => setCurrentStep(4)}
                      className="font-bold text-xs flex items-center gap-1"
                    >
                      <span>Continue to Payment</span>
                      <ArrowRight size={14} />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 px-4 text-xs text-[#555] flex justify-between items-center bg-white">
                  <span>
                    {items.length} {items.length === 1 ? "item" : "items"} ready for dispatch
                  </span>
                </div>
              )}
            </div>

            {/* ── STEP 4: PAYMENT OPTIONS ────────────────────────────────────── */}
            <div className="bg-white border border-[#E0E0E0] rounded-sm shadow-2xs overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-[#FAFAFA] border-b border-[#F0F0F0]">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      currentStep === 4 ? "bg-[#2874F0] text-white" : "bg-gray-200 text-gray-500"
                    )}
                  >
                    4
                  </span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-[#212121]">
                    Payment Options
                  </h2>
                </div>
              </div>

              {currentStep === 4 && (
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Payment Failure Error Notice */}
                  {paymentError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xs text-xs text-red-600 flex items-start gap-2">
                      <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                      <div>
                        <strong>Payment Failed:</strong> {paymentError}
                      </div>
                    </div>
                  )}

                  {/* Payment Methods Accordion */}
                  <div className="space-y-3">
                    {/* 1. UPI */}
                    <div
                      className={cn(
                        "border rounded-xs p-3 transition-colors",
                        paymentMethod === "UPI"
                          ? "border-[#2874F0] bg-blue-50/20"
                          : "border-[#E0E0E0]"
                      )}
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentOption"
                          value="UPI"
                          checked={paymentMethod === "UPI"}
                          onChange={() => setPaymentMethod("UPI")}
                          className="accent-[#2874F0]"
                        />
                        <div className="flex items-center gap-1.5">
                          <Smartphone size={16} className="text-[#2874F0]" />
                          <span className="font-bold text-xs text-[#212121]">
                            UPI (Google Pay, PhonePe, Paytm, BHIM)
                          </span>
                        </div>
                      </label>

                      {paymentMethod === "UPI" && (
                        <div className="mt-3 pl-6 space-y-3 border-t border-gray-100 pt-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setUpiMethod("id")}
                              className={cn(
                                "px-3 py-1.5 text-xs font-semibold rounded-xs border cursor-pointer",
                                upiMethod === "id"
                                  ? "bg-[#2874F0] text-white border-[#2874F0]"
                                  : "bg-white text-gray-600 border-[#E0E0E0]"
                              )}
                            >
                              Enter UPI ID / VPA
                            </button>
                            <button
                              type="button"
                              onClick={() => setUpiMethod("qr")}
                              className={cn(
                                "px-3 py-1.5 text-xs font-semibold rounded-xs border cursor-pointer flex items-center gap-1",
                                upiMethod === "qr"
                                  ? "bg-[#2874F0] text-white border-[#2874F0]"
                                  : "bg-white text-gray-600 border-[#E0E0E0]"
                              )}
                            >
                              <QrCode size={13} /> Scan QR Code
                            </button>
                          </div>

                          {upiMethod === "id" ? (
                            <div className="space-y-2">
                              <InputField
                                label="UPI Virtual Payment Address"
                                type="text"
                                placeholder="yourname@okaxis"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                              />
                              <div className="flex gap-1.5 text-[11px] text-[#878787] flex-wrap">
                                <span>Common handles:</span>
                                {["@okhdfcbank", "@okaxis", "@ybl", "@paytm"].map((h) => (
                                  <button
                                    key={h}
                                    type="button"
                                    onClick={() => setUpiId(`aarav${h}`)}
                                    className="text-[#2874F0] hover:underline cursor-pointer"
                                  >
                                    {h}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center p-3 bg-white border border-[#E0E0E0] rounded-xs max-w-xs mx-auto">
                              <div className="w-32 h-32 bg-gray-100 mx-auto flex items-center justify-center border border-gray-300 rounded-xs mb-2">
                                <QrCode size={80} className="text-[#212121]" />
                              </div>
                              <p className="text-[11px] font-bold text-[#212121]">
                                Scan &amp; Pay ₹{summary.totalPayable.toLocaleString("en-IN")}
                              </p>
                              <p className="text-[10px] text-[#878787]">
                                Compatible with GPay, PhonePe, Paytm, CRED
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 2. Credit / Debit / ATM Card */}
                    <div
                      className={cn(
                        "border rounded-xs p-3 transition-colors",
                        paymentMethod === "CARD"
                          ? "border-[#2874F0] bg-blue-50/20"
                          : "border-[#E0E0E0]"
                      )}
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentOption"
                          value="CARD"
                          checked={paymentMethod === "CARD"}
                          onChange={() => setPaymentMethod("CARD")}
                          className="accent-[#2874F0]"
                        />
                        <div className="flex items-center gap-1.5">
                          <CreditCard size={16} className="text-[#2874F0]" />
                          <span className="font-bold text-xs text-[#212121]">
                            Credit / Debit / ATM Card
                          </span>
                        </div>
                      </label>

                      {paymentMethod === "CARD" && (
                        <div className="mt-3 pl-6 space-y-3 border-t border-gray-100 pt-3">
                          <InputField
                            label="Card Number"
                            type="text"
                            placeholder="4532 8923 1290 4421"
                            maxLength={19}
                            value={cardNumber}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                              const formatted = val.match(/.{1,4}/g)?.join(" ") || val;
                              setCardNumber(formatted);
                            }}
                          />

                          <div className="grid grid-cols-2 gap-3">
                            <InputField
                              label="Valid Thru"
                              type="text"
                              placeholder="MM/YY"
                              maxLength={5}
                              value={cardExpiry}
                              onChange={(e) => {
                                let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                                if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                                setCardExpiry(v);
                              }}
                            />
                            <InputField
                              label="CVV"
                              type="password"
                              placeholder="123"
                              maxLength={4}
                              value={cardCvv}
                              onChange={(e) =>
                                setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                              }
                            />
                          </div>

                          <InputField
                            label="Cardholder Name"
                            type="text"
                            placeholder="Aarav Mehta"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                          />

                          <div className="flex items-center gap-1 text-[11px] text-[#878787]">
                            <Lock size={12} className="text-[#388E3C]" />
                            <span>Your card details are protected with 256-bit encryption</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 3. Net Banking */}
                    <div
                      className={cn(
                        "border rounded-xs p-3 transition-colors",
                        paymentMethod === "NET_BANKING"
                          ? "border-[#2874F0] bg-blue-50/20"
                          : "border-[#E0E0E0]"
                      )}
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentOption"
                          value="NET_BANKING"
                          checked={paymentMethod === "NET_BANKING"}
                          onChange={() => setPaymentMethod("NET_BANKING")}
                          className="accent-[#2874F0]"
                        />
                        <div className="flex items-center gap-1.5">
                          <Building2 size={16} className="text-[#2874F0]" />
                          <span className="font-bold text-xs text-[#212121]">Net Banking</span>
                        </div>
                      </label>

                      {paymentMethod === "NET_BANKING" && (
                        <div className="mt-3 pl-6 space-y-3 border-t border-gray-100 pt-3">
                          <p className="text-xs font-semibold text-[#878787]">Popular Banks:</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {POPULAR_BANKS.map((b) => (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => setSelectedBank(b.id)}
                                className={cn(
                                  "p-2 text-xs font-medium rounded-xs border text-left cursor-pointer transition-colors",
                                  selectedBank === b.id
                                    ? "bg-blue-50 border-[#2874F0] text-[#2874F0] font-bold"
                                    : "bg-white border-[#E0E0E0] text-[#212121] hover:bg-gray-50"
                                )}
                              >
                                {b.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 4. Cash on Delivery */}
                    <div
                      className={cn(
                        "border rounded-xs p-3 transition-colors",
                        paymentMethod === "COD"
                          ? "border-[#2874F0] bg-blue-50/20"
                          : "border-[#E0E0E0]"
                      )}
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentOption"
                          value="COD"
                          checked={paymentMethod === "COD"}
                          onChange={() => setPaymentMethod("COD")}
                          className="accent-[#2874F0]"
                        />
                        <div className="flex items-center gap-1.5">
                          <Banknote size={16} className="text-[#388E3C]" />
                          <span className="font-bold text-xs text-[#212121]">
                            Cash on Delivery (Pay cash/UPI at doorstep)
                          </span>
                        </div>
                      </label>

                      {paymentMethod === "COD" && (
                        <div className="mt-3 pl-6 space-y-2 border-t border-gray-100 pt-3">
                          <p className="text-xs text-[#555]">
                            Pay via Cash or ask delivery agent for a dynamic UPI QR code at delivery.
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="bg-gray-200 tracking-widest font-black text-sm px-3 py-1.5 rounded-xs select-none">
                              {expectedCaptcha}
                            </span>
                            <input
                              type="text"
                              maxLength={4}
                              placeholder="Enter 4-digit code"
                              value={codCaptcha}
                              onChange={(e) => setCodCaptcha(e.target.value)}
                              className="px-3 py-1.5 text-xs border border-[#E0E0E0] rounded-xs w-36 uppercase tracking-wider focus:outline-none focus:border-[#2874F0]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Test simulator switch (Simulate payment failure) ───── */}
                  <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xs text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-amber-900 select-none">
                      <input
                        type="checkbox"
                        checked={simulateFailure}
                        onChange={(e) => setSimulateFailure(e.target.checked)}
                        className="accent-amber-600 rounded-xs"
                      />
                      <span>Test Failure Mode (Simulate Payment Decline)</span>
                    </label>
                    <p className="text-[11px] text-amber-700 mt-1 pl-5">
                      Toggle this on to test how the checkout gracefully handles and recovers from a
                      declined payment transaction.
                    </p>
                  </div>

                  {/* Final Place Order Button */}
                  <div className="pt-2">
                    <Button
                      variant="buyNow"
                      size="lg"
                      fullWidth
                      onClick={handlePlaceOrder}
                      isLoading={isProcessingPayment}
                      className="text-sm font-bold tracking-wide"
                    >
                      {paymentMethod === "COD"
                        ? `Confirm Order · ₹${summary.totalPayable.toLocaleString("en-IN")}`
                        : `Pay ₹${summary.totalPayable.toLocaleString("en-IN")} & Place Order`}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right Column: Order Price Details ────────────────────────────── */}
          <div className="space-y-3 lg:sticky lg:top-20 h-fit">
            <div className="bg-white border border-[#E0E0E0] rounded-sm p-4 sm:p-5 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#878787] pb-3 border-b border-[#F0F0F0]">
                Price Details
              </h3>

              <div className="space-y-3 py-3 text-sm border-b border-[#F0F0F0]">
                <div className="flex justify-between">
                  <span className="text-[#878787]">
                    Price ({summary.itemsCount} {summary.itemsCount === 1 ? "item" : "items"})
                  </span>
                  <span className="font-medium">₹{summary.totalMrp.toLocaleString("en-IN")}</span>
                </div>

                <div className="flex justify-between text-[#388E3C]">
                  <span>Discount</span>
                  <span className="font-semibold">
                    −₹{summary.discountOnMrp.toLocaleString("en-IN")}
                  </span>
                </div>

                {summary.couponDiscount > 0 && (
                  <div className="flex justify-between text-[#388E3C] font-semibold">
                    <span>Coupon Discount</span>
                    <span>−₹{summary.couponDiscount.toLocaleString("en-IN")}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-[#878787]">Delivery Charges</span>
                  <span className="font-medium">
                    {summary.deliveryCharges === 0 ? (
                      <span className="text-[#388E3C] font-semibold">FREE</span>
                    ) : (
                      `₹${summary.deliveryCharges}`
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center py-3 text-base font-bold text-[#212121] border-b border-[#F0F0F0]">
                <span>Total Amount</span>
                <span>₹{summary.totalPayable.toLocaleString("en-IN")}</span>
              </div>

              {summary.totalSavings > 0 && (
                <p className="text-xs text-[#388E3C] font-semibold py-2">
                  🎉 You will save ₹{summary.totalSavings.toLocaleString("en-IN")} on this order
                </p>
              )}

              <div className="flex items-center justify-center gap-1.5 pt-3 text-[11px] text-[#878787] border-t border-[#F0F0F0]">
                <ShieldCheck size={14} className="text-[#388E3C]" />
                <span>Safe and Secure Payments · 100% Authentic Products</span>
              </div>
            </div>

            {/* Delivery address mini badge if step > 2 */}
            {currentStep > 2 && (
              <div className="bg-white border border-[#E0E0E0] rounded-sm p-3.5 shadow-2xs text-xs">
                <div className="flex items-center justify-between font-bold text-[#212121] mb-1">
                  <span className="flex items-center gap-1 text-[#2874F0]">
                    <MapPin size={13} /> Deliver to:
                  </span>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="text-[#2874F0] text-[11px] hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>
                <p className="font-semibold text-[#212121]">{selectedAddress.name}</p>
                <p className="text-[#555] line-clamp-2 mt-0.5">
                  {selectedAddress.street}, {selectedAddress.city} - {selectedAddress.pincode}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
