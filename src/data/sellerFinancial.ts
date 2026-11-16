/**
 * Mock Seller Financial Data
 * Part 3: Earnings, Payments, Transactions, Coupons, Analytics
 * Frontend-only mock data for development and demo purposes.
 * Each seller only sees their own data.
 */

import type {
  EarningsSummary,
  EarningsDataPoint,
  PaymentTransaction,
  Payout,
  SellerCoupon,
  AnalyticsDataPoint,
  CategorySalesData,
  ProductPerformanceData,
  SellerPerformance,
  ReportExport,
  EnhancedNotification,
  SellerSupportTicket,
  NotificationCategory,
  PaymentTransactionStatus,
  PayoutStatus,
  CouponStatus,
  ReportStatus,
  Notification,
  NotificationStatus,
  NotificationType,
} from "@/types";
import { AVATAR, IMG, SELLER_CATEGORIES, MOCK_SELLER_PRODUCTS } from "./sellerManagement";

// ─── Mock Earnings Summary per seller ────────────────────────────────────────

export const MOCK_EARNINGS_SUMMARY: Record<string, EarningsSummary> = {
  "slr-001": {
    grossSales: 1245000,
    totalRevenue: 1182750,
    platformCommission: 62250,
    shippingCharges: 15000,
    refundDeductions: 8500,
    netEarnings: 1159250,
    pendingPayments: 45000,
    availableBalance: 85000,
    totalPaid: 1074250,
  },
  "slr-002": {
    grossSales: 680000,
    totalRevenue: 646000,
    platformCommission: 34000,
    shippingCharges: 9000,
    refundDeductions: 4200,
    netEarnings: 632800,
    pendingPayments: 28000,
    availableBalance: 42000,
    totalPaid: 590800,
  },
  "slr-003": {
    grossSales: 310000,
    totalRevenue: 294500,
    platformCommission: 15500,
    shippingCharges: 4500,
    refundDeductions: 1850,
    netEarnings: 288150,
    pendingPayments: 18000,
    availableBalance: 18500,
    totalPaid: 269650,
  },
};

// ─── Mock Earnings Data (Last 30 days) per seller ────────────────────────────

export function getMockEarningsData(sellerId: string): EarningsDataPoint[] {
  const base = sellerId === "slr-001" ? 45000 : sellerId === "slr-002" ? 28000 : 18000;
  const days = 30;
  const data: EarningsDataPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    const variance = 1 + Math.sin(i / 4) * 0.3 + (i % 7) * 0.02;
    data.push({
      date: date.toISOString().split("T")[0],
      grossSales: Math.round(base * variance),
      commission: Math.round(base * variance * 0.05),
      netEarnings: Math.round(base * variance * 0.93),
      orders: Math.round((base / 2000) * variance),
    });
  }
  return data;
}

// ─── Mock Earnings Data (Last 12 months) per seller ─────────────────────────

export function getMockMonthlyEarnings(sellerId: string): EarningsDataPoint[] {
  const base = sellerId === "slr-001" ? 95000 : sellerId === "slr-002" ? 52000 : 24000;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return months.map((name, i) => {
    const variance = 1 + Math.sin(i / 2) * 0.25 + i * 0.03;
    return {
      date: name,
      grossSales: Math.round(base * variance),
      commission: Math.round(base * variance * 0.05),
      netEarnings: Math.round(base * variance * 0.93),
      orders: Math.round((base / 2000) * variance),
    };
  });
}

// ─── Mock Payment Transactions per seller ────────────────────────────────────

