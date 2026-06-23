import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type DriverPayoutRow = Database["public"]["Tables"]["driver_payouts"]["Row"];
type DriverRow = Database["public"]["Tables"]["drivers"]["Row"];

export type AdminDriverPayout = DriverPayoutRow & {
  driver: Pick<DriverRow, "full_name"> | null;
};

export function useAdminDriverPayouts() {
  const [data, setData] = useState<AdminDriverPayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: rows, error: supaError } = await supabase
        .from("driver_payouts")
        .select("*, driver:drivers(full_name)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (supaError) throw supaError;
      setData((rows ?? []) as AdminDriverPayout[]);
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

  const releasePayout = useCallback(
    async (id: string, adminId: string) => {
      const { error: updateError } = await supabase
        .from("driver_payouts")
        .update({
          status: "released",
          released_at: new Date().toISOString(),
          released_by: adminId,
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
    releasePayout,
  };
}
