import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/lib/auth-context";
import { useDriverRecord } from "../../src/hooks/useDriverRecord";
import {
  useDriverAvailableBalance,
  useDriverPayoutRequests,
  useRequestDriverPayout,
} from "../../src/hooks/useDriverPayoutRequests";
import { usePlatformConfig } from "../../src/hooks/usePlatformConfig";
import { useTranslation } from "../../src/lib/i18n";
import { palette, spacing } from "../../src/lib/theme";
import { DashboardHeader, DashboardPage } from "../../src/components/DashboardLayout";
import { PayoutPanel, type PayoutRequestItem } from "../../src/components/PayoutPanel";
import { styles } from "./components";

export default function DriverPayoutsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { t } = useTranslation();
  const { data: driver, isLoading: driverLoading } = useDriverRecord();
  const { data: driverBalance } = useDriverAvailableBalance(profile?.id);
  const { data: driverPayoutRequests, refetch: refetchDriverPayoutRequests } = useDriverPayoutRequests(profile?.id);
  const requestDriverPayout = useRequestDriverPayout();
  const { data: platformConfig } = usePlatformConfig();

  if (driverLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (!driver) {
    return (
      <View style={[styles.container, styles.center, { padding: spacing.lg }]}>
        <Text style={styles.title}>{t("driverNotFound")}</Text>
        <Text style={styles.subtitle}>{t("driverNotFoundMessage")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DashboardHeader overline={t("driverConsole")} title={t("payouts")} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing.xl,
        }}
      >
        <DashboardPage>
          <PayoutPanel
            availableBalance={driverBalance ?? 0}
            minPayout={platformConfig?.min_driver_payout_sar ?? 25}
            requests={(driverPayoutRequests ?? []) as PayoutRequestItem[]}
            savedDetails={profile?.payout_details as Record<string, unknown> | null}
            onRequest={async (amount, details) => {
              if (!profile?.id) return;
              await requestDriverPayout.mutateAsync({
                driverId: profile.id,
                amountSar: amount,
                paymentMethod: "bank_transfer",
                paymentDetails: details,
              });
              refetchDriverPayoutRequests();
            }}
            onSaveDetails={(details) => {
              if (!profile?.id) return;
              supabase.from("profiles").update({ payout_details: details }).eq("id", profile.id);
            }}
            loading={false}
            requestLoading={requestDriverPayout.isPending}
          />
        </DashboardPage>
      </ScrollView>
    </View>
  );
}
