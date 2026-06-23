// Local demo data that mirrors the souqly-yemen-connect web prototype.
// Used by demo mode when the Supabase seed has not been run yet.

export type Product = {
  id: string;
  name: string;
  price: number; // SAR
  storeId: string;
  storeName?: string;
  description?: string;
  image: any; // RN image source
  imageName: string;
};

export type Store = {
  id: string;
  name: string;
  category: string;
  categoryEmoji: string;
  location: string;
  whatsapp: string;
  hours: string;
  open: boolean;
  image: any;
  imageName: string;
  accent: string;
  rating: number;
  reviews: number;
  lat: number;
  lng: number;
  deliveryRadiusKm: number;
  deliveryFee: number;
  restrictionActive?: boolean;
  restrictionReason?: string;
};

export type Category = {
  id: string;
  label: string;
  emoji: string;
};

export type OrderStatus = "new" | "preparing" | "ready" | "completed" | "cancelled";

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

export type OrderCustomer = {
  phone: string;
  address?: string;
  notes?: string;
  lat?: number;
  lng?: number;
};

export type Order = {
  id: string;
  storeId: string;
  items: OrderItem[];
  customer: OrderCustomer;
  deliveryType: "delivery" | "pickup";
  deliveryFee: number;
  distanceKm?: number;
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
};

export type PaymentStatus = "paid" | "pending_verification" | "unpaid" | "overdue";

export type BillingPeriod = {
  id: string;
  startDate: string;
  endDate: string;
  subscriptionFeeUsd: number;
  completedOrders: number;
  transactionFeeUsd: number;
  totalDueUsd: number;
  status: PaymentStatus;
  paidAt?: string;
};

export type PaymentRecord = {
  id: string;
  amountUsd: number;
  referenceNumber: string;
  notes?: string;
  receiptImage?: string;
  status: PaymentStatus;
  createdAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
};

export type MerchantBilling = {
  storeId: string;
  currentPlanId: "free" | "pro" | "business";
  planStartedAt: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  autoRenew: boolean;
  lifetimePaidUsd: number;
  paidThisMonthUsd: number;
  pendingVerificationUsd: number;
  restrictionActive: boolean;
  restrictionReason?: string;
};

export type PlanId = "free" | "pro" | "business";

export type SubscriptionPlan = {
  id: PlanId;
  name: string;
  priceUsd: number;
  priceSar: number;
  maxProducts: number;
  maxPhotosPerProduct: number;
  features: string[];
  badge?: string;
};

const images: Record<string, any> = {
  "store-pharmacy.jpg": require("../../assets/web/store-pharmacy.jpg"),
  "store-fashion.jpg": require("../../assets/web/store-fashion.jpg"),
  "store-grocery.jpg": require("../../assets/web/store-grocery.jpg"),
  "store-cosmetics.jpg": require("../../assets/web/store-cosmetics.jpg"),
  "p-panadol.jpg": require("../../assets/web/p-panadol.jpg"),
  "p-amoxicillin.jpg": require("../../assets/web/p-amoxicillin.jpg"),
  "p-vitc.jpg": require("../../assets/web/p-vitc.jpg"),
  "p-ibuprofen.jpg": require("../../assets/web/p-ibuprofen.jpg"),
  "p-zinc.jpg": require("../../assets/web/p-zinc.jpg"),
  "p-shirt.jpg": require("../../assets/web/p-shirt.jpg"),
  "p-hijab.jpg": require("../../assets/web/p-hijab.jpg"),
  "p-sneakers.jpg": require("../../assets/web/p-sneakers.jpg"),
  "p-belt.jpg": require("../../assets/web/p-belt.jpg"),
  "p-dress.jpg": require("../../assets/web/p-dress.jpg"),
  "p-oil.jpg": require("../../assets/web/p-oil.jpg"),
  "p-rice.jpg": require("../../assets/web/p-rice.jpg"),
  "p-milk.jpg": require("../../assets/web/p-milk.jpg"),
  "p-bread.jpg": require("../../assets/web/p-bread.jpg"),
  "p-water.jpg": require("../../assets/web/p-water.jpg"),
  "p-cream.jpg": require("../../assets/web/p-cream.jpg"),
  "p-lipgloss.jpg": require("../../assets/web/p-lipgloss.jpg"),
  "p-sunscreen.jpg": require("../../assets/web/p-sunscreen.jpg"),
  "p-toner.jpg": require("../../assets/web/p-toner.jpg"),
  "p-pencil.jpg": require("../../assets/web/p-pencil.jpg"),
};

