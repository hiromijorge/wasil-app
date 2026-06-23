import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type DriverRow = Database["public"]["Tables"]["drivers"]["Row"];

export function useAdminDrivers() {
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from("drivers").select("*").order("created_at", { ascending: false });
    if (!error && data) setDrivers(data as DriverRow[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateStatus = useCallback(
    async (id: string, status: Database["public"]["Tables"]["drivers"]["Row"]["status"]) => {
      const { error } = await supabase.from("drivers").update({ status }).eq("id", id);
      if (!error) await refresh();
    },
    [refresh]
  );

  return { drivers, isLoading, refresh, updateStatus };
}
