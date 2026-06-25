import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Package, RotateCcw, ShoppingBag, Truck, ChevronRight, Clock, Banknote } from "lucide-react-native";
import { TopBar } from "../../src/components/TopBar";
import { Button } from "../../src/components/Button";
import { Card, CardPressable } from "../../src/components/Card";
import { SectionHeader } from "../../src/components/SectionHeader";
import { EmptyState } from "../../src/components/EmptyState";
import { palette, fonts, typography, spacing, radii } from "../../src/lib/theme";
import { useCustomerOrders } from "../../src/hooks/useCustomerOrders";
import { useCustomerParcels, type ParcelRow } from "../../src/hooks/useCustomerParcels";
import { useTranslation, type TranslationKey } from "../../src/lib/i18n";
import { formatSAR } from "../../src/lib/format";

const MD_BREAKPOINT = 768;
type ActivityTab = "orders" | "sends";
type OrderFilter = "all" | "active" | "completed" | "cancelled";

const ORDER_FILTERS: { key: OrderFilter; label: TranslationKey }[] = [
  { key: "all", label: "all" },
  { key: "active", label: "active" },
  { key: "completed", label: "completed" },
  { key: "cancelled", label: "cancelled" },
];

function orderStatusColor(status: string) {
  switch (status) {
    case "completed":
      return palette.success;
    case "cancelled":
      return palette.destructive;
    case "paid":
    case "preparing":
    case "ready":
      return palette.warning;
    default:
      return palette.primary;
  }
}

function orderStatusBg(status: string) {
  switch (status) {
    case "completed":
      return "#e9f7ef";
    case "cancelled":
      return "#fdecec";
    case "paid":
    case "preparing":
    case "ready":
      return "#fff3e0";
    default:
      return palette.primarySoft;
  }
}

function paymentColor(status: "pending" | "verified" | "rejected") {
  switch (status) {
    case "verified":
      return palette.success;
    case "rejected":
      return palette.destructive;
    default:
      return palette.warning;
  }
}

function paymentBg(status: "pending" | "verified" | "rejected") {
  switch (status) {
    case "verified":
      return "#e9f7ef";
    case "rejected":
      return "#fdecec";
    default:
      return "#fff3e0";
  }
}

function parcelStatusKey(status: string): TranslationKey {
  switch (status) {
    case "pending":
      return "parcelStatusPending";
    case "accepted":
      return "parcelStatusAccepted";
    case "picked_up":
      return "parcelStatusPickedUp";
    case "on_the_way":
      return "parcelStatusOnTheWay";
    case "delivered":
      return "parcelStatusDelivered";
    case "cancelled":
      return "parcelStatusCancelled";
    default:
      return "parcelStatusPending";
  }
}

