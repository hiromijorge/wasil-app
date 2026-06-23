export type PlanId = "free" | "pro" | "business";

export type SubscriptionPlan = {
  id: PlanId;
  name: string;
  priceUsd: number;
  maxProducts: number;
  maxPhotosPerProduct: number;
  features: string[];
  badge?: string;
};

export const PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    priceUsd: 0,
    maxProducts: 30,
    maxPhotosPerProduct: 1,
    features: [
      "30 products maximum",
      "1 photo per product",
      "Basic storefront",
      "WhatsApp ordering",
      "Basic analytics",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceUsd: 2.99,
    maxProducts: 200,
    maxPhotosPerProduct: 3,
    features: [
      "200 products maximum",
      "3 photos per product",
      "Verified Merchant badge",
      "Priority search placement",
      "Advanced analytics",
    ],
    badge: "Verified",
  },
  {
    id: "business",
    name: "Business",
    priceUsd: 5.99,
    maxProducts: 1000,
    maxPhotosPerProduct: 5,
    features: [
      "1000 products maximum",
      "5 photos per product",
      "Homepage featured placement",
      "Delivery management access",
      "Team accounts",
      "Premium analytics",
    ],
    badge: "Featured",
  },
];

export type PaymentStatus = "paid" | "pending_verification" | "unpaid" | "overdue";

export type BillingPeriod = {
  id: string;
  period: string;
  ordersCount: number;
  subscriptionFeeUsd: number;
  transactionFeeUsd: number;
  totalDueUsd: number;
  status: PaymentStatus;
  paidAt?: string;
};

export type BillingDashboard = {
  storeId: string;
  storeName: string;
  currentPlanId: PlanId;
  renewalDate: string;
  billingCycle: string;
  completedOrders: number;
  transactionFeesUsd: number;
  subscriptionChargesUsd: number;
  outstandingBalanceUsd: number;
  dueDate: string;
  status: PaymentStatus;
  history: BillingPeriod[];
  pendingVerificationUsd?: number;
};

export function getPlan(planId: PlanId): SubscriptionPlan {
  return PLANS.find((p) => p.id === planId) ?? PLANS[0];
}

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function getMerchantBilling(): BillingDashboard {
  // Mock data for UI development. Replace with Supabase query.
  return {
    storeId: "al-shifa",
    storeName: "Al-Shifa Pharmacy",
    currentPlanId: "pro",
    renewalDate: "2026-07-19",
    billingCycle: "Jun 19 - Jul 19, 2026",
    completedOrders: 42,
    transactionFeesUsd: 10.5,
    subscriptionChargesUsd: 2.99,
    outstandingBalanceUsd: 13.49,
    dueDate: "2026-07-19",
    status: "unpaid",
    history: [
      {
        id: "PER-1",
        period: "May 19 - Jun 19, 2026",
        ordersCount: 38,
        subscriptionFeeUsd: 2.99,
        transactionFeeUsd: 9.5,
        totalDueUsd: 12.49,
        status: "paid",
        paidAt: "2026-06-18",
      },
      {
        id: "PER-2",
        period: "Apr 19 - May 19, 2026",
        ordersCount: 24,
        subscriptionFeeUsd: 2.99,
        transactionFeeUsd: 6.0,
        totalDueUsd: 8.99,
        status: "paid",
        paidAt: "2026-05-17",
      },
      {
        id: "PER-3",
        period: "Mar 19 - Apr 19, 2026",
        ordersCount: 31,
        subscriptionFeeUsd: 2.99,
        transactionFeeUsd: 7.75,
        totalDueUsd: 10.74,
        status: "overdue",
      },
    ],
  };
}
