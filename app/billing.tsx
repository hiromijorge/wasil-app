import { useEffect, useMemo, useState } from "react";
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
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import {
  ArrowLeft,
  Calendar,
  Package,
  CreditCard,
  Receipt,
  AlertCircle,
  Upload,
  X,
} from "lucide-react-native";
import { useMerchantBilling } from "../src/hooks/useMerchantBilling";
import { demoMerchantStoreId, formatUsd, type PaymentStatus } from "../src/lib/demo-data";
import { getPlan } from "../src/lib/billing";
import { palette, fonts, spacing, radii, shadows } from "../src/lib/theme";
import { Button } from "../src/components/Button";
import { Input } from "../src/components/Input";

const STORE_ID = demoMerchantStoreId;

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

export default function BillingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data } = useMerchantBilling(STORE_ID);

  const billing = data.billing;
  const period = data.currentPeriod;
  const plan = getPlan(billing.currentPlanId);

  const paid = useMemo(
    () => data.payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amountUsd, 0),
    [data.payments]
  );
  const outstanding = useMemo(
    () => Math.max(0, (period?.totalDueUsd ?? 0) - billing.paidThisMonthUsd),
    [period, billing.paidThisMonthUsd]
  );

  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState(String(outstanding));
  const [notes, setNotes] = useState("");
  const [receiptUri, setReceiptUri] = useState<string | null>(null);

  useEffect(() => {
    setAmount(String(outstanding));
  }, [outstanding]);

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

  const submitPayment = () => {
    const num = Number(amount);
    if (!reference.trim() || !amount.trim() || Number.isNaN(num) || num <= 0) {
      Alert.alert("Missing information", "Please enter a reference number and a valid amount.");
      return;
    }
    Alert.alert(
      "Payment submitted",
      "Your receipt is pending verification. We will notify you once approved."
    );
    setPaymentModalVisible(false);
    setReference("");
    setAmount(String(outstanding));
    setNotes("");
    setReceiptUri(null);
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.topBar,
          { paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft size={20} color={palette.foreground} />
        </Pressable>
        <View style={styles.topBarText}>
          <Text style={styles.topBarTitle}>{data.storeName}</Text>
          <Text style={styles.topBarSubtitle}>
            {period ? `${period.startDate} → ${period.endDate}` : ""}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xxl,
          gap: spacing.md,
        }}
      >
        {billing.restrictionActive && (
          <View style={styles.restrictionBanner}>
            <AlertCircle size={18} color={palette.destructive} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.restrictionTitle}>Restriction active</Text>
              <Text style={styles.restrictionMessage}>
                {billing.restrictionReason ||
                  "Your store is restricted due to an unpaid balance."}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.statsGrid}>
          <StatCard
            icon={<Package size={18} color={palette.primary} />}
            label="Current plan"
            value={plan.name}
            sub={`${formatUsd(plan.priceUsd)}/month`}
          />
          <StatCard
            icon={<CreditCard size={18} color={palette.primary} />}
            label="Outstanding"
            value={formatUsd(outstanding)}
            sub={`Due ${period?.endDate ?? "—"}`}
            highlight={outstanding > 0}
          />
          <StatCard
            icon={<Receipt size={18} color={palette.primary} />}
            label="Paid this month"
            value={formatUsd(billing.paidThisMonthUsd)}
            sub={`Pending ${formatUsd(billing.pendingVerificationUsd)}`}
          />
          <StatCard
            icon={<Calendar size={18} color={palette.primary} />}
            label="Lifetime payments"
            value={formatUsd(billing.lifetimePaidUsd)}
            sub={`${period?.completedOrders ?? 0} orders`}
          />
        </View>

        <View style={[styles.card, shadows.card]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Current plan</Text>
              <Text style={styles.cardSubtitle}>
                {period ? `${period.startDate} → ${period.endDate}` : ""}
              </Text>
            </View>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>{plan.name}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <BillingRow label="Subscription fee" value={formatUsd(period?.subscriptionFeeUsd ?? plan.priceUsd)} />
          <BillingRow label="Transaction fees" value={formatUsd(period?.transactionFeeUsd ?? 0)} />
          <BillingRow label="Completed orders" value={String(period?.completedOrders ?? 0)} />

          <View style={styles.divider} />

          <BillingRow label="Total due" value={formatUsd(period?.totalDueUsd ?? 0)} bold />
          <BillingRow label="Outstanding balance" value={formatUsd(outstanding)} highlight />

          {outstanding > 0 && (
            <Button
              title={`Pay now ${formatUsd(outstanding)}`}
              size="lg"
              onPress={() => setPaymentModalVisible(true)}
              style={{ marginTop: spacing.md }}
            />
          )}
        </View>

        <View style={[styles.card, shadows.card]}>
          <Text style={styles.cardTitle}>Wallet</Text>
          <View style={{ marginTop: spacing.sm, gap: 4 }}>
            <BillingRow label="Subscription charges" value={formatUsd(plan.priceUsd)} />
            <BillingRow label="Transaction fees" value={formatUsd(period?.transactionFeeUsd ?? 0)} />
            <BillingRow label="Paid this month" value={formatUsd(billing.paidThisMonthUsd)} />
            <BillingRow label="Pending verification" value={formatUsd(billing.pendingVerificationUsd)} />
            <BillingRow label="Outstanding balance" value={formatUsd(outstanding)} highlight />
          </View>
        </View>

        <View style={[styles.card, shadows.card]}>
          <Text style={styles.cardTitle}>Recent payments</Text>
          {data.payments.length === 0 ? (
            <Text style={styles.emptyText}>No payments yet</Text>
          ) : (
            [...data.payments].slice(-5).reverse().map((p) => (
              <View key={p.id} style={styles.paymentRow}>
                <View>
                  <Text style={styles.paymentAmount}>{formatUsd(p.amountUsd)}</Text>
                  <Text style={styles.paymentReference}>{p.referenceNumber}</Text>
                </View>
                <StatusBadge status={p.status} />
              </View>
            ))
          )}
        </View>

        <View style={[styles.card, shadows.card]}>
          <Text style={styles.cardTitle}>Billing history</Text>
          {data.history.length === 0 ? (
            <Text style={styles.emptyText}>No billing history</Text>
          ) : (
            data.history.map((p) => (
              <View key={p.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <View>
                    <Text style={styles.historyPeriod}>
                      {p.startDate} → {p.endDate}
                    </Text>
                    <Text style={styles.historyMeta}>{p.completedOrders} orders</Text>
                  </View>
                  <StatusBadge status={p.status} />
                </View>
                <View style={styles.historyTotals}>
                  <HistoryLine label="Subscription" value={formatUsd(p.subscriptionFeeUsd)} />
                  <HistoryLine label="Transaction fee" value={formatUsd(p.transactionFeeUsd)} />
                  <HistoryLine label="Total due" value={formatUsd(p.totalDueUsd)} bold />
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
                  Transfer {formatUsd(outstanding)} to the account below, then upload your receipt.
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
                  <Text style={styles.bankValue}>Souqly Yemen Connect</Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Amount</Text>
                  <Text style={styles.bankValue}>{formatUsd(outstanding)}</Text>
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
                label="Transfer amount (USD)"
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

              <Button title="Submit for verification" size="lg" onPress={submitPayment} />
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
  bold,
  highlight,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <View style={styles.billingRow}>
      <Text style={styles.billingRowLabel}>{label}</Text>
      <Text
        style={[
          styles.billingRowValue,
          bold && { fontFamily: fonts.display, fontSize: 15 },
          highlight && { color: palette.destructive },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <View style={[styles.statusPill, { backgroundColor: `${statusColor(status)}15` }]}>
      <Text style={[styles.statusText, { color: statusColor(status) }]}>
        {statusLabel(status)}
      </Text>
    </View>
  );
}

function HistoryLine({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.historyLine}>
      <Text style={[styles.historyLineLabel, bold && styles.boldLabel]}>{label}</Text>
      <Text style={[styles.historyLineValue, bold && styles.boldValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: palette.card,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
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
  topBarText: {
    flex: 1,
  },
  topBarTitle: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: palette.foreground,
  },
  topBarSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: palette.mutedForeground,
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
    borderColor: palette.border,
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
    borderColor: palette.border,
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
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  paymentAmount: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: palette.foreground,
  },
  paymentReference: {
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
  historyTotals: {
    gap: 4,
  },
  historyLine: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  historyLineLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: palette.mutedForeground,
  },
  historyLineValue: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: palette.foreground,
  },
  boldLabel: {
    fontFamily: fonts.sansSemiBold,
    color: palette.foreground,
  },
  boldValue: {
    fontFamily: fonts.sansBold,
    color: palette.foreground,
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
