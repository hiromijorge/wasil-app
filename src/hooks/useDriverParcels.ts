import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type ParcelRow = Database["public"]["Tables"]["parcel_deliveries"]["Row"];
type ParcelStatus = ParcelRow["status"];

export function useDriverParcels(driverId?: string) {
  const [data, setData] = useState<ParcelRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!driverId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data: rows, error } = await supabase
      .from("parcel_deliveries")
      .select("*")
      .or(
        `driver_id.eq.${driverId},and(driver_id.is.null,status.eq.pending,payment_status.eq.verified)`
      )
      .order("created_at", { ascending: false });

    if (!error && rows) setData(rows as ParcelRow[]);
    setIsLoading(false);
  }, [driverId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateStatus = useCallback(
    async (parcelId: string, status: ParcelStatus, proofUrl?: string) => {
      const now = new Date().toISOString();
      const update: Record<string, any> = { status };
      if (status === "accepted") update.accepted_at = now;
      if (status === "picked_up") update.picked_up_at = now;
      if (status === "on_the_way") update.on_the_way_at = now;
      if (status === "delivered") update.delivered_at = now;
      if (proofUrl) update.delivery_proof_url = proofUrl;

      const { error } = await supabase
        .from("parcel_deliveries")
        .update(update)
        .eq("id", parcelId);
      if (!error) await refresh();
      return { error };
    },
    [refresh]
  );

  const acceptParcel = useCallback(
    async (parcelId: string, driverId: string) => {
      const { error } = await supabase
        .from("parcel_deliveries")
        .update({
          driver_id: driverId,
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", parcelId);
      if (!error) await refresh();
      return { error };
    },
    [refresh]
  );

  return { data, isLoading, refresh, updateStatus, acceptParcel };
}
