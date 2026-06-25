import { View, Text, ScrollView, Pressable, StyleSheet, Switch, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Truck, CheckCircle, DollarSign } from "lucide-react-native";
import { useAdminDrivers } from "../../src/hooks/useAdminDrivers";
import { formatSAR } from "../../src/lib/format";
import { useTranslation } from "../../src/lib/i18n";
import { palette, fonts, spacing, radii, shadows } from "../../src/lib/theme";

type DriverStatus = import("../../src/lib/database.types").Database["public"]["Tables"]["drivers"]["Row"]["status"];

export default function AdminDriversScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { drivers, isLoading, updateStatus } = useAdminDrivers();

  const isActive = (status: DriverStatus) => status === "active";

  const statusText = (status: DriverStatus) => {
    switch (status) {
      case "pending_review":
        return t("statusPendingReview");
      case "active":
        return t("statusActive");
      case "suspended":
        return t("statusSuspended");
      case "inactive":
        return t("statusInactive");
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }]}>
        <Pressable onPress={() => router.replace("/admin-dashboard")} style={styles.back}>
          <ArrowLeft size={24} color={palette.foreground} />
        </Pressable>
        <Text style={styles.title}>{t("adminDriversTitle")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.xl,
        }}
      >
        {isLoading && <ActivityIndicator color={palette.primary} style={{ marginTop: 20 }} />}
        {!isLoading && drivers.length === 0 && (
          <Text style={styles.emptyText}>{t("noDrivers")}</Text>
        )}
        {drivers.map((driver) => (
          <View key={driver.id} style={[styles.card, shadows.card]}>
            <View style={styles.cardHeader}>
              <View style={styles.row}>
                <Truck size={18} color={palette.primary} />
                <Text style={styles.cardTitle}>{driver.full_name}</Text>
              </View>
              <Switch
                value={isActive(driver.status)}
                onValueChange={(v) => updateStatus(driver.id, v ? "active" : "suspended")}
                trackColor={{ false: palette.border, true: palette.primary }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.infoRow}>
              <CheckCircle size={14} color={palette.success} />
              <Text style={styles.infoText}>{driver.deliveries_completed} {t("completed").toLowerCase()}</Text>
            </View>
            <View style={styles.infoRow}>
              <DollarSign size={14} color={palette.warning} />
              <Text style={styles.infoText}>{t("earned")} {formatSAR(Number(driver.earnings_total_sar))}</Text>
            </View>
            <Text style={[styles.statusText, driver.status === "pending_review" && { color: palette.warning }]}>
              {statusText(driver.status)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: spacing.md,
  },
  back: { padding: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: 20, color: palette.foreground },
  card: {
    backgroundColor: palette.card,
    borderRadius: radii["2xl"],
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  cardTitle: { fontFamily: fonts.sansBold, fontSize: 15, color: palette.foreground },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm },
  infoText: { fontFamily: fonts.sansMedium, fontSize: 13, color: palette.foreground },
  statusText: { fontFamily: fonts.sansBold, fontSize: 12, color: palette.mutedForeground, marginTop: spacing.sm },
  emptyText: { fontFamily: fonts.sansMedium, fontSize: 13, color: palette.mutedForeground, textAlign: "center", marginTop: spacing.md },
});
