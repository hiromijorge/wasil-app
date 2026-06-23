import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type PayoutRow = Database["public"]["Tables"]["payouts"]["Row"];
type StoreRow = Database["public"]["Tables"]["stores"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

export type AdminPayout = PayoutRow & {
  store: Pick<StoreRow, "name"> | null;
  order: Pick<OrderRow, "id"> | null;
};

export function useAdminPayouts() {
  const [data, setData] = useState<AdminPayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: rows, error: supaError } = await supabase
        .from("payouts")
        .select("*, store:stores(name), order:orders(id)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (supaError) throw supaError;
      setData((rows ?? []) as AdminPayout[]);
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
        .from("payouts")
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

  const releaseAll = useCallback(
    async (adminId: string) => {
      const pending = data;
      if (pending.length === 0) return { error: null };

      const results = await Promise.all(
        pending.map((p) => releasePayout(p.id, adminId))
      );
      const firstError = results.find((r) => r.error)?.error ?? null;
      return { error: firstError };
    },
    [data, releasePayout]
  );

  return {
    data,
    isLoading,
    error,
    refresh: fetch,
    releasePayout,
    releaseAll,
  };
}
