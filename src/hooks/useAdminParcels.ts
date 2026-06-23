import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type ParcelRow = Database["public"]["Tables"]["parcel_deliveries"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type AdminParcel = ParcelRow & {
  sender: Pick<ProfileRow, "full_name"> | null;
};

export function useAdminParcels() {
  const [data, setData] = useState<AdminParcel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const { data: rows, error } = await supabase
      .from("parcel_deliveries")
      .select("*, sender:profiles(full_name)")
      .eq("payment_status", "pending")
      .order("created_at", { ascending: false });

    if (!error && rows) setData(rows as AdminParcel[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const verifyPayment = useCallback(
    async (id: string, adminId: string) => {
      const { error } = await supabase
        .from("parcel_deliveries")
        .update({ payment_status: "verified" })
        .eq("id", id);
      if (!error) await refresh();
      return { error };
    },
    [refresh]
  );

  const rejectPayment = useCallback(
    async (id: string, adminId: string) => {
      const { error } = await supabase
        .from("parcel_deliveries")
        .update({ payment_status: "rejected" })
        .eq("id", id);
      if (!error) await refresh();
      return { error };
    },
    [refresh]
  );

  return { data, isLoading, refresh, verifyPayment, rejectPayment };
}
