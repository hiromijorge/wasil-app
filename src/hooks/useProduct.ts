import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { products as demoProducts, type Product } from "../lib/demo-data";
import type { Database } from "../lib/database.types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

const demoProductMap = new Map(demoProducts.map((p) => [p.id, p]));

function mapProduct(row: ProductRow): Product {
  const fallback = demoProductMap.get(row.id);
  const images = Array.isArray(row.images) ? (row.images as string[]) : [];
  const firstImage = images[0];

  return {
    id: row.id,
    name: row.name,
    price: row.price,
    storeId: row.store_id,
    description: row.description ?? fallback?.description,
    image: firstImage ? { uri: firstImage } : fallback?.image ?? null,
    imageName: firstImage ? "" : fallback?.imageName ?? "",
  };
}

export function useProduct(id?: string) {
  return useQuery<Product | null, Error>({
    queryKey: ["product", id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const { data: row, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!row) {
        const fallback = demoProductMap.get(id);
        return fallback ?? null;
      }
      return mapProduct(row as ProductRow);
    },
  });
}
