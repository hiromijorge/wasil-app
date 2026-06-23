import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type ConfigRow = Database["public"]["Tables"]["platform_config"]["Row"];

export function usePlatformConfig() {
  const [data, setData] = useState<ConfigRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: rows, error: supaError } = await supabase
        .from("platform_config")
        .select("*")
        .order("id", { ascending: true })
        .limit(1);

      if (supaError) throw supaError;
      setData((rows?.[0] as ConfigRow) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const updateConfig = useCallback(
    async (updates: Partial<Omit<ConfigRow, "id" | "updated_at">>) => {
      if (!data) return { error: new Error("Config not loaded") };
      const { error: updateError } = await supabase
        .from("platform_config")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", data.id);

      if (updateError) return { error: updateError };
      await fetch();
      return { error: null };
    },
    [data, fetch]
  );

  return {
    data,
    isLoading,
    error,
    refresh: fetch,
    updateConfig,
  };
}
