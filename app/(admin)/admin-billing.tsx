import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  Modal,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Check, X, AlertCircle, CreditCard } from "lucide-react-native";
import { useAdminBilling, type SubscriptionChargeRow } from "../../src/hooks/useAdminBilling";
import { useAuth } from "../../src/lib/auth-context";
import { formatSAR } from "../../src/lib/format";
import { useTranslation } from "../../src/lib/i18n";
import { palette, fonts, spacing, radii, shadows } from "../../src/lib/theme";
import { Button } from "../../src/components/Button";

function statusColor(status: string) {
  switch (status) {
    case "paid":
      return palette.success;
    case "pending_verification":
      return palette.warning;
    case "overdue":
      return palette.destructive;
    default:
      return palette.mutedForeground;
  }
}

export default function AdminBillingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { charges, isLoading, updateCharge } = useAdminBilling();

  const statusLabelText = (status: string) => {
    switch (status) {
      case "paid":
        return t("paid");
      case "pending_verification":
        return t("pendingVerification");
      case "overdue":
        return t("overdue");
      case "unpaid":
        return t("pending");
      default:
        return status;
    }
  };

  const [selected, setSelected] = useState<SubscriptionChargeRow | null>(null);

  const pending = charges.filter((c) => c.status === "pending_verification");
  const overdue = charges.filter((c) => c.status === "overdue");

  const handleAction = async (charge: SubscriptionChargeRow, action: "paid" | "unpaid") => {
    if (!user) return;
    const { error } = await updateCharge(charge.id, action, user.id);
    if (error) {
      Alert.alert(t("tryAgain"), String(error.message));
    } else {
      setSelected(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }]}>
        <Pressable onPress={() => router.replace("/admin-dashboard")} style={styles.back} accessibilityRole="button">
          <ArrowLeft size={24} color={palette.foreground} />
        </Pressable>
        <Text style={styles.title}>{t("subscriptionBilling")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.xl,
        }}
      >
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, shadows.card]}>
            <CreditCard size={20} color={palette.primary} />
            <Text style={styles.statValue}>{charges.length}</Text>
            <Text style={styles.statLabel}>{t("totalCharges")}</Text>
          </View>
          <View style={[styles.statCard, shadows.card]}>
            <AlertCircle size={20} color={palette.warning} />
            <Text style={styles.statValue}>{pending.length}</Text>
            <Text style={styles.statLabel}>{t("pendingVerification")}</Text>
          </View>
          <View style={[styles.statCard, shadows.card]}>
            <AlertCircle size={20} color={palette.destructive} />
            <Text style={styles.statValue}>{overdue.length}</Text>
            <Text style={styles.statLabel}>{t("overdue")}</Text>
          </View>
        </View>

        {isLoading && <Text style={styles.emptyText}>{t("loading")}</Text>}

        {charges.map((charge) => (
          <Pressable key={charge.id} onPress={() => setSelected(charge)} style={[styles.card, shadows.card]} accessibilityRole="button">
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t("storeShort")} {charge.store_id.slice(-6).toUpperCase()}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusColor(charge.status) + "20" }]}>
                <Text style={[styles.statusText, { color: statusColor(charge.status) }]}>
                  {statusLabelText(charge.status)}
                </Text>
              </View>
            </View>
            <Text style={styles.planText}>{charge.plan_id} {t("planLabel").toLowerCase()} • {formatSAR(Number(charge.amount_sar))}</Text>
            <Text style={styles.dateText}>{t("periodLabel")}: {new Date(charge.period_start).toLocaleDateString()} - {new Date(charge.period_end).toLocaleDateString()}</Text>
            {charge.receipt_url && (
              <Text style={styles.receiptText}>{t("receiptUploaded")}</Text>
            )}
          </Pressable>
        ))}
      </ScrollView>

      <Modal visible={!!selected} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { paddingBottom: insets.bottom + spacing.lg }]}>
            <Text style={styles.modalTitle}>{t("reviewSubscriptionPayment")}</Text>
            {selected && (
              <>
                <Text style={styles.modalAmount}>{formatSAR(Number(selected.amount_sar))}</Text>
                <Text style={styles.modalMeta}>{t("storeShort")}: {selected.store_id}</Text>
                <Text style={styles.modalMeta}>{t("planLabel")}: {selected.plan_id}</Text>
                <Text style={styles.modalMeta}>{t("periodLabel")}: {new Date(selected.period_start).toLocaleDateString()} - {new Date(selected.period_end).toLocaleDateString()}</Text>
                {selected.receipt_url && (
                  <Image source={{ uri: selected.receipt_url }} style={styles.receiptImage} />
                )}
                <View style={styles.modalActions}>
                  <Button
                    title={t("approve")}
                    variant="primary"
                    size="lg"
                    onPress={() => handleAction(selected, "paid")}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title={t("cancel")}
                    variant="outline"
                    size="lg"
                    onPress={() => handleAction(selected, "unpaid")}
                    style={{ flex: 1 }}
                  />
                </View>
                <Button title={t("close")} variant="ghost" onPress={() => setSelected(null)} />
              </>
            )}
          </View>
        </View>
      </Modal>
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
  statsGrid: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: palette.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    ...shadows.card,
  },
  statValue: { fontFamily: fonts.display, fontSize: 18, color: palette.foreground, marginTop: spacing.sm },
  statLabel: { fontFamily: fonts.sansMedium, fontSize: 11, color: palette.mutedForeground },
  emptyText: { fontFamily: fonts.sansMedium, fontSize: 14, color: palette.mutedForeground, textAlign: "center", marginTop: spacing.md },
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
  cardTitle: { fontFamily: fonts.sansBold, fontSize: 15, color: palette.foreground },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.full },
  statusText: { fontFamily: fonts.sansBold, fontSize: 11, textTransform: "capitalize" },
  planText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: palette.foreground },
  dateText: { fontFamily: fonts.sansMedium, fontSize: 12, color: palette.mutedForeground, marginTop: spacing.sm },
  receiptText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: palette.success, marginTop: spacing.sm },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: palette.background,
    borderTopLeftRadius: radii["3xl"],
    borderTopRightRadius: radii["3xl"],
    padding: spacing.lg,
  },
  modalTitle: { fontFamily: fonts.display, fontSize: 20, color: palette.foreground, marginBottom: spacing.md },
  modalAmount: { fontFamily: fonts.display, fontSize: 28, color: palette.primary, marginBottom: spacing.sm },
  modalMeta: { fontFamily: fonts.sansMedium, fontSize: 13, color: palette.mutedForeground, marginBottom: spacing.sm },
  receiptImage: { width: "100%", height: 220, borderRadius: radii.lg, marginVertical: spacing.md },
  modalActions: { flexDirection: "row", gap: spacing.md, marginVertical: spacing.md },
});