export const MOCK_PAYMENT_TRANSACTIONS: Record<string, PaymentTransaction[]> = {
  "slr-001": [
    {
      id: "txn-101",
      transactionId: "TXN26100101",
      orderId: "ord-101",
      orderNumber: "ORD26100101",
      customerName: "Aarav Mehta",
      paymentDate: "2026-10-22T14:30:00Z",
      grossAmount: 74999,
      commission: 3750,
      netAmount: 71249,
      paymentMethod: "UPI",
      status: "PAID",
    },
    {
      id: "txn-102",
      transactionId: "TXN26100102",
      orderId: "ord-102",
      orderNumber: "ORD26100102",
      customerName: "Sneha Reddy",
      paymentDate: "2026-10-22T12:15:00Z",
      grossAmount: 64999,
      commission: 3250,
      netAmount: 61749,
      paymentMethod: "CARD",
      status: "PAID",
    },
    {
      id: "txn-103",
      transactionId: "TXN26100103",
      orderId: "ord-103",
      orderNumber: "ORD26100103",
      customerName: "Karan Singh",
      paymentDate: "2026-10-23T10:00:00Z",
      grossAmount: 4998,
      commission: 250,
      netAmount: 4748,
      paymentMethod: "COD",
      status: "PAID",
    },
    {
      id: "txn-104",
      transactionId: "TXN26100104",
      orderId: "ord-104",
      orderNumber: "ORD26100104",
      customerName: "Anita Pillai",
      paymentDate: "2026-10-21T10:20:00Z",
      grossAmount: 74999,
      commission: 3750,
      netAmount: 71249,
      paymentMethod: "UPI",
      status: "PENDING",
    },
    {
      id: "txn-105",
      transactionId: "TXN26100105",
      orderId: "ord-105",
      orderNumber: "ORD26100105",
      customerName: "Rohit Nair",
      paymentDate: "2026-10-20T16:10:00Z",
      grossAmount: 67990,
      commission: 3400,
      netAmount: 64590,
      paymentMethod: "CARD",
      status: "FAILED",
    },
    {
      id: "txn-201",
      transactionId: "TXN26100201",
      orderId: "ord-201",
      orderNumber: "ORD26100201",
      customerName: "Neha Gupta",
      paymentDate: "2026-10-22T13:00:00Z",
      grossAmount: 3498,
      commission: 175,
      netAmount: 3323,
      paymentMethod: "UPI",
      status: "PAID",
    },
  ],
  "slr-002": [
    {
      id: "txn-202",
      transactionId: "TXN26100202",
      orderId: "ord-202",
      orderNumber: "ORD26100202",
      customerName: "Divya Jain",
      paymentDate: "2026-10-22T11:45:00Z",
      grossAmount: 4599,
      commission: 230,
      netAmount: 4369,
      paymentMethod: "CARD",
      status: "PAID",
    },
    {
      id: "txn-203",
      transactionId: "TXN26100203",
      orderId: "ord-203",
      orderNumber: "ORD26100203",
      customerName: "Ishita Menon",
      paymentDate: "2026-10-23T11:00:00Z",
      grossAmount: 2299,
      commission: 115,
      netAmount: 2184,
      paymentMethod: "UPI",
      status: "PAID",
    },
  ],
  "slr-003": [
    {
      id: "txn-301",
      transactionId: "TXN26100301",
      orderId: "ord-301",
      orderNumber: "ORD26100301",
      customerName: "Vikram Joshi",
      paymentDate: "2026-10-22T09:00:00Z",
      grossAmount: 2999,
      commission: 150,
      netAmount: 2849,
      paymentMethod: "UPI",
      status: "PAID",
    },
    {
      id: "txn-302",
      transactionId: "TXN26100302",
      orderId: "ord-302",
      orderNumber: "ORD26100302",
      customerName: "Meera Kapoor",
      paymentDate: "2026-10-21T14:00:00Z",
      grossAmount: 8999,
      commission: 450,
      netAmount: 8549,
      paymentMethod: "COD",
      status: "PENDING",
    },
  ],
};

// ─── Mock Payouts per seller ─────────────────────────────────────────────────

