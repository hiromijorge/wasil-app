import type { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation, type TranslationKey } from "../../src/lib/i18n";
import { palette, fonts, spacing, radii, shadows } from "../../src/lib/theme";
import type { Database } from "../../src/lib/database.types";

export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type StoreRow = Database["public"]["Tables"]["stores"]["Row"];
export type PayoutRow = Database["public"]["Tables"]["payouts"]["Row"];
export type SubscriptionChargeRow =
  Database["public"]["Tables"]["subscription_charges"]["Row"];
export type OrderStatus = OrderRow["status"];

export const PICKUP_FLOW: OrderStatus[] = [
  "new",
  "paid",
  "preparing",
  "ready",
  "completed",
];
export const DELIVERY_FLOW: OrderStatus[] = [
  "new",
  "paid",
  "preparing",
  "ready",
  "driver_assigned",
  "picked_up",
  "on_the_way",
  "delivered",
  "completed",
];

export function nextStatus(
  current: OrderStatus,
  deliveryType: "delivery" | "pickup",
  paymentMethod: "bank_transfer" | "cash" = "bank_transfer",
): OrderStatus | null {
  const baseFlow = deliveryType === "delivery" ? DELIVERY_FLOW : PICKUP_FLOW;
  const flow =
    paymentMethod === "cash" ? baseFlow.filter((s) => s !== "paid") : baseFlow;
  const idx = flow.indexOf(current);
  if (idx === -1 || idx >= flow.length - 1) return null;
  return flow[idx + 1];
}

export function statusColor(status: OrderStatus) {
  const colors: Record<OrderStatus, string> = {
    new: palette.destructive,
    paid: palette.warning,
    preparing: palette.warning,
    ready: palette.primary,
    driver_assigned: palette.primary,
    picked_up: palette.primary,
    on_the_way: palette.primary,
    delivered: palette.success,
    completed: palette.success,
    cancelled: palette.mutedForeground,
    disputed: palette.destructive,
  };
  return colors[status] ?? palette.mutedForeground;
}

export function statusBg(status: OrderStatus) {
  const colors: Record<OrderStatus, string> = {
    new: "#fdecec",
    paid: "#fff3e0",
    preparing: "#fff3e0",
    ready: "#e6f7f5",
    driver_assigned: "#e6f7f5",
    picked_up: "#e6f7f5",
    on_the_way: "#e6f7f5",
    delivered: "#e9f7ef",
    completed: "#e9f7ef",
    cancelled: "#f5f5f5",
    disputed: "#fdecec",
  };
  return colors[status] ?? "#f5f5f5";
}

export function orderStatusLabelKey(status: OrderStatus): TranslationKey {
  switch (status) {
    case "new":
      return "parcelStatusPending";
    case "paid":
      return "paymentVerified";
    case "preparing":
      return "parcelStatusAccepted";
    case "ready":
      return "parcelStatusPickedUp";
    case "driver_assigned":
      return "parcelStatusAccepted";
    case "picked_up":
      return "parcelStatusPickedUp";
    case "on_the_way":
      return "parcelStatusOnTheWay";
    case "delivered":
      return "parcelStatusDelivered";
    case "completed":
      return "parcelStatusDelivered";
    case "cancelled":
      return "parcelStatusCancelled";
    default:
      return "parcelStatusPending";
  }
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function getLast7Days() {
  const days: { date: Date; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      date: startOfDay(d),
      label: d.toLocaleDateString("en-US", { weekday: "narrow" }),
    });
  }
  return days;
}

