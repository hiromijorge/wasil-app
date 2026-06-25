import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { stores as demoStores, type Store } from "../lib/demo-data";
import type { Database } from "../lib/database.types";

type StoreRow = Database["public"]["Tables"]["stores"]["Row"];

const demoStoreMap = new Map(demoStores.map((s) => [s.id, s]));

function mapStore(row: StoreRow): Store {
  const fallback = demoStoreMap.get(row.id);
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? fallback?.category ?? "",
    categoryEmoji: row.category_emoji ?? fallback?.categoryEmoji ?? "",
    location: row.location ?? fallback?.location ?? "",
    whatsapp: row.whatsapp ?? fallback?.whatsapp ?? "",
    hours: row.hours ?? fallback?.hours ?? "",
    open: row.open ?? fallback?.open ?? false,
    image: row.image ? { uri: row.image } : fallback?.image ?? null,
    imageName: row.image ?? fallback?.imageName ?? "",
    accent: row.accent ?? fallback?.accent ?? "#005b57",
    rating: row.rating ?? fallback?.rating ?? 0,
    reviews: row.reviews ?? fallback?.reviews ?? 0,
    isDemo: row.is_demo ?? fallback?.isDemo ?? false,
    lat: row.lat ?? fallback?.lat ?? 0,
    lng: row.lng ?? fallback?.lng ?? 0,
    deliveryRadiusKm: row.delivery_radius_km ?? fallback?.deliveryRadiusKm ?? 0,
    deliveryFee: row.delivery_fee ?? fallback?.deliveryFee ?? 0,
  };
}

interface UseStoresOptions {
  category?: string;
  openOnly?: boolean;
  query?: string;
}

export function useStores(options: UseStoresOptions = {}) {
  const { category, openOnly, query } = options;

  return useQuery<Store[], Error>({
    queryKey: ["stores", { category, openOnly, query }],
    queryFn: async () => {
      let sb = supabase
        .from("stores")
        .select("*")
        .eq("restriction_active", false)
        .order("open", { ascending: false })
        .order("rating", { ascending: false });

      if (category && category !== "all") {
        sb = sb.eq("category", category);
      }

      if (openOnly) {
        sb = sb.eq("open", true);
      }

      if (query?.trim()) {
        const q = `%${query.trim()}%`;
        sb = sb.or(`name.ilike.${q}, category.ilike.${q}, location.ilike.${q}`);
      }

      const { data: rows, error } = await sb;

      if (error) throw error;
      if (!rows || rows.length === 0) return demoStores;
      return (rows as StoreRow[]).map(mapStore);
    },
  });
}
