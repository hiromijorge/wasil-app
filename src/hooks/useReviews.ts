import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
type ReviewUpdate = Database["public"]["Tables"]["reviews"]["Update"];

export function useStoreReviews(storeId?: string) {
  return useQuery<ReviewRow[], Error>({
    queryKey: ["reviews", "store", storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from("reviews")
        .select("*, customer:customer_id(full_name, avatar_url)")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!storeId,
  });
}

export function useOrderReview(orderId?: string) {
  return useQuery<ReviewRow | null, Error>({
    queryKey: ["reviews", "order", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation<ReviewRow, Error, ReviewInsert>({
    mutationFn: async (values) => {
      const { data, error } = await supabase.from("reviews").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", "store", data.store_id] });
      queryClient.invalidateQueries({ queryKey: ["reviews", "order", data.order_id] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  return useMutation<ReviewRow, Error, { id: string; updates: ReviewUpdate }>({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from("reviews")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["reviews", "store", data.store_id] });
      queryClient.invalidateQueries({ queryKey: ["reviews", "order", data.order_id] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}
