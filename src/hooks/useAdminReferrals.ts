import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Database } from "../lib/database.types";

type ReferralRow = Database["public"]["Tables"]["referrals"]["Row"];
type CommissionRow = Database["public"]["Tables"]["commissions"]["Row"];

export function useAdminReferrals() {
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const [refRes, comRes] = await Promise.all([
      supabase.from("referrals").select("*").order("created_at", { ascending: false }),
      supabase.from("commissions").select("*").order("created_at", { ascending: false }),
    ]);
    if (!refRes.error && refRes.data) setReferrals(refRes.data as ReferralRow[]);
    if (!comRes.error && comRes.data) setCommissions(comRes.data as CommissionRow[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const payCommission = useCallback(
    async (commissionId: string) => {
      const { error } = await supabase
        .from("commissions")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", commissionId);
      if (!error) await refresh();
      return { error };
    },
    [refresh]
  );

  return { referrals, commissions, isLoading, refresh, payCommission };
}
