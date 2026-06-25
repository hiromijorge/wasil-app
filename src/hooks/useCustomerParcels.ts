import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth-context";
import type { Database } from "../lib/database.types";

export type ParcelRow = Database["public"]["Tables"]["parcel_deliveries"]["Row"];

export function useCustomerParcels() {
  const { user } = useAuth();
  const [data, setData] = useState<ParcelRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data: rows, error } = await supabase
      .from("parcel_deliveries")
      .select("*")
      .eq("sender_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && rows) setData(rows as ParcelRow[]);
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const uploadReceipt = useCallback(
    async (parcelId: string, url: string) => {
      const { error } = await supabase
        .from("parcel_deliveries")
        .update({ payment_receipt_url: url })
        .eq("id", parcelId);
      if (!error) await refresh();
      return { error };
    },
    [refresh]
  );

  return { data, isLoading, refresh, uploadReceipt };
}
