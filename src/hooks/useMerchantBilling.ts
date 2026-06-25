import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type StoreRow = Database["public"]["Tables"]["stores"]["Row"];
type SubscriptionChargeRow = Database["public"]["Tables"]["subscription_charges"]["Row"];

export type MerchantBillingData = {
  planId: string;
  storeName: string;
  charges: SubscriptionChargeRow[];
  currentPeriod: SubscriptionChargeRow | null;
  totalPaidSar: number;
  totalOutstandingSar: number;
};

export function useMerchantBilling(store?: StoreRow | null) {
  const storeId = store?.id;

  return useQuery<MerchantBillingData, Error>({
    queryKey: ["merchant-billing", storeId],
    queryFn: async () => {
      if (!storeId) {
        return {
          planId: "free",
          storeName: store?.name ?? "",
          charges: [],
          currentPeriod: null,
          totalPaidSar: 0,
          totalOutstandingSar: 0,
        };
      }

      const { data: charges, error } = await supabase
        .from("subscription_charges")
        .select("*")
        .eq("store_id", storeId)
        .order("period_start", { ascending: false });

      if (error) throw error;

      const rows = charges ?? [];
      const paid = rows.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount_sar, 0);
      const outstanding = rows
        .filter((r) => r.status === "unpaid" || r.status === "overdue")
        .reduce((s, r) => s + r.amount_sar, 0);

      return {
        planId: store?.plan_id ?? "free",
        storeName: store?.name ?? "",
        charges: rows,
        currentPeriod: rows[0] ?? null,
        totalPaidSar: paid,
        totalOutstandingSar: outstanding,
      };
    },
    enabled: !!storeId,
  });
}