export const stores: Store[] = [
  {
    id: "al-shifa",
    name: "Al-Shifa Pharmacy",
    category: "Pharmacy",
    categoryEmoji: "💊",
    location: "Sanaa, Yemen",
    whatsapp: "+967501234567",
    hours: "8AM - 10PM",
    open: true,
    image: images["store-pharmacy.jpg"],
    imageName: "store-pharmacy.jpg",
    accent: "#0F766E",
    rating: 4.9,
    reviews: 312,
    lat: 15.3694,
    lng: 44.191,
    deliveryRadiusKm: 20,
    deliveryFee: 8,
  },
  {
    id: "moda",
    name: "Moda Fashion",
    category: "Fashion",
    categoryEmoji: "👗",
    location: "Sanaa, Yemen",
    whatsapp: "+967502345678",
    hours: "9AM - 9PM",
    open: true,
    image: images["store-fashion.jpg"],
    imageName: "store-fashion.jpg",
    accent: "#BE185D",
    rating: 4.7,
    reviews: 198,
    lat: 15.372,
    lng: 44.195,
    deliveryRadiusKm: 15,
    deliveryFee: 11,
  },
  {
    id: "al-nour",
    name: "Al-Nour Grocery",
    category: "Food & Grocery",
    categoryEmoji: "🛒",
    location: "Sanaa, Yemen",
    whatsapp: "+967503456789",
    hours: "7AM - 11PM",
    open: true,
    image: images["store-grocery.jpg"],
    imageName: "store-grocery.jpg",
    accent: "#15803D",
    rating: 4.8,
    reviews: 524,
    lat: 15.366,
    lng: 44.188,
    deliveryRadiusKm: 25,
    deliveryFee: 6,
  },
  {
    id: "glow",
    name: "Glow Cosmetics",
    category: "Cosmetics & Beauty",
    categoryEmoji: "💄",
    location: "Aden, Yemen",
    whatsapp: "+967504567890",
    hours: "10AM - 8PM",
    open: false,
    image: images["store-cosmetics.jpg"],
    imageName: "store-cosmetics.jpg",
    accent: "#BE5B8A",
    rating: 4.6,
    reviews: 142,
    lat: 12.7855,
    lng: 45.0185,
    deliveryRadiusKm: 10,
    deliveryFee: 9,
  },
];

export const products: Product[] = [
  { id: "panadol", name: "Panadol 500mg", price: 18, storeId: "al-shifa", image: images["p-panadol.jpg"], imageName: "p-panadol.jpg", description: "Effective pain relief tablets, 20 tablets per pack." },
  { id: "amoxicillin", name: "Amoxicillin 250mg", price: 38, storeId: "al-shifa", image: images["p-amoxicillin.jpg"], imageName: "p-amoxicillin.jpg", description: "Broad-spectrum antibiotic capsules." },
  { id: "vitc", name: "Vitamin C 1000mg", price: 27.5, storeId: "al-shifa", image: images["p-vitc.jpg"], imageName: "p-vitc.jpg", description: "Immune system support, 30 effervescent tablets." },
  { id: "ibuprofen", name: "Ibuprofen 400mg", price: 15, storeId: "al-shifa", image: images["p-ibuprofen.jpg"], imageName: "p-ibuprofen.jpg", description: "Anti-inflammatory pain reliever, 24 tablets." },
  { id: "zinc", name: "Zinc Tablets", price: 30.5, storeId: "al-shifa", image: images["p-zinc.jpg"], imageName: "p-zinc.jpg", description: "Immune support supplement, 60 tablets." },
  { id: "shirt", name: "Men's Dress Shirt", price: 129, storeId: "moda", image: images["p-shirt.jpg"], imageName: "p-shirt.jpg", description: "Premium cotton dress shirt." },
  { id: "hijab", name: "Women's Hijab Set", price: 76, storeId: "moda", image: images["p-hijab.jpg"], imageName: "p-hijab.jpg", description: "Elegant chiffon hijab set." },
  { id: "sneakers", name: "Kids Sneakers", price: 106, storeId: "moda", image: images["p-sneakers.jpg"], imageName: "p-sneakers.jpg", description: "Comfortable sneakers for active kids." },
  { id: "belt", name: "Leather Belt", price: 53, storeId: "moda", image: images["p-belt.jpg"], imageName: "p-belt.jpg", description: "Genuine leather belt." },
  { id: "dress", name: "Summer Dress", price: 136.5, storeId: "moda", image: images["p-dress.jpg"], imageName: "p-dress.jpg", description: "Lightweight summer dress." },
  { id: "oil", name: "Sunflower Oil 1.8L", price: 48.5, storeId: "al-nour", image: images["p-oil.jpg"], imageName: "p-oil.jpg", description: "Pure sunflower cooking oil, 1.8L." },
  { id: "rice", name: "Long Grain Rice 5kg", price: 68, storeId: "al-nour", image: images["p-rice.jpg"], imageName: "p-rice.jpg", description: "Premium basmati rice, 5kg." },
  { id: "milk", name: "Fresh Milk 1L", price: 22.5, storeId: "al-nour", image: images["p-milk.jpg"], imageName: "p-milk.jpg", description: "Fresh full-cream milk, 1L." },
  { id: "bread", name: "Whole Wheat Bread", price: 12, storeId: "al-nour", image: images["p-bread.jpg"], imageName: "p-bread.jpg", description: "Freshly baked whole wheat loaf." },
  { id: "water", name: "Mineral Water 6-pack", price: 30.5, storeId: "al-nour", image: images["p-water.jpg"], imageName: "p-water.jpg", description: "Pack of 6 x 1.5L bottles." },
  { id: "cream", name: "Moisturizing Face Cream", price: 91, storeId: "glow", image: images["p-cream.jpg"], imageName: "p-cream.jpg", description: "Hydrating face cream, 50ml." },
  { id: "lipgloss", name: "Lip Gloss Set", price: 53, storeId: "glow", image: images["p-lipgloss.jpg"], imageName: "p-lipgloss.jpg", description: "Set of 4 shimmering lip glosses." },
  { id: "sunscreen", name: "Sunscreen SPF50", price: 83.5, storeId: "glow", image: images["p-sunscreen.jpg"], imageName: "p-sunscreen.jpg", description: "Broad-spectrum SPF50 protection." },
  { id: "toner", name: "Rose Water Toner", price: 60.5, storeId: "glow", image: images["p-toner.jpg"], imageName: "p-toner.jpg", description: "Natural rose water facial toner, 200ml." },
  { id: "pencil", name: "Eyebrow Pencil", price: 38, storeId: "glow", image: images["p-pencil.jpg"], imageName: "p-pencil.jpg", description: "Long-lasting eyebrow pencil." },
];

