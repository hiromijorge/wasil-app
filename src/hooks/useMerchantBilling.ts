import { useMemo } from "react";
import {
  demoMerchantBilling,
  demoBillingPeriods,
  demoPaymentRecords,
  stores as demoStores,
  type MerchantBilling,
  type BillingPeriod,
  type PaymentRecord,
} from "../lib/demo-data";

export type MerchantBillingData = {
  billing: MerchantBilling;
  currentPeriod: BillingPeriod;
  history: BillingPeriod[];
  payments: PaymentRecord[];
  storeName: string;
};

export function useMerchantBilling(storeId?: string) {
  const data = useMemo<MerchantBillingData>(() => {
    const store = demoStores.find((s) => s.id === storeId) ?? demoStores[0];
    const history = [...demoBillingPeriods].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
    return {
      billing: { ...demoMerchantBilling, storeId: store.id, restrictionActive: store.id === "glow" },
      currentPeriod: history[0],
      history,
      payments: demoPaymentRecords,
      storeName: store.name,
    };
  }, [storeId]);

  return { data, isLoading: false, error: null };
}
