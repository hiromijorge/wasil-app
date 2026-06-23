import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type SubscriptionChargeRow = Database["public"]["Tables"]["subscription_charges"]["Row"];

export type { SubscriptionChargeRow };

export function useAdminBilling() {
  const [charges, setCharges] = useState<SubscriptionChargeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("subscription_charges")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setCharges(data as SubscriptionChargeRow[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateCharge = useCallback(
    async (id: string, status: "paid" | "unpaid", reviewedBy: string) => {
      const update: Record<string, any> = {
        status,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
      };
      if (status === "paid") update.paid_at = new Date().toISOString();
      const { error } = await supabase
        .from("subscription_charges")
        .update(update)
        .eq("id", id);
      if (!error) await refresh();
      return { error };
    },
    [refresh]
  );

  return { charges, isLoading, refresh, updateCharge };
}
