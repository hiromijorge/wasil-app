import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type DriverPayoutRequestRow = Database["public"]["Tables"]["driver_payout_requests"]["Row"];

export function useDriverPayoutRequests(driverId: string | undefined) {
  return useQuery({
    queryKey: ["driver-payout-requests", driverId],
    queryFn: async () => {
      if (!driverId) return [];
      const { data, error } = await supabase
        .from("driver_payout_requests")
        .select("*")
        .eq("driver_id", driverId)
        .order("requested_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DriverPayoutRequestRow[];
    },
    enabled: !!driverId,
  });
}

export function useDriverAvailableBalance(driverId: string | undefined) {
  return useQuery({
    queryKey: ["driver-balance", driverId],
    queryFn: async () => {
      if (!driverId) return 0;
      const { data, error } = await supabase.rpc("driver_available_balance", {
        p_driver_id: driverId,
      });
      if (error) throw error;
      return Number(data ?? 0);
    },
    enabled: !!driverId,
  });
}

interface RequestDriverPayoutInput {
  driverId: string;
  amountSar: number;
  paymentMethod?: string;
  paymentDetails?: Record<string, unknown>;
}

export function useRequestDriverPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RequestDriverPayoutInput) => {
      const { data, error } = await supabase.rpc("request_driver_payout", {
        p_driver_id: input.driverId,
        p_amount_sar: input.amountSar,
        p_payment_method: input.paymentMethod ?? "bank_transfer",
        p_payment_details: input.paymentDetails ?? {},
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: ["driver-payout-requests", input.driverId] });
      queryClient.invalidateQueries({ queryKey: ["driver-balance", input.driverId] });
      queryClient.invalidateQueries({ queryKey: ["driver-payouts"] });
    },
  });
}

export function useAllDriverPayoutRequests() {
  return useQuery({
    queryKey: ["driver-payout-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("driver_payout_requests")
        .select(
          "*, driver:profiles!driver_payout_requests_driver_id_fkey(full_name, email, phone, payout_details)"
        )
        .order("requested_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as (DriverPayoutRequestRow & {
        driver: {
          full_name: string | null;
          email: string | null;
          phone: string | null;
          payout_details: Record<string, unknown> | null;
        } | null;
      })[];
    },
  });
}

export function useProcessDriverPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      requestId: string;
      status: "approved" | "rejected" | "paid";
      processedBy: string;
      notes?: string;
    }) => {
      const { error } = await supabase.rpc("process_driver_payout", {
        p_request_id: input.requestId,
        p_status: input.status,
        p_processed_by: input.processedBy,
        p_notes: input.notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-payout-requests"] });
      queryClient.invalidateQueries({ queryKey: ["driver-balance"] });
      queryClient.invalidateQueries({ queryKey: ["driver-payouts"] });
    },
  });
}
