import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type ParcelRow = Database["public"]["Tables"]["parcel_deliveries"]["Row"];

export function useParcel(id: string | undefined) {
  const [data, setData] = useState<ParcelRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchParcel = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const { data: row, error: err } = await supabase
      .from("parcel_deliveries")
      .select("*")
      .eq("id", id)
      .single();

    if (err) {
      setError(err);
    } else {
      setData(row as ParcelRow);
      setError(null);
    }
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    fetchParcel();
  }, [fetchParcel]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`parcel-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "parcel_deliveries",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setData(payload.new as ParcelRow);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  return { data, isLoading, error, refresh: fetchParcel };
}