export const MOCK_PAYOUTS: Record<string, Payout[]> = {
  "slr-001": [
    {
      id: "payout-1",
      amount: 85000,
      date: "2026-10-20T10:00:00Z",
      status: "PAID",
      bankAccount: "XXXXXXXX1234",
      bankName: "HDFC Bank",
      referenceId: "REF26102001",
    },
    {
      id: "payout-2",
      amount: 45000,
      date: "2026-10-10T14:00:00Z",
      status: "PAID",
      bankAccount: "XXXXXXXX1234",
      bankName: "HDFC Bank",
      referenceId: "REF26101001",
    },
    {
      id: "payout-3",
      amount: 28000,
      date: "2026-10-25T09:00:00Z",
      status: "PENDING",
      bankAccount: "XXXXXXXX1234",
      bankName: "HDFC Bank",
    },
  ],
  "slr-002": [
    {
      id: "payout-4",
      amount: 42000,
      date: "2026-10-18T11:00:00Z",
      status: "PAID",
      bankAccount: "XXXXXXXX5678",
      bankName: "ICICI Bank",
      referenceId: "REF26101801",
    },
    {
      id: "payout-5",
      amount: 18000,
      date: "2026-10-26T10:30:00Z",
      status: "PROCESSING",
      bankAccount: "XXXXXXXX5678",
      bankName: "ICICI Bank",
    },
  ],
  "slr-003": [
    {
      id: "payout-6",
      amount: 18500,
      date: "2026-10-15T16:00:00Z",
      status: "PAID",
      bankAccount: "XXXXXXXX9012",
      bankName: "State Bank of India",
      referenceId: "REF26101501",
    },
  ],
};

// ─── Mock Coupons per seller ─────────────────────────────────────────────────

export const MOCK_SELLER_COUPONS: Record<string, SellerCoupon[]> = {
  "slr-001": [
    {
      id: "cpn-101",
      sellerId: "slr-001",
      code: "ELEC10",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minOrderValue: 5000,
      maxDiscount: 2000,
      startDate: "2026-10-01T00:00:00Z",
      expiryDate: "2026-12-31T23:59:59Z",
      usageLimit: 500,
      usedCount: 142,
      status: "ACTIVE",
      createdAt: "2026-09-25T10:00:00Z",
      updatedAt: "2026-10-20T10:00:00Z",
    },
    {
      id: "cpn-102",
      sellerId: "slr-001",
      code: "FLAT500",
      discountType: "FLAT",
      discountValue: 500,
      minOrderValue: 3000,
      maxDiscount: undefined,
      startDate: "2026-11-01T00:00:00Z",
      expiryDate: "2026-11-30T23:59:59Z",
      usageLimit: 200,
      usedCount: 28,
      status: "ACTIVE",
      createdAt: "2026-10-22T14:00:00Z",
      updatedAt: "2026-10-22T14:00:00Z",
    },
    {
      id: "cpn-103",
      sellerId: "slr-001",
      code: "DIWALI20",
      discountType: "PERCENTAGE",
      discountValue: 20,
      minOrderValue: 10000,
      maxDiscount: 5000,
      startDate: "2026-10-15T00:00:00Z",
      expiryDate: "2026-11-05T23:59:59Z",
      usageLimit: 100,
      usedCount: 100,
      status: "EXPIRED",
      createdAt: "2026-10-01T10:00:00Z",
      updatedAt: "2026-11-06T00:00:00Z",
    },
  ],
  "slr-002": [
    {
      id: "cpn-201",
      sellerId: "slr-002",
      code: "FASHION15",
      discountType: "PERCENTAGE",
      discountValue: 15,
      minOrderValue: 2000,
      maxDiscount: 1000,
      startDate: "2026-10-01T00:00:00Z",
      expiryDate: "2026-12-31T23:59:59Z",
      usageLimit: 300,
      usedCount: 89,
      status: "ACTIVE",
      createdAt: "2026-09-20T10:00:00Z",
      updatedAt: "2026-10-15T10:00:00Z",
    },
  ],
  "slr-003": [
    {
      id: "cpn-301",
      sellerId: "slr-003",
      code: "HOME10",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minOrderValue: 1500,
      maxDiscount: 500,
      startDate: "2026-10-01T00:00:00Z",
      expiryDate: "2026-12-31T23:59:59Z",
      usageLimit: 150,
      usedCount: 34,
      status: "ACTIVE",
      createdAt: "2026-09-28T10:00:00Z",
      updatedAt: "2026-10-18T10:00:00Z",
    },
    {
      id: "cpn-302",
      sellerId: "slr-003",
      code: "SAVE200",
      discountType: "FLAT",
      discountValue: 200,
      minOrderValue: 1000,
      maxDiscount: undefined,
      startDate: "2026-11-01T00:00:00Z",
      expiryDate: "2026-11-30T23:59:59Z",
      usageLimit: 100,
      usedCount: 5,
      status: "DISABLED",
      createdAt: "2026-10-25T10:00:00Z",
      updatedAt: "2026-10-25T10:00:00Z",
    },
  ],
};

