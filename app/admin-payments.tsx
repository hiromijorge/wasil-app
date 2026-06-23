import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Check, X, AlertCircle } from "lucide-react-native";
import { useAuth } from "../src/lib/auth-context";
import { useAdminOrders } from "../src/hooks/useAdminOrders";
import { useAdminPayouts } from "../src/hooks/useAdminPayouts";
import { useAdminDriverPayouts } from "../src/hooks/useAdminDriverPayouts";
import { useAdminParcels } from "../src/hooks/useAdminParcels";
import { formatSAR } from "../src/lib/demo-data";
import { useTranslation } from "../src/lib/i18n";
import { palette, fonts, spacing, radii, shadows } from "../src/lib/theme";
import { Button } from "../src/components/Button";

type Tab = "receipts" | "merchant" | "driver" | "parcels";

export default function AdminPaymentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user, role, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("receipts");

  const orders = useAdminOrders();
  const payouts = useAdminPayouts();
  const driverPayouts = useAdminDriverPayouts();
  const parcels = useAdminParcels();

  const isAdmin = role === "admin";
  const adminId = user?.id ?? "";

  const isLoading =
    authLoading ||
    (activeTab === "receipts" && orders.isLoading) ||
    (activeTab === "merchant" && payouts.isLoading) ||
    (activeTab === "driver" && driverPayouts.isLoading) ||
    (activeTab === "parcels" && parcels.isLoading);

  const handleVerify = async (id: string) => {
    if (!adminId) return;
    await orders.verifyPayment(id, adminId);
  };

  const handleReject = async (id: string) => {
    if (!adminId) return;
    await orders.rejectPayment(id, adminId);
  };

  const handleReleasePayout = async (id: string) => {
    if (!adminId) return;
    await payouts.releasePayout(id, adminId);
  };

  const handleReleaseAllPayouts = async () => {
    if (!adminId) return;
    await payouts.releaseAll(adminId);
  };

  const handleReleaseDriverPayout = async (id: string) => {
    if (!adminId) return;
    await driverPayouts.releasePayout(id, adminId);
  };

  const handleVerifyParcel = async (id: string) => {
    if (!adminId) return;
    await parcels.verifyPayment(id, adminId);
  };

  const handleRejectParcel = async (id: string) => {
    if (!adminId) return;
    await parcels.rejectPayment(id, adminId);
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.md,
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.md,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <ArrowLeft size={20} color={palette.foreground} />
          </Pressable>
          <View>
            <Text style={styles.headerOverline}>{t("adminConsole")}</Text>
            <Text style={styles.headerTitle}>{t("paymentsTitle")}</Text>
          </View>
        </View>
        <Pressable onPress={() => router.push("/admin-config")} style={styles.iconButton} accessibilityRole="button">
          <Text style={styles.headerLink}>{t("platformConfig")}</Text>
        </Pressable>
      </View>

      <View style={styles.tabBar}>
        <TabButton
          label={t("receiptsTab")}
          active={activeTab === "receipts"}
          onPress={() => setActiveTab("receipts")}
        />
        <TabButton
          label={t("merchantPayoutsTab")}
          active={activeTab === "merchant"}
          onPress={() => setActiveTab("merchant")}
        />
        <TabButton
          label={t("driverPayoutsTab")}
          active={activeTab === "driver"}
          onPress={() => setActiveTab("driver")}
        />
        <TabButton
          label={t("parcelPayouts")}
          active={activeTab === "parcels"}
          onPress={() => setActiveTab("parcels")}
        />
      </View>

      {!isAdmin && !authLoading ? (
        <AccessDenied />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xxl,
            gap: spacing.md,
          }}
        >
          {activeTab === "receipts" && (
            <View>
              <Text style={styles.title}>{t("receiptVerification")}</Text>
              <Text style={styles.subtitle}>{t("receiptVerificationSubtitle")}</Text>
            </View>
          )}

          {activeTab === "merchant" && (
            <View>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.title}>{t("merchantPayouts")}</Text>
                  <Text style={styles.subtitle}>{t("merchantPayoutsSubtitle")}</Text>
                </View>
                <Button
                  title={t("releaseAll")}
                  size="sm"
                  onPress={handleReleaseAllPayouts}
                  disabled={payouts.data.length === 0 || isLoading}
                />
              </View>
            </View>
          )}

          {activeTab === "driver" && (
            <View>
              <Text style={styles.title}>{t("driverPayouts")}</Text>
              <Text style={styles.subtitle}>{t("driverPayoutsSubtitle")}</Text>
            </View>
          )}

          {activeTab === "parcels" && (
            <View>
              <Text style={styles.title}>{t("parcelPayouts")}</Text>
              <Text style={styles.subtitle}>{t("parcelPayoutsSubtitle")}</Text>
            </View>
          )}

          {isLoading && (
            <ActivityIndicator
              color={palette.primary}
              style={{ marginTop: spacing.xl }}
            />
          )}

          {activeTab === "receipts" && !orders.isLoading && (
            <View style={[styles.card, shadows.card]}>
              {orders.data.length === 0 ? (
                <EmptyState message={t("noPendingReceipts")} />
              ) : (
                orders.data.map((order) => (
                  <ReceiptCard
                    key={order.id}
                    order={order}
                    onVerify={() => handleVerify(order.id)}
                    onReject={() => handleReject(order.id)}
                  />
                ))
              )}
            </View>
          )}

          {activeTab === "merchant" && !payouts.isLoading && (
            <View style={[styles.card, shadows.card]}>
              {payouts.data.length === 0 ? (
                <EmptyState message={t("noPendingMerchantPayouts")} />
              ) : (
                payouts.data.map((payout) => (
                  <MerchantPayoutCard
                    key={payout.id}
                    payout={payout}
                    onRelease={() => handleReleasePayout(payout.id)}
                  />
                ))
              )}
            </View>
          )}

          {activeTab === "driver" && !driverPayouts.isLoading && (
            <View style={[styles.card, shadows.card]}>
              {driverPayouts.data.length === 0 ? (
                <EmptyState message={t("noPendingDriverPayouts")} />
              ) : (
                driverPayouts.data.map((payout) => (
                  <DriverPayoutCard
                    key={payout.id}
                    payout={payout}
                    onRelease={() => handleReleaseDriverPayout(payout.id)}
                  />
                ))
              )}
            </View>
          )}

          {activeTab === "parcels" && !parcels.isLoading && (
            <View style={[styles.card, shadows.card]}>
              {parcels.data.length === 0 ? (
                <EmptyState message={t("noPendingParcelPayouts")} />
              ) : (
                parcels.data.map((parcel) => (
                  <ParcelReceiptCard
                    key={parcel.id}
                    parcel={parcel}
                    onVerify={() => handleVerifyParcel(parcel.id)}
                    onReject={() => handleRejectParcel(parcel.id)}
                  />
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabButton, active && styles.tabButtonActive]}
    >
      <Text
        style={[styles.tabButtonText, active && styles.tabButtonTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function AccessDenied() {
  const { t } = useTranslation();
  return (
    <View style={styles.centered}>
      <AlertCircle size={48} color={palette.destructive} />
      <Text style={styles.deniedTitle}>{t("accessDenied")}</Text>
      <Text style={styles.deniedText}>{t("accessDeniedMessage")}</Text>
    </View>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

function ReceiptCard({
  order,
  onVerify,
  onReject,
}: {
  order: {
    id: string;
    payment_receipt_url: string | null;
    store: { name: string } | null;
    total: number;
    created_at: string;
  };
  onVerify: () => void;
  onReject: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.receiptCard}>
      {order.payment_receipt_url ? (
        <Image
          source={{ uri: order.payment_receipt_url }}
          style={styles.receiptImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.receiptImage, styles.receiptPlaceholder]}>
          <Text style={styles.placeholderText}>{t("noReceipt")}</Text>
        </View>
      )}
      <View style={styles.receiptBody}>
        <Text style={styles.receiptStore}>
          {order.store?.name ?? t("unknownStore")}
        </Text>
        <Text style={styles.receiptMeta}>{order.id}</Text>
        <Text style={styles.receiptAmount}>{formatSAR(order.total)}</Text>
        <Text style={styles.receiptDate}>
          {new Date(order.created_at).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.receiptActions}>
        <Pressable onPress={onVerify} style={[styles.actionButton, styles.approveButton]} accessibilityRole="button">
          <Check size={16} color={palette.success} />
        </Pressable>
        <Pressable onPress={onReject} style={[styles.actionButton, styles.rejectButton]} accessibilityRole="button">
          <X size={16} color={palette.destructive} />
        </Pressable>
      </View>
    </View>
  );
}

function MerchantPayoutCard({
  payout,
  onRelease,
}: {
  payout: {
    id: string;
    store: { name: string } | null;
    net_sar: number;
    created_at: string;
  };
  onRelease: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.payoutCard}>
      <View style={styles.payoutBody}>
        <Text style={styles.payoutName}>{payout.store?.name ?? t("unknownStore")}</Text>
        <Text style={styles.payoutMeta}>{payout.id}</Text>
        <Text style={styles.payoutAmount}>{formatSAR(payout.net_sar)}</Text>
        <Text style={styles.payoutDate}>
          {new Date(payout.created_at).toLocaleDateString()}
        </Text>
      </View>
      <Button title={t("release")} size="sm" onPress={onRelease} />
    </View>
  );
}

function DriverPayoutCard({
  payout,
  onRelease,
}: {
  payout: {
    id: string;
    driver: { full_name: string } | null;
    amount_sar: number;
    created_at: string;
  };
  onRelease: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.payoutCard}>
      <View style={styles.payoutBody}>
        <Text style={styles.payoutName}>
          {payout.driver?.full_name ?? t("unknownDriver")}
        </Text>
        <Text style={styles.payoutMeta}>{payout.id}</Text>
        <Text style={styles.payoutAmount}>{formatSAR(payout.amount_sar)}</Text>
        <Text style={styles.payoutDate}>
          {new Date(payout.created_at).toLocaleDateString()}
        </Text>
      </View>
      <Button title={t("release")} size="sm" onPress={onRelease} />
    </View>
  );
}

function ParcelReceiptCard({
  parcel,
  onVerify,
  onReject,
}: {
  parcel: {
    id: string;
    payment_receipt_url: string | null;
    sender: { full_name: string | null } | null;
    fare_sar: number;
    pickup_location: any;
    dropoff_location: any;
    created_at: string;
  };
  onVerify: () => void;
  onReject: () => void;
}) {
  const { t } = useTranslation();
  const pickup = parcel.pickup_location?.address ?? "—";
  const dropoff = parcel.dropoff_location?.address ?? "—";

  return (
    <View style={styles.receiptCard}>
      {parcel.payment_receipt_url ? (
        <Image
          source={{ uri: parcel.payment_receipt_url }}
          style={styles.receiptImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.receiptImage, styles.receiptPlaceholder]}>
          <Text style={styles.placeholderText}>{t("noReceipt")}</Text>
        </View>
      )}
      <View style={styles.receiptBody}>
        <Text style={styles.receiptStore}>
          {parcel.sender?.full_name ?? t("unknownSender")}
        </Text>
        <Text style={styles.receiptMeta}>{pickup} → {dropoff}</Text>
        <Text style={styles.receiptAmount}>{formatSAR(parcel.fare_sar)}</Text>
        <Text style={styles.receiptDate}>
          {new Date(parcel.created_at).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.receiptActions}>
        <Pressable onPress={onVerify} style={[styles.actionButton, styles.approveButton]} accessibilityRole="button">
          <Check size={16} color={palette.success} />
        </Pressable>
        <Pressable onPress={onReject} style={[styles.actionButton, styles.rejectButton]} accessibilityRole="button">
          <X size={16} color={palette.destructive} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: palette.card,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  headerOverline: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    color: palette.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: palette.foreground,
  },
  headerLink: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: palette.primary,
  },
  iconButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    backgroundColor: palette.card,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: palette.muted,
  },
  tabButtonActive: {
    backgroundColor: palette.primary,
  },
  tabButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.foreground,
  },
  tabButtonTextActive: {
    color: palette.primaryForeground,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: palette.foreground,
    marginTop: spacing.md,
  },
  subtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: radii["2xl"],
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: palette.border,
  },
  empty: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.mutedForeground,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  deniedTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: palette.foreground,
    marginTop: spacing.md,
  },
  deniedText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.mutedForeground,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  receiptCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  receiptImage: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: palette.muted,
  },
  receiptPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    color: palette.mutedForeground,
    textAlign: "center",
  },
  receiptBody: {
    flex: 1,
    marginLeft: spacing.md,
  },
  receiptStore: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: palette.foreground,
  },
  receiptMeta: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: palette.mutedForeground,
    marginTop: 2,
  },
  receiptAmount: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: palette.primary,
    marginTop: 4,
  },
  receiptDate: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: palette.mutedForeground,
    marginTop: 2,
  },
  receiptActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginLeft: spacing.sm,
  },
  actionButton: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  approveButton: {
    borderColor: palette.success,
    backgroundColor: `${palette.success}15`,
  },
  rejectButton: {
    borderColor: palette.destructive,
    backgroundColor: `${palette.destructive}15`,
  },
  payoutCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  payoutBody: {
    flex: 1,
  },
  payoutName: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: palette.foreground,
  },
  payoutMeta: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: palette.mutedForeground,
    marginTop: 2,
  },
  payoutAmount: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: palette.primary,
    marginTop: 4,
  },
  payoutDate: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: palette.mutedForeground,
    marginTop: 2,
  },
});
