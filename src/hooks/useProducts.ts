import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { products as demoProducts, type Product } from "../lib/demo-data";
import type { Database } from "../lib/database.types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

const demoProductMap = new Map(demoProducts.map((p) => [p.id, p]));

export type ProductSort = "relevance" | "price_asc" | "price_desc";

function mapProduct(row: ProductRow & { stores?: { name: string } | null }): Product {
  const fallback = demoProductMap.get(row.id);
  const images = Array.isArray(row.images) ? (row.images as string[]) : [];
  const firstImage = images[0];

  return {
    id: row.id,
    name: row.name,
    price: row.price,
    storeId: row.store_id,
    storeName: row.stores?.name ?? fallback?.storeName,
    description: row.description ?? fallback?.description,
    image: firstImage ? { uri: firstImage } : fallback?.image ?? null,
    imageName: firstImage ? "" : fallback?.imageName ?? "",
    isDemo: row.is_demo ?? fallback?.isDemo ?? false,
  };
}

interface UseProductsOptions {
  storeId?: string;
  query?: string;
  sortBy?: ProductSort;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function applyFallback(storeId?: string, query?: string, sortBy: ProductSort = "relevance"): Product[] {
  let fallback = demoProducts;
  if (storeId) fallback = fallback.filter((p) => p.storeId === storeId);
  if (query?.trim()) {
    const q = query.toLowerCase();
    fallback = fallback.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    );
  }
  if (sortBy === "price_asc") {
    fallback = fallback.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price_desc") {
    fallback = fallback.sort((a, b) => b.price - a.price);
  }
  return fallback;
}

export function useProducts(options: UseProductsOptions = {}) {
  const { storeId, query, sortBy = "relevance" } = options;
  const isUuid = storeId ? UUID_RE.test(storeId) : true;

  return useQuery<Product[], Error>({
    queryKey: ["products", { storeId, query, sortBy }],
    queryFn: async () => {
      // If a storeId is provided but isn't a UUID, we are in demo/slug mode.
      // Skip the DB query and return filtered demo data directly.
      if (storeId && !isUuid) {
        return applyFallback(storeId, query, sortBy);
      }

      let sb = supabase.from("products").select("*, stores(name)");

      if (storeId) {
        sb = sb.eq("store_id", storeId);
      }

      if (query?.trim()) {
        const q = `%${query.trim()}%`;
        sb = sb.or(`name.ilike.${q}, description.ilike.${q}`);
      }

      if (sortBy === "price_asc") {
        sb = sb.order("price", { ascending: true });
      } else if (sortBy === "price_desc") {
        sb = sb.order("price", { ascending: false });
      } else {
        sb = sb.order("created_at", { ascending: false });
      }

      const { data: rows, error } = await sb;

      if (error) throw error;
      if (!rows || rows.length === 0) {
        return applyFallback(storeId, query, sortBy);
      }
      return (rows as ProductRow[]).map(mapProduct);
    },
  });
}
