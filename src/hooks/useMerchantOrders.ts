import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderStatus = OrderRow["status"];

export function useMerchantOrders(storeId?: string) {
  const [data, setData] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!storeId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data: rows, error } = await supabase
      .from("orders")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (!error && rows) {
      setData(rows as OrderRow[]);
    }
    setIsLoading(false);
  }, [storeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", orderId);
      if (!error) await refresh();
      return { error };
    },
    [refresh]
  );

  const assignDriver = useCallback(
    async (orderId: string, driverInfo: string) => {
      const { error } = await supabase
        .from("orders")
        .update({ notes: driverInfo })
        .eq("id", orderId);
      if (!error) await refresh();
      return { error };
    },
    [refresh]
  );

  return { data, isLoading, refresh, updateStatus, assignDriver };
}