// ─── Mock Analytics Data per seller ─────────────────────────────────────────

export function getMockAnalyticsData(sellerId: string): AnalyticsDataPoint[] {
  const baseRevenue = sellerId === "slr-001" ? 95000 : sellerId === "slr-002" ? 52000 : 24000;
  const days = 30;
  const data: AnalyticsDataPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000);
    const variance = 1 + Math.sin(i / 4) * 0.3 + (i % 7) * 0.02;
    data.push({
      date: date.toISOString().split("T")[0],
      revenue: Math.round(baseRevenue * variance),
      orders: Math.round((baseRevenue / 2000) * variance),
      customers: Math.round((baseRevenue / 3000) * variance),
      conversionRate: Math.round((3.5 + Math.sin(i / 3) * 0.5) * 10) / 10,
    });
  }
  return data;
}

// ─── Mock Category Sales per seller ──────────────────────────────────────────

export function getMockCategorySales(sellerId: string): CategorySalesData[] {
  const categories = SELLER_CATEGORIES.map((cat, i) => {
    const revenue = Math.floor(Math.random() * 200000) + 50000;
    const orders = Math.floor(revenue / 2500) + 5;
    const unitsSold = Math.floor(orders * (1.5 + Math.random()));
    return {
      category: cat,
      revenue,
      orders,
      unitsSold,
      sharePercentage: 0, // calculated below
    };
  });
  const totalRevenue = categories.reduce((sum, c) => sum + c.revenue, 0);
  return categories.map((c) => ({
    ...c,
    sharePercentage: Math.round((c.revenue / totalRevenue) * 100),
  }));
}

// ─── Mock Product Performance per seller ─────────────────────────────────────

export function getMockProductPerformance(sellerId: string): ProductPerformanceData[] {
  const products = MOCK_SELLER_PRODUCTS[sellerId] || [];
  return products.map((p) => ({
    productId: p.id,
    productName: p.name,
    productImage: p.images[0]?.url,
    revenue: p.totalRevenue,
    unitsSold: p.unitsSold,
    orders: Math.round(p.unitsSold * 0.9),
    conversionRate: Math.round((2.5 + Math.random() * 3) * 10) / 10,
    rating: p.rating,
  }));
}

// ─── Mock Seller Performance per seller ─────────────────────────────────────

export const MOCK_SELLER_PERFORMANCE: Record<string, SellerPerformance> = {
  "slr-001": {
    storeRating: 4.6,
    averageCustomerRating: 4.5,
    orderCancellationRate: 3.5,
    returnRate: 2.1,
    onTimeDispatchRate: 94.2,
    productApprovalRate: 96.8,
    customerSatisfaction: 4.4,
    totalOrders: 3420,
    totalDeliveredOrders: 3180,
    totalCancelledOrders: 120,
    totalReturnedOrders: 72,
  },
  "slr-002": {
    storeRating: 4.8,
    averageCustomerRating: 4.7,
    orderCancellationRate: 2.2,
    returnRate: 1.8,
    onTimeDispatchRate: 96.5,
    productApprovalRate: 98.1,
    customerSatisfaction: 4.6,
    totalOrders: 1850,
    totalDeliveredOrders: 1720,
    totalCancelledOrders: 41,
    totalReturnedOrders: 33,
  },
  "slr-003": {
    storeRating: 4.4,
    averageCustomerRating: 4.3,
    orderCancellationRate: 5.1,
    returnRate: 3.4,
    onTimeDispatchRate: 89.7,
    productApprovalRate: 92.4,
    customerSatisfaction: 4.1,
    totalOrders: 980,
    totalDeliveredOrders: 880,
    totalCancelledOrders: 50,
    totalReturnedOrders: 33,
  },
};