export const categories: Category[] = [
  { id: "all", label: "All", emoji: "✨" },
  { id: "Pharmacy", label: "Pharmacy", emoji: "💊" },
  { id: "Fashion", label: "Fashion", emoji: "👗" },
  { id: "Food & Grocery", label: "Grocery", emoji: "🛒" },
  { id: "Cosmetics & Beauty", label: "Beauty", emoji: "💄" },
  { id: "Electronics", label: "Electronics", emoji: "📱" },
];

export const plans: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    priceUsd: 0,
    priceSar: 0,
    maxProducts: 30,
    maxPhotosPerProduct: 1,
    features: ["30 products maximum", "1 photo per product", "Basic storefront", "WhatsApp ordering", "Basic analytics"],
  },
  {
    id: "pro",
    name: "Pro",
    priceUsd: 2.99,
    priceSar: 12,
    maxProducts: 200,
    maxPhotosPerProduct: 3,
    features: ["200 products maximum", "3 photos per product", "Verified Merchant badge", "Priority search placement", "Advanced analytics"],
    badge: "Verified",
  },
  {
    id: "business",
    name: "Business",
    priceUsd: 5.99,
    priceSar: 23,
    maxProducts: 1000,
    maxPhotosPerProduct: 5,
    features: ["1000 products maximum", "5 photos per product", "Homepage featured placement", "Delivery management access", "Team accounts", "Premium analytics"],
    badge: "Featured",
  },
];

export const demoMerchantStoreId = "al-shifa";

