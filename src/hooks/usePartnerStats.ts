import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth-context";
import type { Database } from "../lib/database.types";

type ReferralRow = Database["public"]["Tables"]["referrals"]["Row"];
type CommissionRow = Database["public"]["Tables"]["commissions"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export function usePartnerStats() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [merchantProfiles, setMerchantProfiles] = useState<Record<string, ProfileRow>>({});
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const [refRes, comRes] = await Promise.all([
      supabase.from("referrals").select("*").eq("referrer_id", user.id).order("created_at", { ascending: false }),
      supabase
        .from("commissions")
        .select("*, referrals!inner(referrer_id)")
        .eq("referrals.referrer_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    if (!refRes.error && refRes.data) setReferrals(refRes.data as ReferralRow[]);
    if (!comRes.error && comRes.data) setCommissions(comRes.data as CommissionRow[]);

    const merchantIds = (refRes.data ?? [])
      .map((r) => r.referred_merchant_id)
      .filter(Boolean);
    if (merchantIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", merchantIds);
      const map: Record<string, ProfileRow> = {};
      profiles?.forEach((p) => {
        map[p.id] = p;
      });
      setMerchantProfiles(map);
    }
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const totalEarned = commissions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + Number(c.amount_sar), 0);
  const pending = commissions
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + Number(c.amount_sar), 0);

  return { referrals, commissions, merchantProfiles, totalEarned, pending, isLoading, refresh };
}
