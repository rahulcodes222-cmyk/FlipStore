/**
 * Mock Seller Data
 * Multi-vendor seller foundation with three unique sellers.
 * Frontend-only mock data for development and demo purposes.
 */

import {
  Seller,
  SellerOrder,
  TopProduct,
  LowStockProduct,
  SalesDataPoint,
  RevenueDataPoint,
  Notification,
  FAQItem,
  SupportTicket,
  SellerRegisterPayload,
} from "@/types";

const AVATAR = (seed: string) =>
  `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80&seed=${seed}`;
const STORE_LOGO = (seed: string) =>
  `https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&q=80&seed=${seed}`;
const PRODUCT_IMG = (seed: string) =>
  `https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80&seed=${seed}`;

// ─── Mock Seller Accounts ───────────────────────────────────────────────────

export const MOCK_SELLERS: Seller[] = [
  {
    id: "slr-001",
    sellerId: "SEL1001",
    name: "Rahul Sharma",
    email: "rahul.sharma@electrohub.in",
    phone: "+91 98765 43210",
    password: "Seller@1234",
    role: "SELLER",
    avatar: AVATAR("rahul"),
    storeName: "ElectroHub India",
    storeSlug: "electrohub-india",
    storeDescription:
      "Trusted electronics retailer offering smartphones, laptops, accessories and home appliances with fast delivery across India.",
    storeLogo: STORE_LOGO("electrohub"),
    storeBanner:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&q=80&seed=electrohub",
    businessCategory: "Electronics",
    businessType: "Private Limited",
    businessEmail: "rahul.sharma@electrohub.in",
    businessPhone: "+91 98765 43210",
    address: {
      id: "addr-slr-1",
      name: "Rahul Sharma",
      phone: "9876543210",
      pincode: "560034",
      locality: "Koramangala 4th Block",
      street: "Flat 402, Green Glen Apartments, 17th Main Road",
      city: "Bengaluru",
      state: "Karnataka",
      landmark: "Near Sony World Signal",
      type: "business",
      isDefault: true,
    },
    panNumber: "ABCDE1234F",
    gstNumber: "29ABCDE1234F1Z5",
    businessRegistration: "CIN U52100KA2020PTC123456",
    bankAccountHolder: "Rahul Sharma",
    bankName: "HDFC Bank",
    accountNumber: "50100123456789",
    ifscCode: "HDFC0001234",
    verificationStatus: "VERIFIED",
    storeStatus: "ACTIVE",
    rating: 4.6,
    totalSales: 1245000,
    totalOrders: 3420,
    totalProducts: 85,
    totalCustomers: 2180,
    availableBalance: 85000,
    totalEarnings: 1245000,
    pendingOrders: 45,
    cancelledOrders: 12,
    joinedAt: "2024-03-15T08:30:00Z",
    createdAt: "2024-03-15T08:30:00Z",
    updatedAt: "2026-10-20T14:20:00Z",
  },
  {
    id: "slr-002",
    sellerId: "SEL1002",
    name: "Priya Desai",
    email: "priya.desai@fashionista.in",
    phone: "+91 91234 56789",
    password: "Seller@1234",
    role: "SELLER",
    avatar: AVATAR("priya"),
    storeName: "Fashionista Boutique",
    storeSlug: "fashionista-boutique",
    storeDescription:
      "Curated ethnic and western wear for women, kids and men. Handcrafted designs with quality fabrics.",
    storeLogo: STORE_LOGO("fashionista"),
    storeBanner:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80&seed=fashionista",
    businessCategory: "Fashion & Apparel",
    businessType: "Proprietorship",
    businessEmail: "priya.desai@fashionista.in",
    businessPhone: "+91 91234 56789",
    address: {
      id: "addr-slr-2",
      name: "Priya Desai",
      phone: "9123456789",
      pincode: "400050",
      locality: "Bandra West",
      street: "A-102, Sea View Apartments, Linking Road",
      city: "Mumbai",
      state: "Maharashtra",
      landmark: "Near Mount Mary Church",
      type: "business",
      isDefault: true,
    },
    panNumber: "FGHIJ5678K",
    gstNumber: "27FGHIJ5678K1Z7",
    businessRegistration: "GUM U74999MH2021PTC345678",
    bankAccountHolder: "Priya Desai",
    bankName: "ICICI Bank",
    accountNumber: "63210098765432",
    ifscCode: "ICIC0005678",
    verificationStatus: "VERIFIED",
    storeStatus: "ACTIVE",
    rating: 4.8,
    totalSales: 680000,
    totalOrders: 1850,
    totalProducts: 142,
    totalCustomers: 1340,
    availableBalance: 42000,
    totalEarnings: 680000,
    pendingOrders: 28,
    cancelledOrders: 6,
    joinedAt: "2024-07-22T10:15:00Z",
    createdAt: "2024-07-22T10:15:00Z",
    updatedAt: "2026-10-22T09:10:00Z",
  },
  {
    id: "slr-003",
    sellerId: "SEL1003",
    name: "Amit Verma",
    email: "amit.verma@homeliving.in",
    phone: "+91 99887 76655",
    password: "Seller@1234",
    role: "SELLER",
    avatar: AVATAR("amit"),
    storeName: "HomeLiving Essentials",
    storeSlug: "homeliving-essentials",
    storeDescription:
      "Home decor, kitchen essentials and furniture at affordable prices. Transform your living space today.",
    storeLogo: STORE_LOGO("homeliving"),
    storeBanner:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80&seed=homeliving",
    businessCategory: "Home & Kitchen",
    businessType: "Partnership",
    businessEmail: "amit.verma@homeliving.in",
    businessPhone: "+91 99887 76655",
    address: {
      id: "addr-slr-3",
      name: "Amit Verma",
      phone: "9988776655",
      pincode: "110048",
      locality: "Lajpat Nagar",
      street: "B-14, Green Park Extension, Main Market",
      city: "New Delhi",
      state: "Delhi",
      landmark: "Near Central Market",
      type: "business",
      isDefault: true,
    },
    panNumber: "KLMNO9012P",
    gstNumber: "07KLMNO9012P1Z9",
    businessRegistration: "DL U52609DL2019PTC987654",
    bankAccountHolder: "Amit Verma",
    bankName: "State Bank of India",
    accountNumber: "40398765432100",
    ifscCode: "SBIN0009012",
    verificationStatus: "PENDING",
    storeStatus: "ACTIVE",
    rating: 4.4,
    totalSales: 310000,
    totalOrders: 980,
    totalProducts: 67,
    totalCustomers: 720,
    availableBalance: 18500,
    totalEarnings: 310000,
    pendingOrders: 18,
    cancelledOrders: 4,
    joinedAt: "2025-01-10T16:45:00Z",
    createdAt: "2025-01-10T16:45:00Z",
    updatedAt: "2026-10-21T11:05:00Z",
  },
];

