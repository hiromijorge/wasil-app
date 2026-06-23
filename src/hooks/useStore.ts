import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { stores as demoStores, type Store } from "../lib/demo-data";
import { slugify } from "../lib/slugify";
import type { Database } from "../lib/database.types";

type StoreRow = Database["public"]["Tables"]["stores"]["Row"];

const demoStoreMap = new Map(demoStores.map((s) => [s.id, s]));
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    lat: row.lat ?? fallback?.lat ?? 0,
    lng: row.lng ?? fallback?.lng ?? 0,
    deliveryRadiusKm: row.delivery_radius_km ?? fallback?.deliveryRadiusKm ?? 0,
    deliveryFee: row.delivery_fee ?? fallback?.deliveryFee ?? 0,
  };
}

export function useStore(id?: string) {
  return useQuery<Store | null, Error>({
    queryKey: ["store", id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;

      if (UUID_RE.test(id)) {
        const { data: row, error } = await supabase
          .from("stores")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        if (!row) {
          const fallback = demoStoreMap.get(id);
          return fallback ?? null;
        }
        return mapStore(row as StoreRow);
      }

      // Treat id as a URL slug and match by name slug
      const { data: rows, error } = await supabase
        .from("stores")
        .select("*")
        .eq("restriction_active", false);

      if (error) throw error;
      const match = (rows as StoreRow[] | null)?.find(
        (row) => slugify(row.name) === id
      );
      if (match) return mapStore(match);

      // Fallback to demo data slug match
      return demoStores.find((s) => slugify(s.name) === id) ?? null;
    },
  });
}
