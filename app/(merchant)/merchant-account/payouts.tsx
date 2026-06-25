import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Wallet } from "lucide-react-native";
import { useAuth } from "../../../src/lib/auth-context";
import { useMerchantPayouts } from "../../../src/hooks/useMerchantPayouts";
import {
  useMerchantAvailableBalance,
  useMerchantPayoutRequests,
  useRequestMerchantPayout,
} from "../../../src/hooks/useMerchantPayoutRequests";
import { usePlatformConfig } from "../../../src/hooks/usePlatformConfig";
import { useMerchantStore } from "../../../src/hooks/useMerchantStore";
import { formatSAR } from "../../../src/lib/format";
import { useTranslation } from "../../../src/lib/i18n";
import { supabase } from "../../../src/lib/supabase";
import { palette, fonts, spacing, shadows } from "../../../src/lib/theme";
import { PayoutPanel, type PayoutRequestItem } from "../../../src/components/PayoutPanel";
import { merchantStyles, timeAgo, type PayoutRow } from "../_components";

export default function MerchantPayoutsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { data: store } = useMerchantStore();
  const { data: payouts, isLoading: payoutsLoading } = useMerchantPayouts(store?.id);
  const { data: merchantBalance } = useMerchantAvailableBalance(profile?.id);
  const { data: merchantPayoutRequests, refetch: refetchMerchantPayoutRequests } =
    useMerchantPayoutRequests(profile?.id);
  const requestMerchantPayout = useRequestMerchantPayout();
  const { data: platformConfig } = usePlatformConfig();

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color={palette.foreground} />
        </Pressable>
        <Text style={styles.title}>{t("payoutsTab")}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {payoutsLoading ? (
          <ActivityIndicator color={palette.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={merchantStyles.tabContent}>
            <View style={[merchantStyles.card, shadows.card, { marginBottom: spacing.md }]}>
              <View style={styles.row}>
                <Wallet size={18} color={palette.primary} />
                <Text style={merchantStyles.cardTitle}>{t("pendingBalance")}</Text>
              </View>
              <Text style={merchantStyles.bigAmount}>
                {formatSAR(
                  payouts
                    .filter((p) => p.status === "pending")
                    .reduce((s, p) => s + Number(p.net_sar), 0),
                )}
              </Text>
            </View>

            <Text style={[merchantStyles.sectionTitle, { marginTop: spacing.lg }]}>
              {t("released")}
            </Text>
            {payouts.filter((p) => p.status === "released").length === 0 && (
              <Text style={merchantStyles.emptyText}>{t("noReleasedPayouts")}</Text>
            )}
            {payouts
              .filter((p) => p.status === "released")
              .map((p) => (
                <View
                  key={p.id}
                  style={[merchantStyles.orderCard, shadows.card, { opacity: 0.7 }]}
                >
                  <View style={merchantStyles.orderRow}>
                    <Text style={merchantStyles.orderId}>
                      {p.id.slice(-6).toUpperCase()}
                    </Text>
                    <Text style={merchantStyles.orderTotal}>
                      {formatSAR(Number(p.net_sar))}
                    </Text>
                  </View>
                  <Text style={merchantStyles.orderMetaText}>
                    {t("released")} {p.released_at ? timeAgo(p.released_at) : ""}
                  </Text>
                </View>
              ))}

            <View style={{ marginTop: spacing.lg }}>
              <PayoutPanel
                availableBalance={merchantBalance ?? 0}
                minPayout={platformConfig?.min_merchant_payout_sar ?? 25}
                requests={
                  (merchantPayoutRequests ?? []) as PayoutRequestItem[]
                }
                savedDetails={
                  profile?.payout_details as Record<string, unknown> | null
                }
                onRequest={async (amount, details) => {
                  if (!profile?.id) return;
                  await requestMerchantPayout.mutateAsync({
                    merchantId: profile.id,
                    amountSar: amount,
                    paymentMethod: "bank_transfer",
                    paymentDetails: details,
                    storeId: store?.id,
                  });
                  refetchMerchantPayoutRequests();
                }}
                onSaveDetails={(details) => {
                  if (!profile?.id) return;
                  supabase
                    .from("profiles")
                    .update({ payout_details: details })
                    .eq("id", profile.id)
                    .then(({ error }) => {
                      if (error) console.error(error);
                    });
                }}
                loading={false}
                requestLoading={requestMerchantPayout.isPending}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: palette.card,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: palette.foreground,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