// ─── Demo seller login credentials ──────────────────────────────────────────

export const SELLER_DEMO_CREDENTIALS = MOCK_SELLERS.map((s) => ({
  label: s.storeName,
  name: s.name,
  identifier: s.email,
  password: s.password,
  store: s.storeName,
}));

// ─── Mock Dashboard Stats per seller ────────────────────────────────────────

export function getSellerStats(sellerId: string) {
  const s = MOCK_SELLERS.find((x) => x.id === sellerId);
  if (!s) return null;
  return {
    totalRevenue: s.totalEarnings,
    totalOrders: s.totalOrders,
    totalProducts: s.totalProducts,
    totalCustomers: s.totalCustomers,
    pendingOrders: s.pendingOrders,
    cancelledOrders: s.cancelledOrders,
    availableBalance: s.availableBalance,
    totalEarnings: s.totalEarnings,
  } as const;
}

// ─── Mock Orders ────────────────────────────────────────────────────────────

export const MOCK_SELLER_ORDERS: Record<string, SellerOrder[]> = {
  "slr-001": [
    {
      id: "ord-101",
      orderNumber: "ORD26100101",
      customerName: "Aarav Mehta",
      customerAvatar: AVATAR("cust1"),
      productName: "Samsung Galaxy S24 5G 256GB",
      productImage: PRODUCT_IMG("p1"),
      orderDate: "2026-10-22T14:30:00Z",
      quantity: 1,
      totalAmount: 74999,
      paymentStatus: "PAID",
      orderStatus: "SHIPPED",
    },
    {
      id: "ord-102",
      orderNumber: "ORD26100102",
      customerName: "Sneha Reddy",
      customerAvatar: AVATAR("cust2"),
      productName: "OnePlus 12 5G 12GB RAM",
      productImage: PRODUCT_IMG("p2"),
      orderDate: "2026-10-22T12:15:00Z",
      quantity: 1,
      totalAmount: 64999,
      paymentStatus: "PAID",
      orderStatus: "CONFIRMED",
    },
    {
      id: "ord-103",
      orderNumber: "ORD26100103",
      customerName: "Karan Singh",
      customerAvatar: AVATAR("cust3"),
      productName: "boAt Rockerz 550 Headphones",
      productImage: PRODUCT_IMG("p3"),
      orderDate: "2026-10-21T19:45:00Z",
      quantity: 2,
      totalAmount: 4998,
      paymentStatus: "PAID",
      orderStatus: "DELIVERED",
    },
    {
      id: "ord-104",
      orderNumber: "ORD26100104",
      customerName: "Anita Pillai",
      customerAvatar: AVATAR("cust4"),
      productName: "Dyson V12 Vacuum Cleaner",
      productImage: PRODUCT_IMG("p4"),
      orderDate: "2026-10-21T10:20:00Z",
      quantity: 1,
      totalAmount: 54990,
      paymentStatus: "PENDING",
      orderStatus: "PLACED",
    },
    {
      id: "ord-105",
      orderNumber: "ORD26100105",
      customerName: "Rohit Nair",
      customerAvatar: AVATAR("cust5"),
      productName: "Canon EOS R50 Camera",
      productImage: PRODUCT_IMG("p5"),
      orderDate: "2026-10-20T16:10:00Z",
      quantity: 1,
      totalAmount: 67990,
      paymentStatus: "FAILED",
      orderStatus: "CANCELLED",
    },
  ],
  "slr-002": [
    {
      id: "ord-201",
      orderNumber: "ORD26100201",
      customerName: "Neha Gupta",
      customerAvatar: AVATAR("cust6"),
      productName: "Kurta Set Cotton Silk",
      productImage: PRODUCT_IMG("f1"),
      orderDate: "2026-10-22T13:00:00Z",
      quantity: 2,
      totalAmount: 3498,
      paymentStatus: "PAID",
      orderStatus: "SHIPPED",
    },
    {
      id: "ord-202",
      orderNumber: "ORD26100202",
      customerName: "Divya Jain",
      customerAvatar: AVATAR("cust7"),
      productName: "Printed Saree Banarasi",
      productImage: PRODUCT_IMG("f2"),
      orderDate: "2026-10-22T11:45:00Z",
      quantity: 1,
      totalAmount: 4599,
      paymentStatus: "PAID",
      orderStatus: "CONFIRMED",
    },
    {
      id: "ord-203",
      orderNumber: "ORD26100203",
      customerName: "Ishita Menon",
      customerAvatar: AVATAR("cust8"),
      productName: "Denim Jacket Women",
      productImage: PRODUCT_IMG("f3"),
      orderDate: "2026-10-21T15:30:00Z",
      quantity: 1,
      totalAmount: 2299,
      paymentStatus: "PAID",
      orderStatus: "DELIVERED",
    },
  ],
  "slr-003": [
    {
      id: "ord-301",
      orderNumber: "ORD26100301",
      customerName: "Vikram Joshi",
      customerAvatar: AVATAR("cust9"),
      productName: "Non-stick Cookware Set",
      productImage: PRODUCT_IMG("h1"),
      orderDate: "2026-10-22T09:00:00Z",
      quantity: 1,
      totalAmount: 2999,
      paymentStatus: "PAID",
      orderStatus: "PLACED",
    },
    {
      id: "ord-302",
      orderNumber: "ORD26100302",
      customerName: "Meera Kapoor",
      customerAvatar: AVATAR("cust10"),
      productName: "Wooden Coffee Table",
      productImage: PRODUCT_IMG("h2"),
      orderDate: "2026-10-21T14:00:00Z",
      quantity: 1,
      totalAmount: 8999,
      paymentStatus: "PENDING",
      orderStatus: "PROCESSING",
    },
  ],
};

