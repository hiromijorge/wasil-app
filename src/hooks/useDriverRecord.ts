import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth-context";
import type { Database } from "../lib/database.types";

type DriverRow = Database["public"]["Tables"]["drivers"]["Row"];

export function useDriverRecord() {
  const { user } = useAuth();
  const [data, setData] = useState<DriverRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data: rows, error } = await supabase
      .from("drivers")
      .select("*")
      .eq("user_id", user.id)
      .limit(1);

    if (!error && rows && rows.length > 0) {
      setData(rows[0] as DriverRow);
    } else {
      setData(null);
    }
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, isLoading, refresh };
}
