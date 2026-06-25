import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export function useDriverCodBalance(driverId?: string) {
  const [data, setData] = useState<{
    collected: number;
    fee: number;
    unsettled: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!driverId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [{ data: collected }, { data: fee }, { data: unsettled }] = await Promise.all([
        supabase.rpc("driver_cod_collected_sar", { p_driver_id: driverId }),
        supabase.rpc("driver_cod_fee_sar", { p_driver_id: driverId }),
        supabase.rpc("driver_unsettled_cod_balance", { p_driver_id: driverId }),
      ]);
      setData({
        collected: Number(collected ?? 0),
        fee: Number(fee ?? 0),
        unsettled: Number(unsettled ?? 0),
      });
    } finally {
      setIsLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, refresh: fetch };
}