// ─── Mock Top Products ─────────────────────────────────────────────────────

export const MOCK_TOP_PRODUCTS: Record<string, TopProduct[]> = {
  "slr-001": [
    { id: "tp-1", name: "Samsung Galaxy S24", image: PRODUCT_IMG("p1"), unitsSold: 142, revenue: 10649858, stock: 34, inStock: true },
    { id: "tp-2", name: "OnePlus 12 5G", image: PRODUCT_IMG("p2"), unitsSold: 98, revenue: 6379902, stock: 21, inStock: true },
    { id: "tp-3", name: "boAt Rockerz 550", image: PRODUCT_IMG("p3"), unitsSold: 310, revenue: 769900, stock: 89, inStock: true },
  ],
  "slr-002": [
    { id: "tp-4", name: "Kurta Set Cotton Silk", image: PRODUCT_IMG("f1"), unitsSold: 215, revenue: 376470, stock: 45, inStock: true },
    { id: "tp-5", name: "Printed Saree Banarasi", image: PRODUCT_IMG("f2"), unitsSold: 130, revenue: 597870, stock: 28, inStock: true },
    { id: "tp-6", name: "Denim Jacket Women", image: PRODUCT_IMG("f3"), unitsSold: 92, revenue: 211508, stock: 61, inStock: true },
  ],
  "slr-003": [
    { id: "tp-7", name: "Non-stick Cookware Set", image: PRODUCT_IMG("h1"), unitsSold: 68, revenue: 203932, stock: 12, inStock: true },
    { id: "tp-8", name: "Wooden Coffee Table", image: PRODUCT_IMG("h2"), unitsSold: 24, revenue: 215976, stock: 5, inStock: true },
  ],
};

