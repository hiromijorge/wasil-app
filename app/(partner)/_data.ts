import { useAuth } from "../../src/lib/auth-context";
import { usePartnerStats } from "../../src/hooks/usePartnerStats";
import { usePlatformConfig } from "../../src/hooks/usePlatformConfig";
import {
  usePartnerPayoutRequests,
  usePartnerAvailableBalance,
  useRequestPartnerPayout,
} from "../../src/hooks/usePartnerPayouts";

export function usePartnerData() {
  const { profile, signOut } = useAuth();
  const {
    referrals,
    commissions,
    merchantProfiles,
    totalEarned,
    pending,
    isLoading,
    refresh,
  } = usePartnerStats();
  const { data: config } = usePlatformConfig();
  const { data: balance } = usePartnerAvailableBalance(profile?.id);
  const { data: payoutRequests, refetch: refetchPayouts } = usePartnerPayoutRequests(
    profile?.id,
  );
  const requestPayout = useRequestPartnerPayout();

  return {
    profile,
    signOut,
    referrals,
    commissions,
    merchantProfiles,
    totalEarned,
    pending,
    isLoading,
    refreshStats: refresh,
    config,
    balance: balance ?? 0,
    payoutRequests,
    refetchPayouts,
    requestPayout,
    partnerPercent: config?.partner_commission_percent ?? 10,
    minPayout: config?.min_partner_payout_sar ?? 25,
    referralCode: profile?.referral_code ?? "-",
  };
}
