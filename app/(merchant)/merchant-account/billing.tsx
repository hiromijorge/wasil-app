import { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  Image,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import {
  Calendar,
  Package,
  CreditCard,
  Receipt,
  AlertCircle,
  Upload,
  X,
} from "lucide-react-native";
import { useMerchantBilling } from "../../../src/hooks/useMerchantBilling";
import { useMerchantProducts } from "../../../src/hooks/useMerchantProducts";
import { useMerchantStore } from "../../../src/hooks/useMerchantStore";
import { formatSAR } from "../../../src/lib/format";
import { getPlan } from "../../../src/lib/billing";
import { supabase } from "../../../src/lib/supabase";
import { palette, fonts, spacing, radii, shadows } from "../../../src/lib/theme";
import { Button } from "../../../src/components/Button";
import { Input } from "../../../src/components/Input";
import type { Database } from "../../../src/lib/database.types";

type PaymentStatus = Database["public"]["Tables"]["subscription_charges"]["Row"]["status"];

function statusColor(status: PaymentStatus) {
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

function statusLabel(status: PaymentStatus) {
  switch (status) {
    case "paid":
      return "Paid";
    case "pending_verification":
      return "Pending";
    case "overdue":
      return "Overdue";
    default:
      return "Unpaid";
  }
}

export default function MerchantBillingScreen() {
  const insets = useSafeAreaInsets();
  const { data: store, isLoading: storeLoading } = useMerchantStore();
  const { data: billing, isLoading: billingLoading } = useMerchantBilling(store);
  const { data: products, isLoading: productsLoading } = useMerchantProducts(store?.id);

  const plan = getPlan((store?.plan_id ?? "free") as any);
  const productCount = products?.length ?? 0;
  const remainingProducts = Math.max(0, plan.maxProducts - productCount);

  const isLoading = storeLoading || billingLoading || productsLoading;
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const outstandingSar = billing?.totalOutstandingSar ?? 0;
  const isFreePlan = plan.id === "free";

  const pickReceipt = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setReceiptUri(result.assets[0].uri);
    }
  };

  const submitPayment = async () => {
    const num = Number(amount);
    if (!reference.trim() || !amount.trim() || Number.isNaN(num) || num <= 0) {
      Alert.alert("Missing information", "Please enter a reference number and a valid amount.");
      return;
    }
    if (!store?.id) return;

    setSubmitting(true);
    try {
      let receiptUrl: string | null = null;
      if (receiptUri) {
        const response = await fetch(receiptUri);
        const blob = await response.blob();
        const ext = receiptUri.split(".").pop() ?? "jpg";
        const path = `receipts/${store.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("receipts").upload(path, blob, {
          contentType: blob.type || "image/jpeg",
          upsert: true,
        });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("receipts").getPublicUrl(path);
        receiptUrl = data.publicUrl;
      }

      const { error } = await supabase.from("subscription_charges").insert({
        store_id: store.id,
        plan_id: plan.id,
        amount_sar: num,
        period_start: new Date().toISOString(),
        period_end: new Date().toISOString(),
        status: "pending_verification",
        receipt_url: receiptUrl,
      });
      if (error) throw error;

      Alert.alert("Payment submitted", "Your receipt is pending verification.");
      setPaymentModalVisible(false);
      setReference("");
      setAmount("");
      setNotes("");
      setReceiptUri(null);
    } catch (err) {
      Alert.alert("Try again", err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxl,
          gap: spacing.md,
        }}
      >
        {store?.restriction_active && (
          <View style={styles.restrictionBanner}>
            <AlertCircle size={18} color={palette.destructive} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.restrictionTitle}>Restriction active</Text>
              <Text style={styles.restrictionMessage}>
                {store.restriction_reason || "Your store is restricted. Contact support."}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.statsGrid}>
          <StatCard
            icon={<Package size={18} color={palette.primary} />}
            label="Current plan"
            value={plan.name}
            sub={isFreePlan ? "Free" : `${formatSAR(plan.priceUsd * 3.75)}/month`}
          />
          <StatCard
            icon={<CreditCard size={18} color={palette.primary} />}
            label="Outstanding"
            value={formatSAR(outstandingSar)}
            sub="No payment due"
            highlight={outstandingSar > 0}
          />
          <StatCard
            icon={<Receipt size={18} color={palette.primary} />}
            label="Products"
            value={`${productCount}`}
            sub={`${remainingProducts} remaining`}
          />
          <StatCard
            icon={<Calendar size={18} color={palette.primary} />}
            label="Photos / product"
            value={`${plan.maxPhotosPerProduct}`}
            sub="Current limit"
          />
        </View>

        <View style={[styles.card, shadows.card]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Current plan</Text>
              <Text style={styles.cardSubtitle}>
                {isFreePlan ? "You're on the free plan." : "Manage your subscription."}
              </Text>
            </View>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>{plan.name}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <BillingRow label="Plan price" value={isFreePlan ? "Free" : formatSAR(plan.priceUsd * 3.75)} />
          <BillingRow label="Product limit" value={`${plan.maxProducts}`} />
          <BillingRow label="Photos per product" value={`${plan.maxPhotosPerProduct}`} />
          <BillingRow label="Outstanding balance" value={formatSAR(outstandingSar)} highlight />

          {!isFreePlan && outstandingSar > 0 && (
            <Button
              title={`Pay now ${formatSAR(outstandingSar)}`}
              size="lg"
              onPress={() => setPaymentModalVisible(true)}
              style={{ marginTop: spacing.md }}
            />
          )}
        </View>

        <View style={[styles.card, shadows.card]}>
          <Text style={styles.cardTitle}>Billing history</Text>
          {isLoading ? (
            <Text style={styles.emptyText}>Loading...</Text>
          ) : billing?.charges.length === 0 ? (
            <Text style={styles.emptyText}>No billing history yet</Text>
          ) : (
            billing?.charges.map((p) => (
              <View key={p.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <View>
                    <Text style={styles.historyPeriod}>
                      {new Date(p.period_start).toLocaleDateString()} →{" "}
                      {new Date(p.period_end).toLocaleDateString()}
                    </Text>
                    <Text style={styles.historyMeta}>{formatSAR(p.amount_sar)}</Text>
                  </View>
                  <StatusBadge status={p.status} />
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={paymentModalVisible}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment details</Text>
              <Pressable onPress={() => setPaymentModalVisible(false)} style={styles.iconButton}>
                <X size={22} color={palette.foreground} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.card, { marginBottom: spacing.md }]}>
                <Text style={styles.instructionsTitle}>Bank transfer instructions</Text>
                <Text style={styles.instructionsText}>
                  Transfer {formatSAR(outstandingSar)} to the account below, then upload your receipt.
                </Text>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Bank</Text>
                  <Text style={styles.bankValue}>Yemen National Bank</Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Account</Text>
                  <Text style={styles.bankValue}>1234567890</Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Account name</Text>
                  <Text style={styles.bankValue}>Wasil Yemen Connect</Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Amount</Text>
                  <Text style={styles.bankValue}>{formatSAR(outstandingSar)}</Text>
                </View>
              </View>

              <Input
                label="Reference number"
                placeholder="TXN-123456"
                autoCapitalize="characters"
                value={reference}
                onChangeText={setReference}
              />

              <Input
                label="Transfer amount (SAR)"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />

              <Input
                label="Notes (optional)"
                placeholder="Sender name, branch, etc."
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
                style={styles.notesInput}
              />

              <Pressable onPress={pickReceipt} style={styles.receiptUpload}>
                {receiptUri ? (
                  <Image source={{ uri: receiptUri }} style={styles.receiptImage} />
                ) : (
                  <>
                    <Upload size={24} color={palette.primary} />
                    <Text style={styles.receiptText}>Upload payment receipt</Text>
                    <Text style={styles.receiptHint}>Tap to select from gallery</Text>
                  </>
                )}
              </Pressable>

              <Button
                title="Submit for verification"
                size="lg"
                onPress={submitPayment}
                loading={submitting}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.statCard, shadows.card, highlight && styles.statHighlight]}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  );
}

function BillingRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.billingRow}>
      <Text style={styles.billingRowLabel}>{label}</Text>
      <Text style={[styles.billingRowValue, highlight && { color: palette.destructive }]}>{value}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <View style={[styles.statusPill, { backgroundColor: `${statusColor(status)}15` }]}>
      <Text style={[styles.statusText, { color: statusColor(status) }]}>{statusLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  restrictionBanner: {
    flexDirection: "row",
    backgroundColor: "rgba(230, 44, 44, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(230, 44, 44, 0.3)",
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  restrictionTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: palette.destructive,
  },
  restrictionMessage: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: palette.destructive,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: "48%",
    backgroundColor: palette.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    ...shadows.card,
  },
  statHighlight: {
    borderColor: palette.destructive,
    backgroundColor: "#fff5f5",
  },
  statIcon: {
    marginBottom: spacing.sm,
  },
  statValue: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: palette.foreground,
  },
  statValueHighlight: {
    color: palette.destructive,
  },
  statLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: palette.mutedForeground,
    marginTop: 2,
  },
  statSub: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: palette.mutedForeground,
    marginTop: 2,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: radii["2xl"],
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: palette.foreground,
  },
  cardSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: palette.mutedForeground,
    marginTop: 2,
  },
  planBadge: {
    backgroundColor: palette.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  planBadgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: palette.primaryForeground,
    textTransform: "uppercase",
  },
  divider: {
    height: 1,
    backgroundColor: palette.border,
    marginVertical: spacing.md,
  },
  billingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  billingRowLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
  },
  billingRowValue: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.foreground,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
    marginTop: spacing.sm,
  },
  historyCard: {
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    paddingVertical: spacing.md,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  historyPeriod: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: palette.foreground,
  },
  historyMeta: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: palette.mutedForeground,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  statusText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(7, 26, 25, 0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: palette.background,
    borderTopLeftRadius: radii["2xl"],
    borderTopRightRadius: radii["2xl"],
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: palette.foreground,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  instructionsTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: palette.foreground,
    marginBottom: spacing.sm,
  },
  instructionsText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  bankRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  bankLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
  },
  bankValue: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.foreground,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  receiptUpload: {
    backgroundColor: palette.card,
    borderWidth: 1.5,
    borderColor: palette.border,
    borderStyle: "dashed",
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    minHeight: 140,
  },
  receiptImage: {
    width: "100%",
    height: 180,
    borderRadius: radii.md,
    resizeMode: "cover",
  },
  receiptText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: palette.primary,
    marginTop: spacing.sm,
  },
  receiptHint: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: palette.mutedForeground,
    marginTop: 2,
  },
});