export default function ActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= MD_BREAKPOINT;
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<ActivityTab>("orders");
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const {
    data: orders = [],
    isLoading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useCustomerOrders();
  const {
    data: parcels = [],
    isLoading: parcelsLoading,
    refresh: refreshParcels,
  } = useCustomerParcels();

  const isLoading = activeTab === "orders" ? ordersLoading : parcelsLoading;
  const error = activeTab === "orders" ? ordersError : null;

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === "all") return true;
    if (orderFilter === "active") return o.status !== "completed" && o.status !== "cancelled";
    return o.status === orderFilter;
  });

  return (
    <View style={styles.container}>
      <TopBar showCart />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        <SectionHeader title={t("activityTitle")} subtitle={t("activitySubtitle")} />

        {/* Segmented tabs */}
        <View style={styles.segmented}>
          <Pressable
            onPress={() => setActiveTab("orders")}
            style={[styles.segment, activeTab === "orders" && styles.segmentActive]}
            accessibilityRole="button"
          >
            <ShoppingBag
              size={16}
              color={activeTab === "orders" ? palette.primaryForeground : palette.mutedForeground}
            />
            <Text
              style={[
                styles.segmentText,
                activeTab === "orders" && styles.segmentTextActive,
              ]}
            >
              {t("ordersTab")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("sends")}
            style={[styles.segment, activeTab === "sends" && styles.segmentActive]}
            accessibilityRole="button"
          >
            <Truck
              size={16}
              color={activeTab === "sends" ? palette.primaryForeground : palette.mutedForeground}
            />
            <Text
              style={[
                styles.segmentText,
                activeTab === "sends" && styles.segmentTextActive,
              ]}
            >
              {t("sendsTab")}
            </Text>
          </Pressable>
        </View>

        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator color={palette.primary} />
          </View>
        )}

        {error && (
          <Pressable style={styles.errorRow} onPress={() => refetchOrders()}>
            <Text style={styles.errorText}>{t("couldNotLoadOrders")}</Text>
            <RotateCcw size={14} color={palette.destructive} />
          </Pressable>
        )}

        {/* Orders tab */}
        {activeTab === "orders" && !ordersLoading && !ordersError && (
          <>
            {orders.length === 0 ? (
              <View style={styles.empty}>
                <EmptyState
                  icon={<ShoppingBag size={28} color={palette.primary} />}
                  title={t("noOrdersYet")}
                />
                <Button
                  title={t("continueShopping")}
                  variant="primary"
                  size="lg"
                  onPress={() => router.push("/(tabs)/")}
                  style={styles.emptyButton}
                />
              </View>
            ) : (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterChips}
                >
                  {ORDER_FILTERS.map(({ key, label }) => {
                    const active = orderFilter === key;
                    return (
                      <Pressable
                        key={key}
                        onPress={() => setOrderFilter(key)}
                        style={[styles.filterChip, active && styles.filterChipActive]}
                        accessibilityRole="button"
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            active && styles.filterChipTextActive,
                          ]}
                        >
                          {t(label)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {filteredOrders.length === 0 ? (
                  <EmptyState title={t("noOrdersInFilter")} />
                ) : (
                  <View style={isDesktop ? styles.gridDesktop : styles.list}>
                    {filteredOrders.map((order) => (
                      <CardPressable
                        key={order.id}
                        onPress={() => router.push(`/order/${order.id}`)}
                        padding="lg"
                        style={styles.card}
                        accessibilityRole="button"
                      >
                        <View style={styles.cardHeader}>
                          <View style={styles.cardHeaderText}>
                            <Text style={styles.storeName} numberOfLines={1}>
                              {order.storeName ?? t("storesTitle")}
                            </Text>
                            <Text style={styles.orderId}>
                              {t("orderId", { id: order.id.slice(-6).toUpperCase() })}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: orderStatusBg(order.status) },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusText,
                                { color: orderStatusColor(order.status) },
                              ]}
                            >
                              {order.status}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.cardBody}>
                          <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>{t("orderTotal")}</Text>
                            <Text style={styles.totalValue}>{formatSAR(order.total)}</Text>
                          </View>
                          <View style={styles.paymentRow}>
                            {order.paymentMethod === "cash" ? (
                              <>
                                <Banknote size={12} color={palette.success} />
                                <Text style={[styles.paymentText, { color: palette.success }]}>
                                  {t("cashOnDelivery")}
                                </Text>
                              </>
                            ) : (
                              <>
                                <Clock size={12} color={paymentColor(order.paymentStatus)} />
                                <Text
                                  style={[
                                    styles.paymentText,
                                    { color: paymentColor(order.paymentStatus) },
                                  ]}
                                >
                                  {order.paymentStatus}
                                </Text>
                              </>
                            )}
                          </View>
                        </View>

                        <View style={styles.cardFooter}>
                          <Text style={styles.date}>
                            {new Date(order.createdAt).toLocaleDateString()}
                          </Text>
                          <ChevronRight size={16} color={palette.mutedForeground} />
                        </View>
                      </CardPressable>
                    ))}
                  </View>
                )}
              </>
            )}
          </>
        )}

        {/* Sends tab */}
        {activeTab === "sends" && !parcelsLoading && (
          <>
            {parcels.length === 0 ? (
              <View style={styles.empty}>
                <EmptyState
                  icon={<Truck size={28} color={palette.primary} />}
                  title={t("noSendsYet")}
                />
                <Button
                  title={t("sendCta")}
                  variant="primary"
                  size="lg"
                  onPress={() => router.push("/send")}
                  style={styles.emptyButton}
                />
              </View>
            ) : (
              <View style={isDesktop ? styles.gridDesktop : styles.list}>
                {parcels.map((parcel: ParcelRow) => (
                  <CardPressable
                    key={parcel.id}
                    onPress={() => router.push(`/parcel/${parcel.id}`)}
                    padding="lg"
                    style={styles.card}
                    accessibilityRole="button"
                  >
                    <View style={styles.cardHeader}>
                      <View>
                        <Text style={styles.orderId}>
                          {t("parcelId", { id: parcel.id.slice(-6).toUpperCase() })}
                        </Text>
                        <Text style={styles.storeName}>
                          {t("parcelFare")}: {formatSAR(Number(parcel.fare_sar))}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              parcel.payment_method === "cash"
                                ? `${palette.success}20`
                                : paymentBg(parcel.payment_status),
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color:
                                parcel.payment_method === "cash"
                                  ? palette.success
                                  : paymentColor(parcel.payment_status),
                            },
                          ]}
                        >
                          {parcel.payment_method === "cash"
                            ? t("cashOnDelivery")
                            : parcel.payment_status === "verified"
                            ? t("paymentVerified")
                            : parcel.payment_status === "rejected"
                            ? t("paymentRejected")
                            : t("pendingPayment")}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardBody}>
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>{t("parcelStatus")}</Text>
                        <Text style={styles.totalValue}>
                          {t(parcelStatusKey(parcel.status))}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={styles.date}>
                        {new Date(parcel.created_at).toLocaleDateString()}
                      </Text>
                      <ChevronRight size={16} color={palette.mutedForeground} />
                    </View>
                  </CardPressable>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    width: "100%",
    maxWidth: 1152,
    alignSelf: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  heading: {
    ...typography.pageTitle,
    marginBottom: spacing.xs,
  },
  subheading: {
    ...typography.pageSubtitle,
    marginBottom: spacing.md,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: palette.card,
    borderRadius: radii.full,
    padding: 4,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: spacing.sm,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
  },
  segmentActive: {
    backgroundColor: palette.primary,
  },
  segmentText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.mutedForeground,
  },
  segmentTextActive: {
    color: palette.primaryForeground,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  filterChips: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radii.full,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
  },
  filterChipActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  filterChipText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.foreground,
  },
  filterChipTextActive: {
    color: palette.primaryForeground,
  },
  emptyStateInline: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  emptyStateInlineText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: palette.mutedForeground,
  },
  list: {
    gap: spacing.md,
  },
  gridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  card: {
    width: "100%",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  cardHeaderText: {
    flex: 1,
  },
  orderId: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: palette.mutedForeground,
    marginTop: 2,
  },
  storeName: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: palette.foreground,
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radii.full,
  },
  statusText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    textTransform: "capitalize",
  },
  cardBody: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    gap: spacing.xs,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
  },
  totalValue: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: palette.foreground,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  paymentText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    textTransform: "capitalize",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  date: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: palette.mutedForeground,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: palette.foreground,
    textAlign: "center",
  },
  emptyButton: {
    marginTop: spacing.sm,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  errorText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: palette.destructive,
  },
});