export const initialOrders: Order[] = [
  {
    id: "ORD-001",
    storeId: "al-shifa",
    items: [
      { productId: "panadol", name: "Panadol 500mg", price: 18, quantity: 2, image: "p-panadol" },
      { productId: "vitc", name: "Vitamin C 1000mg", price: 27.5, quantity: 1, image: "p-vitc" },
    ],
    customer: { phone: "+967700000001", address: "Sana'a, Hadda Street", notes: "Please deliver quickly" },
    deliveryType: "delivery",
    deliveryFee: 8,
    distanceKm: 3.2,
    subtotal: 63.5,
    total: 71.5,
    status: "new",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "ORD-002",
    storeId: "al-shifa",
    items: [
      { productId: "ibuprofen", name: "Ibuprofen 400mg", price: 15, quantity: 1, image: "p-ibuprofen" },
    ],
    customer: { phone: "+967700000002", address: "Sana'a, Tahrir Square" },
    deliveryType: "pickup",
    deliveryFee: 0,
    subtotal: 15,
    total: 15,
    status: "completed",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: "ORD-003",
    storeId: "al-shifa",
    items: [
      { productId: "zinc", name: "Zinc Tablets", price: 30.5, quantity: 1, image: "p-zinc" },
      { productId: "amoxicillin", name: "Amoxicillin 250mg", price: 38, quantity: 1, image: "p-amoxicillin" },
    ],
    customer: { phone: "+967700000003" },
    deliveryType: "delivery",
    deliveryFee: 8,
    subtotal: 68.5,
    total: 76.5,
    status: "preparing",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

export const demoBillingPeriods: BillingPeriod[] = [
  {
    id: "PER-1",
    startDate: "2026-05-19",
    endDate: "2026-06-19",
    subscriptionFeeUsd: 2.99,
    completedOrders: 38,
    transactionFeeUsd: 9.5,
    totalDueUsd: 12.49,
    status: "paid",
    paidAt: "2026-06-18T10:00:00.000Z",
  },
  {
    id: "PER-2",
    startDate: "2026-06-19",
    endDate: "2026-07-19",
    subscriptionFeeUsd: 2.99,
    completedOrders: 12,
    transactionFeeUsd: 3.0,
    totalDueUsd: 5.99,
    status: "unpaid",
  },
];

export const demoPaymentRecords: PaymentRecord[] = [
  {
    id: "PAY-001",
    amountUsd: 12.49,
    referenceNumber: "WASIL-ALSHIFA-001",
    notes: "Bank transfer",
    status: "paid",
    createdAt: "2026-06-18T09:00:00.000Z",
    reviewedAt: "2026-06-18T10:00:00.000Z",
  },
  {
    id: "PAY-002",
    amountUsd: 5.99,
    referenceNumber: "WASIL-ALSHIFA-002",
    notes: "Pending verification",
    status: "pending_verification",
    createdAt: "2026-07-10T09:00:00.000Z",
  },
];

export const demoMerchantBilling: MerchantBilling = {
  storeId: "al-shifa",
  currentPlanId: "pro",
  planStartedAt: "2026-01-01",
  currentPeriodStart: "2026-06-19",
  currentPeriodEnd: "2026-07-19",
  autoRenew: true,
  lifetimePaidUsd: 49.96,
  paidThisMonthUsd: 0,
  pendingVerificationUsd: 5.99,
  restrictionActive: false,
};

export const adminStores = [
  {
    storeId: "al-shifa",
    name: "Al-Shifa Pharmacy",
    planId: "pro" as PlanId,
    outstandingBalanceUsd: 5.99,
    completedOrders: 12,
    transactionFeesUsd: 3.0,
    subscriptionFeeUsd: 2.99,
    totalDueUsd: 5.99,
    status: "unpaid" as PaymentStatus,
    lastPaymentAt: "2026-06-18T10:00:00.000Z",
  },
  {
    storeId: "moda",
    name: "Moda Fashion",
    planId: "business" as PlanId,
    outstandingBalanceUsd: 0,
    completedOrders: 24,
    transactionFeesUsd: 6.0,
    subscriptionFeeUsd: 5.99,
    totalDueUsd: 11.99,
    status: "paid" as PaymentStatus,
    lastPaymentAt: "2026-07-01T10:00:00.000Z",
  },
  {
    storeId: "al-nour",
    name: "Al-Nour Grocery",
    planId: "free" as PlanId,
    outstandingBalanceUsd: 0,
    completedOrders: 56,
    transactionFeesUsd: 14.0,
    subscriptionFeeUsd: 0,
    totalDueUsd: 14.0,
    status: "paid" as PaymentStatus,
    lastPaymentAt: "2026-07-05T10:00:00.000Z",
  },
  {
    storeId: "glow",
    name: "Glow Cosmetics",
    planId: "pro" as PlanId,
    outstandingBalanceUsd: 12.49,
    completedOrders: 8,
    transactionFeesUsd: 2.0,
    subscriptionFeeUsd: 2.99,
    totalDueUsd: 4.99,
    status: "overdue" as PaymentStatus,
    lastPaymentAt: undefined,
  },
];

/* --- Helpers --- */

export function getStore(id?: string) {
  return stores.find((s) => s.id === id);
}

export function getProduct(id?: string) {
  return products.find((p) => p.id === id);
}

export function productsByStore(storeId?: string) {
  return products.filter((p) => p.storeId === storeId);
}

export function formatSAR(n: number) {
  return `${n.toLocaleString("en-US")} SAR`;
}

/** @deprecated Use formatSAR. Kept for screens not yet migrated. */
export const formatYER = formatSAR;

export function formatUsd(n: number) {
  return `$${n.toFixed(2)}`;
}

export function waLink(phone: string, message: string) {
  return `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export type DeliveryEstimate = {
  distanceKm: number;
  fee: number;
  available: boolean;
};

export function estimateDelivery(store: Store, userLat?: number, userLng?: number): DeliveryEstimate {
  if (userLat == null || userLng == null) {
    return { distanceKm: 0, fee: store.deliveryFee, available: true };
  }
  const distanceKm = haversineKm(store.lat, store.lng, userLat, userLng);
  const available = distanceKm <= store.deliveryRadiusKm;
  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    fee: store.deliveryFee,
    available,
  };
}
