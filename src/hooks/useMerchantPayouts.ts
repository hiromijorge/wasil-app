import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type PayoutRow = Database["public"]["Tables"]["payouts"]["Row"];

export function useMerchantPayouts(storeId?: string) {
  const [data, setData] = useState<PayoutRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!storeId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data: rows, error } = await supabase
      .from("payouts")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (!error && rows) {
      setData(rows as PayoutRow[]);
    }
    setIsLoading(false);
  }, [storeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, isLoading, refresh };
}
