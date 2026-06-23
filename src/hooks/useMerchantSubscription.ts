import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type SubscriptionChargeRow = Database["public"]["Tables"]["subscription_charges"]["Row"];

export function useMerchantSubscription(storeId?: string) {
  const [data, setData] = useState<SubscriptionChargeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!storeId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data: rows, error } = await supabase
      .from("subscription_charges")
      .select("*")
      .eq("store_id", storeId)
      .order("period_start", { ascending: false });

    if (!error && rows) {
      setData(rows as SubscriptionChargeRow[]);
    }
    setIsLoading(false);
  }, [storeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, isLoading, refresh };
}
