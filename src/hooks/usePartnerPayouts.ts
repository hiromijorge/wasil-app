import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type PayoutRequestRow = Database["public"]["Tables"]["partner_payout_requests"]["Row"];

export function usePartnerPayoutRequests(partnerId: string | undefined) {
  return useQuery({
    queryKey: ["partner-payout-requests", partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      const { data, error } = await supabase
        .from("partner_payout_requests")
        .select("*")
        .eq("partner_id", partnerId)
        .order("requested_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PayoutRequestRow[];
    },
    enabled: !!partnerId,
  });
}

export function usePartnerAvailableBalance(partnerId: string | undefined) {
  return useQuery({
    queryKey: ["partner-balance", partnerId],
    queryFn: async () => {
      if (!partnerId) return 0;
      const { data, error } = await supabase.rpc("partner_available_balance", {
        p_partner_id: partnerId,
      });
      if (error) throw error;
      return Number(data ?? 0);
    },
    enabled: !!partnerId,
  });
}

interface RequestPayoutInput {
  partnerId: string;
  amountSar: number;
  paymentMethod?: string;
  paymentDetails?: Record<string, unknown>;
}

export function useRequestPartnerPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RequestPayoutInput) => {
      const { data, error } = await supabase.rpc("request_partner_payout", {
        p_partner_id: input.partnerId,
        p_amount_sar: input.amountSar,
        p_payment_method: input.paymentMethod ?? null,
        p_payment_details: input.paymentDetails ?? {},
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: ["partner-payout-requests", input.partnerId] });
      queryClient.invalidateQueries({ queryKey: ["partner-balance", input.partnerId] });
      queryClient.invalidateQueries({ queryKey: ["partner-stats", input.partnerId] });
    },
  });
}

export function useAllPartnerPayoutRequests() {
  return useQuery({
    queryKey: ["partner-payout-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_payout_requests")
        .select("*, partner:profiles!partner_payout_requests_partner_id_fkey(full_name, email, phone, payout_details)")
        .order("requested_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as (PayoutRequestRow & {
        partner: { full_name: string | null; email: string | null; phone: string | null; payout_details: Record<string, unknown> | null } | null;
      })[];
    },
  });
}

export function useProcessPartnerPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      requestId: string;
      status: "approved" | "rejected" | "paid";
      processedBy: string;
      notes?: string;
    }) => {
      const { error } = await supabase.rpc("process_partner_payout", {
        p_request_id: input.requestId,
        p_status: input.status,
        p_processed_by: input.processedBy,
        p_notes: input.notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-payout-requests"] });
      queryClient.invalidateQueries({ queryKey: ["partner-balance"] });
      queryClient.invalidateQueries({ queryKey: ["partner-stats"] });
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
    },
  });
}
