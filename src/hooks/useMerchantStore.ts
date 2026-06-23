import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth-context";
import { stores as demoStores, demoMerchantStoreId } from "../lib/demo-data";
import type { Database } from "../lib/database.types";

type StoreRow = Database["public"]["Tables"]["stores"]["Row"];

export function useMerchantStore() {
  const { user, demo } = useAuth();
  const [data, setData] = useState<StoreRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (demo) {
      const demo = demoStores.find((s) => s.id === demoMerchantStoreId);
      // Map demo store shape to DB row shape loosely
      setData(
        demo
          ? ({
              id: demo.id,
              owner_id: user?.id ?? "demo-user-id" as string,
              name: demo.name,
              category: demo.category,
              category_emoji: demo.categoryEmoji,
              location: demo.location,
              whatsapp: demo.whatsapp,
              hours: demo.hours,
              open: demo.open,
              image: null,
              accent: demo.accent,
              rating: demo.rating,
              reviews: demo.reviews,
              lat: demo.lat,
              lng: demo.lng,
              delivery_radius_km: demo.deliveryRadiusKm,
              delivery_fee: demo.deliveryFee,
              delivery_available: true,
              pickup_available: true,
              plan_id: "pro",
              restriction_active: false,
              restriction_reason: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as StoreRow)
          : null
      );
      setIsLoading(false);
      return;
    }

    if (!user) {
      setIsLoading(false);
      return;
    }

    async function load() {
      setIsLoading(true);
      const { data: rows, error } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user?.id)
        .limit(1);

      if (!error && rows && rows.length > 0) {
        setData(rows[0] as StoreRow);
      }
      setIsLoading(false);
    }

    load();
  }, [user?.id, demo]);

  return { data, isLoading };
}
