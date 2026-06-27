import { useState, useEffect, type ReactNode } from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertCircle } from "lucide-react-native";
import { useMerchantStore } from "../hooks/useMerchantStore";
import { useMerchantSubscription } from "../hooks/useMerchantSubscription";
import { useAuth } from "../lib/auth-context";
import { useTranslation } from "../lib/i18n";
import { supabase } from "../lib/supabase";
import { palette, fonts, spacing } from "../lib/theme";
import { LangSwitcher } from "./LangSwitcher";
import { DashboardHeader, DashboardPage } from "./DashboardLayout";

interface MerchantShellProps {
  children: ReactNode;
  floatingAction?: ReactNode;
}

export function MerchantShell({ children, floatingAction }: MerchantShellProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { demo } = useAuth();
  const { data: store, isLoading: storeLoading } = useMerchantStore();
  const { data: charges } = useMerchantSubscription(store?.id);
  const [open, setOpen] = useState(store?.open ?? true);

  useEffect(() => {
    if (store) setOpen(store.open);
  }, [store]);

  useEffect(() => {
    if (!storeLoading && !store && !demo) {
      router.replace("/merchant-onboarding");
    }
  }, [storeLoading, store, demo, router]);

  const handleToggleOpen = async (value: boolean) => {
    setOpen(value);
    if (store?.id) {
      await supabase.from("stores").update({ open: value }).eq("id", store.id);
    }
  };

  const currentCharge = charges?.[0];
  const isOverdue =
    currentCharge?.status === "overdue" ||
    (currentCharge?.status === "unpaid" &&
      new Date() >
        new Date(
          new Date(currentCharge.period_end).getTime() + 7 * 24 * 60 * 60 * 1000,
        ));

  if (storeLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DashboardHeader
        overline={t("merchantConsole")}
        title={store?.name ?? t("store")}
        right={
          <View style={styles.openSwitch}>
            <LangSwitcher />
            <Switch
              value={open}
              onValueChange={handleToggleOpen}
              disabled={storeLoading || !store}
              trackColor={{ false: palette.mutedForeground, true: palette.success }}
              thumbColor={palette.card}
            />
            <Text
              style={[
                styles.openText,
                { color: open ? palette.success : palette.mutedForeground },
              ]}
            >
              {open ? t("open") : t("closed")}
            </Text>
          </View>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing.xl + (floatingAction ? 80 : 0),
        }}
      >
        <DashboardPage>
          {isOverdue && (
            <View style={[styles.restrictionBanner, { marginBottom: spacing.md }]}>
              <AlertCircle size={18} color={palette.destructive} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.restrictionTitle}>
                  {t("subscriptionOverdue")}
                </Text>
                <Text style={styles.restrictionMessage}>
                  {t("subscriptionOverdueMessage")}
                </Text>
                <Text
                  style={styles.restrictionLink}
                  onPress={() => router.push("/merchant-account/billing")}
                >
                  {t("payNow")}
                </Text>
              </View>
            </View>
          )}
          {children}
        </DashboardPage>
      </ScrollView>

      {floatingAction}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  center: { alignItems: "center", justifyContent: "center" },
  openSwitch: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  openText: { fontFamily: fonts.sansSemiBold, fontSize: 12 },
  restrictionBanner: {
    flexDirection: "row",
    backgroundColor: "#fdecec",
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.destructive,
  },
  restrictionTitle: { fontFamily: fonts.sansBold, color: palette.destructive },
  restrictionMessage: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: palette.destructive,
    marginTop: 2,
  },
  restrictionLink: {
    fontFamily: fonts.sansBold,
    color: palette.destructive,
    marginTop: 4,
    textDecorationLine: "underline",
  },
});
