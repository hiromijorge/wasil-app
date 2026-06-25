import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth-context";
import type { Database } from "../lib/database.types";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

export type CustomerOrder = {
  id: string;
  storeId: string;
  storeName: string | null;
  status: OrderRow["status"];
  total: number;
  createdAt: string;
  paymentStatus: OrderRow["customer_payment_status"];
  paymentMethod: OrderRow["payment_method"];
};

export function useCustomerOrders() {
  const { user } = useAuth();

  return useQuery<CustomerOrder[], Error>({
    queryKey: ["customer-orders", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: rows, error } = await supabase
        .from("orders")
        .select("*, stores(name)")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (rows as (OrderRow & { stores?: { name: string } | null })[]).map(
        (row) => ({
          id: row.id,
          storeId: row.store_id,
          storeName: row.stores?.name ?? null,
          status: row.status,
          total: Number(row.total),
          createdAt: row.created_at,
          paymentStatus: row.customer_payment_status,
          paymentMethod: row.payment_method,
        }),
      );
    },
  });
}