// ─── Mock Report Exports per seller ──────────────────────────────────────────

export const MOCK_REPORT_EXPORTS: Record<string, ReportExport[]> = {
  "slr-001": [
    {
      id: "rpt-1",
      type: "SALES",
      status: "READY",
      generatedAt: "2026-10-25T10:00:00Z",
      downloadUrl: "/api/reports/rpt-1/download",
      recordCount: 1245,
    },
    {
      id: "rpt-2",
      type: "ORDERS",
      status: "READY",
      generatedAt: "2026-10-24T14:30:00Z",
      downloadUrl: "/api/reports/rpt-2/download",
      recordCount: 3420,
    },
  ],
  "slr-002": [
    {
      id: "rpt-3",
      type: "EARNINGS",
      status: "READY",
      generatedAt: "2026-10-23T09:00:00Z",
      downloadUrl: "/api/reports/rpt-3/download",
      recordCount: 1850,
    },
  ],
  "slr-003": [],
};

// ─── Enhanced Notifications per seller ───────────────────────────────────────

export const MOCK_ENHANCED_NOTIFICATIONS: Record<string, EnhancedNotification[]> = {
  "slr-001": [
    {
      id: "ntf-101",
      type: "NEW_ORDER",
      category: "ORDER",
      title: "New Order Received",
      message: "ORD26100101 - Samsung Galaxy S24 5G by Aarav Mehta",
      time: "10 min ago",
      status: "UNREAD",
      link: "/seller/orders",
    },
    {
      id: "ntf-102",
      type: "PAYMENT_UPDATE",
      category: "PAYMENT",
      title: "Payment Completed",
      message: "₹74,999 credited to your available balance for ORD26100101",
      time: "2 hours ago",
      status: "READ",
      link: "/seller/earnings",
    },
    {
      id: "ntf-103",
      type: "PAYOUT_INITIATED",
      category: "PAYMENT",
      title: "Payout Initiated",
      message: "₹45,000 payout initiated to HDFC Bank ending 1234",
      time: "5 hours ago",
      status: "UNREAD",
      link: "/seller/transactions",
    },
    {
      id: "ntf-104",
      type: "LOW_STOCK",
      category: "INVENTORY",
      title: "Low Stock Alert",
      message: "OnePlus 12 5G is running low (3 units left)",
      time: "5 hours ago",
      status: "UNREAD",
      link: "/seller/inventory",
    },
    {
      id: "ntf-105",
      type: "PRODUCT_APPROVAL",
      category: "PRODUCT",
      title: "Product Approved",
      message: "Canon EOS R50 Camera has been approved and is now live",
      time: "1 day ago",
      status: "READ",
      link: "/seller/products",
    },
    {
      id: "ntf-106",
      type: "RETURN_REQUEST",
      category: "RETURN",
      title: "Return Request",
      message: "ORD26100105 - Return requested by Rohit Nair",
      time: "1 day ago",
      status: "UNREAD",
      link: "/seller/returns",
    },
    {
      id: "ntf-107",
      type: "REVIEW",
      category: "REVIEW",
      title: "New Customer Review",
      message: "Rahul Verma rated Samsung Galaxy S24 5G ⭐⭐⭐⭐⭐",
      time: "2 days ago",
      status: "READ",
      link: "/seller/reviews",
    },
    {
      id: "ntf-108",
      type: "STORE_UPDATE",
      category: "STORE",
      title: "Store Verification",
      message: "Your store verification status has been updated to Verified",
      time: "3 days ago",
      status: "READ",
      link: "/seller/settings",
    },
  ],
  "slr-002": [
    {
      id: "ntf-201",
      type: "NEW_ORDER",
      category: "ORDER",
      title: "New Order Received",
      message: "ORD26100201 - Kurta Set Cotton Silk by Neha Gupta",
      time: "45 min ago",
      status: "UNREAD",
      link: "/seller/orders",
    },
    {
      id: "ntf-202",
      type: "PAYOUT_INITIATED",
      category: "PAYMENT",
      title: "Payout Initiated",
      message: "₹18,000 payout initiated to ICICI Bank ending 5678",
      time: "6 hours ago",
      status: "PROCESSING",
      link: "/seller/transactions",
    },
    {
      id: "ntf-203",
      type: "LOW_STOCK",
      category: "INVENTORY",
      title: "Low Stock Alert",
      message: "Printed Saree Banarasi is running low (2 units left)",
      time: "1 day ago",
      status: "UNREAD",
      link: "/seller/inventory",
    },
  ],
  "slr-003": [
    {
      id: "ntf-301",
      type: "NEW_ORDER",
      category: "ORDER",
      title: "New Order Received",
      message: "ORD26100301 - Non-stick Cookware Set by Vikram Joshi",
      time: "2 hours ago",
      status: "UNREAD",
      link: "/seller/orders",
    },
    {
      id: "ntf-302",
      type: "LOW_STOCK",
      category: "INVENTORY",
      title: "Low Stock Alert",
      message: "Wooden Coffee Table is running low (1 unit left)",
      time: "6 hours ago",
      status: "UNREAD",
      link: "/seller/inventory",
    },
  ],
};

