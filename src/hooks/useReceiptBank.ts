import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type BankAccount = Database["public"]["Tables"]["bank_accounts"]["Row"];

export function useReceiptBank() {
  return useQuery<BankAccount | null, Error>({
    queryKey: ["receipt-bank"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("for_receipts", true)
        .eq("is_default", true)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as BankAccount | null;
    },
  });
}