export function timeAgo(iso?: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function StatCard({
  icon,
  tint,
  label,
  value,
  trend,
}: {
  icon: ReactNode;
  tint: string;
  label: string;
  value: string;
  trend?: string;
}) {
  return (
    <View style={[merchantStyles.statCard, shadows.card, { backgroundColor: palette.card }]}>
      <View style={[merchantStyles.statIcon, { backgroundColor: tint }]}>{icon}</View>
      <Text style={merchantStyles.statLabel}>{label}</Text>
      <View style={merchantStyles.statRow}>
        <Text style={merchantStyles.statValue}>{value}</Text>
        {trend && <Text style={merchantStyles.statTrend}>{trend}</Text>}
      </View>
    </View>
  );
}

export const merchantStyles = StyleSheet.create({
  tabContent: { paddingTop: spacing.md, gap: spacing.md },
  tabTitle: { fontFamily: fonts.display, fontSize: 24, color: palette.foreground },
  tabSubtitle: { fontFamily: fonts.sans, fontSize: 13, color: palette.mutedForeground },
  tabHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  backText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: palette.primary },
  statsGrid: { flexDirection: "row", gap: spacing.md },
  statCard: {
    flex: 1,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    backgroundColor: palette.card,
    ...shadows.card,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: palette.mutedForeground,
    marginTop: spacing.sm,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
    marginTop: 2,
  },
  statValue: { fontFamily: fonts.display, fontSize: 22, color: palette.foreground },
  statTrend: { fontFamily: fonts.sansBold, fontSize: 11, color: palette.success },
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
    marginBottom: spacing.sm,
  },
  cardTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: palette.foreground },
  cardSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: palette.mutedForeground,
    marginTop: 2,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${palette.primary}30`,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    backgroundColor: palette.card,
    alignItems: "center",
    justifyContent: "center",
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 120,
    gap: 6,
    marginTop: spacing.md,
  },
  barWrapper: { flex: 1, alignItems: "center" },
  bar: { width: "100%", borderRadius: radii.md },
  barLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    color: palette.mutedForeground,
    marginTop: 4,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.lg,
    backgroundColor: palette.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  activityText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: palette.foreground },
  activityTime: { fontFamily: fonts.sansMedium, fontSize: 11, color: palette.mutedForeground },
  emptyText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: palette.mutedForeground,
    textAlign: "center",
    marginTop: spacing.md,
  },
  orderCard: {
    backgroundColor: palette.card,
    borderRadius: radii["2xl"],
    padding: spacing.md,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  orderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontFamily: fonts.sansMedium, fontSize: 11, color: palette.mutedForeground },
  orderTotal: { fontFamily: fonts.display, fontSize: 18, color: palette.foreground },
  orderMeta: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  orderMetaText: { fontFamily: fonts.sansMedium, fontSize: 12, color: palette.mutedForeground },
  unreadBadge: {
    backgroundColor: palette.destructive,
    borderRadius: radii.full,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  unreadText: { fontFamily: fonts.sansBold, fontSize: 11, color: "#fff" },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.full },
  statusText: { fontFamily: fonts.sansBold, fontSize: 11, textTransform: "capitalize" },
  codBadge: {
    alignSelf: "flex-start",
    backgroundColor: palette.success,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
  },
  codBadgeText: { fontFamily: fonts.sansBold, fontSize: 11, color: palette.primaryForeground },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  itemName: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: palette.foreground },
  itemMeta: { fontFamily: fonts.sansMedium, fontSize: 12, color: palette.mutedForeground },
  itemTotal: { fontFamily: fonts.sansBold, fontSize: 14, color: palette.foreground },
  divider: { height: 1, backgroundColor: palette.border, marginVertical: spacing.sm },
  bigAmount: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: palette.foreground,
    marginTop: spacing.sm,
  },
  sectionTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: palette.foreground },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: palette.mutedForeground,
    marginTop: spacing.sm,
  },
  value: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: palette.foreground },
  field: { marginBottom: spacing.sm },
  emptyState: {
    backgroundColor: palette.card,
    borderRadius: radii["2xl"],
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    ...shadows.card,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: `${palette.primary}12`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: palette.foreground },
  emptySubtitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: palette.mutedForeground,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  refreshButton: {
    padding: spacing.sm,
    backgroundColor: palette.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
  },
  filterChips: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    backgroundColor: palette.card,
  },
  filterChipActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  filterChipText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: palette.foreground },
  filterChipTextActive: { color: palette.primaryForeground },
  accountMenuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 14,
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  accountMenuIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.lg,
    backgroundColor: `${palette.primary}12`,
    alignItems: "center",
    justifyContent: "center",
  },
  accountMenuLabel: {
    flex: 1,
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: palette.foreground,
  },
  menuSectionTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: palette.mutedForeground,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: palette.surface,
    borderRadius: radii.full,
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: radii.full,
  },
  segmentButtonActive: {
    backgroundColor: palette.card,
    ...shadows.card,
  },
  segmentText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.mutedForeground,
  },
  segmentTextActive: { color: palette.foreground },
});