// ─── Mock Support Tickets per seller ─────────────────────────────────────────

export const MOCK_SELLER_SUPPORT_TICKETS: Record<string, SellerSupportTicket[]> = {
  "slr-001": [
    {
      id: "tk-101",
      sellerId: "slr-001",
      ticketNumber: "TK261001",
      customerName: "Rohit Nair",
      subject: "Payout delay for October",
      message: "My available balance has not been settled to my bank account yet.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      orderId: "ord-105",
      orderNumber: "ORD26100105",
      createdAt: "2026-10-20T09:00:00Z",
      updatedAt: "2026-10-21T14:30:00Z",
    },
    {
      id: "tk-102",
      sellerId: "slr-001",
      ticketNumber: "TK261002",
      customerName: "Rahul Sharma",
      subject: "Store verification pending",
      message: "My store verification is still pending after 5 days.",
      status: "OPEN",
      priority: "MEDIUM",
      createdAt: "2026-10-18T11:20:00Z",
      updatedAt: "2026-10-18T11:20:00Z",
    },
  ],
  "slr-002": [
    {
      id: "tk-201",
      sellerId: "slr-002",
      ticketNumber: "TK261003",
      customerName: "Priya Desai",
      subject: "Product listing rejected",
      message: "One of my product listings was rejected without a clear reason.",
      status: "RESOLVED",
      priority: "MEDIUM",
      createdAt: "2026-10-10T16:00:00Z",
      updatedAt: "2026-10-12T10:15:00Z",
    },
  ],
  "slr-003": [],
};

// ─── Helper: Calculate commission ────────────────────────────────────────────

export interface CommissionBreakdown {
  sellingPrice: number;
  commissionPercentage: number;
  commissionAmount: number;
  applicableCharges: number;
  refundDeductions: number;
  sellerNetAmount: number;
}

export function calculateCommission(
  sellingPrice: number,
  commissionPercentage: number = 5,
  shippingCharges: number = 0,
  refundDeductions: number = 0
): CommissionBreakdown {
  const commissionAmount = Math.round((sellingPrice * commissionPercentage) / 100);
  const applicableCharges = shippingCharges;
  const sellerNetAmount = sellingPrice - commissionAmount - applicableCharges - refundDeductions;
  return {
    sellingPrice,
    commissionPercentage,
    commissionAmount,
    applicableCharges,
    refundDeductions,
    sellerNetAmount: Math.max(0, sellerNetAmount),
  };
}
