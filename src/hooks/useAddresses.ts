import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];
type AddressInsert = Database["public"]["Tables"]["addresses"]["Insert"];
type AddressUpdate = Database["public"]["Tables"]["addresses"]["Update"];

export function useAddresses(userId?: string) {
  return useQuery<AddressRow[], Error>({
    queryKey: ["addresses", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation<AddressRow, Error, AddressInsert>({
    mutationFn: async (values) => {
      const { data, error } = await supabase.from("addresses").insert(values).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["addresses", variables.user_id] });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation<AddressRow, Error, { id: string; userId: string; updates: AddressUpdate }>({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from("addresses")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["addresses", variables.userId] });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; userId: string }>({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["addresses", variables.userId] });
    },
  });
}
