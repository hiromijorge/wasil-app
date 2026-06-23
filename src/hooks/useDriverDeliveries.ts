import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type DeliveryRow = Database["public"]["Tables"]["deliveries"]["Row"];
type DeliveryStatus = DeliveryRow["status"];

export function useDriverDeliveries(driverId?: string) {
  const [data, setData] = useState<DeliveryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!driverId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data: rows, error } = await supabase
      .from("deliveries")
      .select("*")
      .or(
        `driver_id.eq.${driverId},and(driver_id.is.null,status.eq.assigned)`
      )
      .order("created_at", { ascending: false });

    if (!error && rows) {
      setData(rows as DeliveryRow[]);
    }
    setIsLoading(false);
  }, [driverId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateStatus = useCallback(
    async (deliveryId: string, status: DeliveryStatus, proofUrl?: string) => {
      const now = new Date().toISOString();
      const update: Record<string, any> = { status };
      if (status === "accepted") update.accepted_at = now;
      if (status === "picked_up") update.picked_up_at = now;
      if (status === "on_the_way") update.on_the_way_at = now;
      if (status === "delivered") update.delivered_at = now;
      if (proofUrl) update.proof_photo_url = proofUrl;
      const { error } = await supabase.from("deliveries").update(update).eq("id", deliveryId);
      if (!error) await refresh();
      return { error };
    },
    [refresh]
  );

  const acceptDelivery = useCallback(
    async (deliveryId: string, driverId: string) => {
      const { error } = await supabase
        .from("deliveries")
        .update({
          driver_id: driverId,
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", deliveryId);
      if (!error) await refresh();
      return { error };
    },
    [refresh]
  );

  return { data, isLoading, refresh, updateStatus, acceptDelivery };
}
