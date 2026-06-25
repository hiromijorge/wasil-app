import { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Truck, ClipboardList, CheckCircle, DollarSign, ChevronRight } from "lucide-react-native";
import { supabase } from "../../src/lib/supabase";
import { useAuth } from "../../src/lib/auth-context";
import { useDriverRecord } from "../../src/hooks/useDriverRecord";
import { useDriverDeliveries } from "../../src/hooks/useDriverDeliveries";
import { useDriverCodBalance } from "../../src/hooks/useDriverCodBalance";
import { usePlatformConfig } from "../../src/hooks/usePlatformConfig";
import { formatSAR } from "../../src/lib/format";
import { useTranslation } from "../../src/lib/i18n";
import { palette, spacing } from "../../src/lib/theme";
import { Button } from "../../src/components/Button";
import { Input } from "../../src/components/Input";
import { LangSwitcher } from "../../src/components/LangSwitcher";
import { DashboardHeader, DashboardPage } from "../../src/components/DashboardLayout";
import { styles } from "./components";

export default function DriverDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut, user } = useAuth();
  const { t } = useTranslation();
  const { data: driver, isLoading: driverLoading, refresh: refreshDriver } = useDriverRecord();
  const { data: deliveries, isLoading: deliveriesLoading } = useDriverDeliveries(driver?.id);
  const { data: codBalance } = useDriverCodBalance(user?.id);
  const { data: platformConfig } = usePlatformConfig();

  const [applying, setApplying] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    nationalId: "",
    vehicleType: "",
    vehiclePlate: "",
  });

  const handleSignOut = async () => {
    await signOut();
    router.replace("/");
  };

  const handleApply = async () => {
    if (!user) return;
    if (!form.fullName || !form.phone || !form.nationalId || !form.vehicleType || !form.vehiclePlate) {
      Alert.alert(t("tryAgain"), "Please fill in all required fields.");
      return;
    }
    setApplying(true);
    const { error } = await supabase.from("drivers").insert({
      user_id: user.id,
      full_name: form.fullName.trim(),
      phone: form.phone.trim(),
      national_id: form.nationalId.trim(),
      vehicle_type: form.vehicleType.trim(),
      vehicle_plate_number: form.vehiclePlate.trim(),
      status: "pending_review",
    });
    setApplying(false);
    if (error) {
      Alert.alert(t("tryAgain"), error.message);
    } else {
      await refreshDriver();
    }
  };

  if (driverLoading || deliveriesLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (!driver) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.center,
          { padding: spacing.lg, paddingTop: insets.top + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Truck size={48} color={palette.primary} style={{ marginBottom: spacing.md }} />
        <Text style={styles.title}>{t("driverNotFound")}</Text>
        <Text style={styles.subtitle}>{t("driverNotFoundMessage")}</Text>

        <View style={{ width: "100%", maxWidth: 400, marginTop: spacing.lg }}>
          <Input
            label={t("fullNameLabel")}
            value={form.fullName}
            onChangeText={(text) => setForm((f) => ({ ...f, fullName: text }))}
            autoCapitalize="words"
          />
          <Input
            label={t("phoneLabel")}
            value={form.phone}
            onChangeText={(text) => setForm((f) => ({ ...f, phone: text }))}
            keyboardType="phone-pad"
          />
          <Input
            label={t("nationalIdLabel")}
            value={form.nationalId}
            onChangeText={(text) => setForm((f) => ({ ...f, nationalId: text }))}
          />
          <Input
            label={t("vehicleTypeLabel")}
            value={form.vehicleType}
            onChangeText={(text) => setForm((f) => ({ ...f, vehicleType: text }))}
            placeholder="e.g. Motorcycle"
          />
          <Input
            label={t("vehiclePlateLabel")}
            value={form.vehiclePlate}
            onChangeText={(text) => setForm((f) => ({ ...f, vehiclePlate: text }))}
          />
          <Button
            title={t("submitApplication")}
            onPress={handleApply}
            loading={applying}
            style={{ marginTop: spacing.sm }}
          />
        </View>

        <Button title={t("signOut")} variant="outline" onPress={handleSignOut} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    );
  }

  if (driver.status !== "active") {
    return (
      <View style={[styles.container, styles.center, { padding: spacing.lg }]}>
        <ClipboardList size={48} color={palette.warning} style={{ marginBottom: spacing.md }} />
        <Text style={styles.title}>{t("applicationSubmitted")}</Text>
        <Text style={styles.subtitle}>{t("applicationPendingMessage")}</Text>
        <Button title={t("signOut")} variant="outline" onPress={handleSignOut} style={{ marginTop: spacing.lg }} />
      </View>
    );
  }

  const activeCount = deliveries.filter((d) => d.status !== "delivered").length;
  const unsettled = formatSAR(Number(codBalance?.unsettled ?? 0));
  const codLimit = formatSAR(platformConfig?.cod_max_unsettled_cash_sar ?? 300);

  const quickActions = [
    { label: t("activeDeliveries"), route: "/driver-deliveries" as const },
    { label: t("parcelJobs"), route: "/driver-parcels" as const },
    { label: t("payouts"), route: "/driver-payouts" as const },
  ];

  return (
    <View style={styles.container}>
      <DashboardHeader
        overline={t("driverConsole")}
        title={driver.full_name}
        right={
          <View style={styles.headerRight}>
            <LangSwitcher />
            <Pressable onPress={handleSignOut} style={styles.signOutButton} accessibilityRole="button">
              <Text style={styles.signOutText}>{t("signOut")}</Text>
            </Pressable>
          </View>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing.xl,
        }}
      >
        <DashboardPage>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <ClipboardList size={20} color={palette.primary} />
              <Text style={styles.statValue}>{activeCount}</Text>
              <Text style={styles.statLabel}>{t("active")}</Text>
            </View>
            <View style={styles.statCard}>
              <CheckCircle size={20} color={palette.success} />
              <Text style={styles.statValue}>{driver.deliveries_completed}</Text>
              <Text style={styles.statLabel}>{t("completed")}</Text>
            </View>
            <View style={styles.statCard}>
              <DollarSign size={20} color={palette.warning} />
              <Text style={styles.statValue}>{formatSAR(Number(driver.earnings_total_sar))}</Text>
              <Text style={styles.statLabel}>{t("earnings")}</Text>
            </View>
            <View style={styles.statCard}>
              <DollarSign size={20} color={palette.success} />
              <Text style={styles.statValue}>{unsettled}</Text>
              <Text style={styles.statLabel}>{t("unsettledBalance")}</Text>
            </View>
          </View>

          <View style={[styles.card, { marginBottom: spacing.lg }]}>
            <Text style={styles.sectionTitle}>{t("unsettledBalance")}</Text>
            <Text style={styles.title}>{unsettled}</Text>
            <Text style={styles.subtitle}>{t("codLimitReachedBody", { amount: codLimit })}</Text>
          </View>

          <Text style={styles.sectionTitle}>Quick Actions</Text>
          {quickActions.map((action) => (
            <Pressable
              key={action.route}
              onPress={() => router.push(action.route)}
              style={[styles.card, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}
              accessibilityRole="button"
            >
              <Text style={styles.cardTitle}>{action.label}</Text>
              <ChevronRight size={20} color={palette.primary} />
            </Pressable>
          ))}
        </DashboardPage>
      </ScrollView>
    </View>
  );
}
