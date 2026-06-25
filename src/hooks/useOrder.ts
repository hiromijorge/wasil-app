import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth-context";
import type { Database } from "../lib/database.types";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

export type OrderWithStore = OrderRow & {
  stores: { name: string; image: string | null; whatsapp: string } | null;
};

export function useOrder(orderId: string | undefined) {
  const { user } = useAuth();

  return useQuery<OrderWithStore | null, Error>({
    queryKey: ["order", orderId, user?.id],
    enabled: !!orderId && !!user?.id,
    queryFn: async () => {
      if (!orderId || !user?.id) return null;
      const { data, error } = await supabase
        .from("orders")
        .select("*, stores(name, image, whatsapp)")
        .eq("id", orderId)
        .eq("customer_id", user.id)
        .single();

      if (error) throw error;
      return data as OrderWithStore | null;
    },
  });
}
