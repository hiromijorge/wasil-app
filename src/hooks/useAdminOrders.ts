import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type StoreRow = Database["public"]["Tables"]["stores"]["Row"];

export type AdminOrder = OrderRow & {
  store: Pick<StoreRow, "name"> | null;
};

export function useAdminOrders() {
  const [data, setData] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: rows, error: supaError } = await supabase
        .from("orders")
        .select("*, store:stores(name)")
        .eq("customer_payment_status", "pending")
        .neq("payment_method", "cash")
        .order("created_at", { ascending: false });

      if (supaError) throw supaError;
      setData((rows ?? []) as AdminOrder[]);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const verifyPayment = useCallback(
    async (id: string, adminId: string) => {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          customer_payment_status: "verified",
          status: "paid",
          payment_verified_at: new Date().toISOString(),
          payment_verified_by: adminId,
        })
        .eq("id", id);

      if (updateError) return { error: updateError };
      await fetch();
      return { error: null };
    },
    [fetch]
  );

  const rejectPayment = useCallback(
    async (id: string, adminId: string) => {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          customer_payment_status: "rejected",
          payment_verified_at: new Date().toISOString(),
          payment_verified_by: adminId,
        })
        .eq("id", id);

      if (updateError) return { error: updateError };
      await fetch();
      return { error: null };
    },
    [fetch]
  );

  return {
    data,
    isLoading,
    error,
    refresh: fetch,
    verifyPayment,
    rejectPayment,
  };
}
