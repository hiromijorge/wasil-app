import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type MerchantPayoutRequestRow = Database["public"]["Tables"]["merchant_payout_requests"]["Row"];

export function useMerchantPayoutRequests(merchantId: string | undefined) {
  return useQuery({
    queryKey: ["merchant-payout-requests", merchantId],
    queryFn: async () => {
      if (!merchantId) return [];
      const { data, error } = await supabase
        .from("merchant_payout_requests")
        .select("*")
        .eq("merchant_id", merchantId)
        .order("requested_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MerchantPayoutRequestRow[];
    },
    enabled: !!merchantId,
  });
}

export function useMerchantAvailableBalance(merchantId: string | undefined) {
  return useQuery({
    queryKey: ["merchant-balance", merchantId],
    queryFn: async () => {
      if (!merchantId) return 0;
      const { data, error } = await supabase.rpc("merchant_available_balance", {
        p_merchant_id: merchantId,
      });
      if (error) throw error;
      return Number(data ?? 0);
    },
    enabled: !!merchantId,
  });
}

interface RequestMerchantPayoutInput {
  merchantId: string;
  amountSar: number;
  paymentMethod?: string;
  paymentDetails?: Record<string, unknown>;
  storeId?: string;
}

export function useRequestMerchantPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RequestMerchantPayoutInput) => {
      const { data, error } = await supabase.rpc("request_merchant_payout", {
        p_merchant_id: input.merchantId,
        p_amount_sar: input.amountSar,
        p_payment_method: input.paymentMethod ?? "bank_transfer",
        p_payment_details: input.paymentDetails ?? {},
        p_store_id: input.storeId ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: ["merchant-payout-requests", input.merchantId] });
      queryClient.invalidateQueries({ queryKey: ["merchant-balance", input.merchantId] });
      queryClient.invalidateQueries({ queryKey: ["merchant-payouts"] });
    },
  });
}

export function useAllMerchantPayoutRequests() {
  return useQuery({
    queryKey: ["merchant-payout-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("merchant_payout_requests")
        .select(
          "*, merchant:profiles!merchant_payout_requests_merchant_id_fkey(full_name, email, phone, payout_details)"
        )
        .order("requested_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as (MerchantPayoutRequestRow & {
        merchant: {
          full_name: string | null;
          email: string | null;
          phone: string | null;
          payout_details: Record<string, unknown> | null;
        } | null;
      })[];
    },
  });
}

export function useProcessMerchantPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      requestId: string;
      status: "approved" | "rejected" | "paid";
      processedBy: string;
      notes?: string;
    }) => {
      const { error } = await supabase.rpc("process_merchant_payout", {
        p_request_id: input.requestId,
        p_status: input.status,
        p_processed_by: input.processedBy,
        p_notes: input.notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant-payout-requests"] });
      queryClient.invalidateQueries({ queryKey: ["merchant-balance"] });
      queryClient.invalidateQueries({ queryKey: ["merchant-payouts"] });
    },
  });
}