// ─── Mock Low Stock Alerts ──────────────────────────────────────────────────

export const MOCK_LOW_STOCK: Record<string, LowStockProduct[]> = {
  "slr-001": [
    { id: "ls-1", name: "OnePlus 12 5G", image: PRODUCT_IMG("p2"), stock: 3, threshold: 10 },
  ],
  "slr-002": [
    { id: "ls-2", name: "Printed Saree Banarasi", image: PRODUCT_IMG("f2"), stock: 2, threshold: 5 },
    { id: "ls-3", name: "Denim Jacket Women", image: PRODUCT_IMG("f3"), stock: 1, threshold: 3 },
  ],
  "slr-003": [
    { id: "ls-4", name: "Non-stick Cookware Set", image: PRODUCT_IMG("h1"), stock: 2, threshold: 8 },
    { id: "ls-5", name: "Wooden Coffee Table", image: PRODUCT_IMG("h2"), stock: 1, threshold: 4 },
  ],
};

// ─── Mock Sales Data (Last 30 days) ─────────────────────────────────────────

const DAYS = [
  "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun",
  "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun",
  "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun",
  "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun",
  "Mon", "Tue", "Wed",
];

export function getSellerSalesData(sellerId: string): SalesDataPoint[] {
  const base = sellerId === "slr-001" ? 45 : sellerId === "slr-002" ? 28 : 18;
  return DAYS.map((name, i) => ({
    name,
    sales: Math.round((base + Math.sin(i / 3) * 12 + i) * 100),
    orders: Math.round(base + Math.sin(i / 3) * 6 + i / 2),
    revenue: Math.round((base + Math.sin(i / 3) * 12 + i) * 2100),
  }));
}

// ─── Mock Revenue Data (Last 12 months) ─────────────────────────────────────

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function getSellerRevenueData(sellerId: string): RevenueDataPoint[] {
  const base = sellerId === "slr-001" ? 95000 : sellerId === "slr-002" ? 52000 : 24000;
  return MONTHS.map((name, i) => ({
    name,
    revenue: Math.round((base + Math.sin(i / 2) * 18000 + i * 2500) * 1),
  }));
}

// ─── Mock Notifications per seller ──────────────────────────────────────────

