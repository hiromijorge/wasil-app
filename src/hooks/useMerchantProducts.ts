import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

export function useMerchantProducts(storeId?: string) {
  return useQuery<ProductRow[], Error>({
    queryKey: ["merchant-products", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!storeId,
  });
}