export const MOCK_NOTIFICATIONS: Record<string, Notification[]> = {
  "slr-001": [
    {
      id: "ntf-1",
      type: "NEW_ORDER",
      title: "New Order Received",
      message: "ORD26100101 - Samsung Galaxy S24 5G by Aarav Mehta",
      time: "10 min ago",
      status: "UNREAD",
      link: "/seller/orders",
    },
    {
      id: "ntf-2",
      type: "PAYMENT_UPDATE",
      title: "Payment Credited",
      message: "₹74,999 credited to your available balance for ORD26100101",
      time: "2 hours ago",
      status: "READ",
      link: "/seller/earnings",
    },
    {
      id: "ntf-3",
      type: "LOW_STOCK",
      title: "Low Stock Alert",
      message: "OnePlus 12 5G is running low (3 units left)",
      time: "5 hours ago",
      status: "UNREAD",
      link: "/seller/inventory",
    },
    {
      id: "ntf-4",
      type: "PRODUCT_APPROVAL",
      title: "Product Approved",
      message: "Canon EOS R50 Camera has been approved and is now live",
      time: "1 day ago",
      status: "READ",
      link: "/seller/products",
    },
  ],
  "slr-002": [
    {
      id: "ntf-5",
      type: "NEW_ORDER",
      title: "New Order Received",
      message: "ORD26100201 - Kurta Set Cotton Silk by Neha Gupta",
      time: "45 min ago",
      status: "UNREAD",
      link: "/seller/orders",
    },
    {
      id: "ntf-6",
      type: "RETURN_REQUEST",
      title: "Return Request",
      message: "ORD26100198 - Return requested by Divya Jain",
      time: "3 hours ago",
      status: "UNREAD",
      link: "/seller/returns",
    },
    {
      id: "ntf-7",
      type: "STORE_UPDATE",
      title: "Store Rating Updated",
      message: "Your store rating is now 4.8 ★",
      time: "1 day ago",
      status: "READ",
      link: "/seller/store",
    },
  ],
  "slr-003": [
    {
      id: "ntf-8",
      type: "NEW_ORDER",
      title: "New Order Received",
      message: "ORD26100301 - Non-stick Cookware Set by Vikram Joshi",
      time: "2 hours ago",
      status: "UNREAD",
      link: "/seller/orders",
    },
    {
      id: "ntf-9",
      type: "LOW_STOCK",
      title: "Low Stock Alert",
      message: "Wooden Coffee Table is running low (1 unit left)",
      time: "6 hours ago",
      status: "UNREAD",
      link: "/seller/inventory",
    },
  ],
};

// ─── FAQ Data ───────────────────────────────────────────────────────────────

export const MOCK_FAQS: FAQItem[] = [
  {
    id: "faq-1",
    question: "How do I register as a seller?",
    answer:
      "Fill out the seller registration form with your personal, business and bank details. Once submitted, your application will be reviewed and your store status set to Pending.",
    category: "Registration",
  },
  {
    id: "faq-2",
    question: "How long does seller verification take?",
    answer:
      "Verification typically takes 3–5 business days once all documents are submitted. You will receive an email notification upon approval.",
    category: "Verification",
  },
  {
    id: "faq-3",
    question: "When will I receive my earnings?",
    answer:
      "Earnings are settled weekly to your linked bank account after order delivery and the return window closes.",
    category: "Payments",
  },
  {
    id: "faq-4",
    question: "Can I edit my store profile after registration?",
    answer:
      "Yes, you can update your store name, description, category and contact details from the Store Management page anytime.",
    category: "Store",
  },
  {
    id: "faq-5",
    question: "How do I list a new product?",
    answer:
      "Go to Products → Add Product, fill in product details, upload images and set price and stock. Products go live after approval.",
    category: "Products",
  },
];

// ─── Mock Support Tickets ───────────────────────────────────────────────────

export const MOCK_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: "tk-101",
    subject: "Payout delay for October",
    message: "My available balance has not been settled to my bank account yet.",
    status: "IN_PROGRESS",
    priority: "HIGH",
    createdAt: "2026-10-20T09:00:00Z",
    updatedAt: "2026-10-21T14:30:00Z",
  },
  {
    id: "tk-102",
    subject: "Store verification pending",
    message: "My store verification is still pending after 5 days.",
    status: "OPEN",
    priority: "MEDIUM",
    createdAt: "2026-10-18T11:20:00Z",
    updatedAt: "2026-10-18T11:20:00Z",
  },
  {
    id: "tk-103",
    subject: "Product listing rejected",
    message: "One of my product listings was rejected without a clear reason.",
    status: "RESOLVED",
    priority: "MEDIUM",
    createdAt: "2026-10-10T16:00:00Z",
    updatedAt: "2026-10-12T10:15:00Z",
  },
];

// ─── Default empty registration payload ─────────────────────────────────────

export const EMPTY_REGISTER_PAYLOAD: SellerRegisterPayload = {
  step1: {
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  },
  step2: {
    businessName: "",
    businessType: "",
    businessCategory: "",
    businessDescription: "",
    businessEmail: "",
    businessPhone: "",
  },
  step3: {
    houseNumber: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  },
  step4: {
    panNumber: "",
    gstNumber: "",
    businessRegistration: "",
    panPreview: null,
    gstPreview: null,
    identityPreview: null,
    bankProofPreview: null,
    businessRegistrationProofPreview: null,
    fssaiPreview: null,
    trademarkPreview: null,
  },
  step5: {
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
  },
};
