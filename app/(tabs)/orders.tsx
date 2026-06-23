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
import { Package, RotateCcw } from "lucide-react-native";
import { TopBar } from "../../src/components/TopBar";
import { Button } from "../../src/components/Button";
import { palette, fonts, spacing, radii, shadows } from "../../src/lib/theme";
import { useCustomerOrders, type CustomerOrder } from "../../src/hooks/useCustomerOrders";
import { useTranslation } from "../../src/lib/i18n";
import { formatSAR } from "../../src/lib/demo-data";

const MD_BREAKPOINT = 768;

function statusColor(status: CustomerOrder["status"]) {
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

function statusBg(status: CustomerOrder["status"]) {
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

function paymentColor(status: CustomerOrder["paymentStatus"]) {
  switch (status) {
    case "verified":
      return palette.success;
    case "rejected":
      return palette.destructive;
    default:
      return palette.warning;
  }
}

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= MD_BREAKPOINT;
  const { t } = useTranslation();
  const { data: orders, isLoading, error, refetch } = useCustomerOrders();

  return (
    <View style={styles.container}>
      <TopBar title={t("myOrders")} showCart />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator color={palette.primary} />
          </View>
        )}

        {error && (
          <Pressable style={styles.errorRow} onPress={() => refetch()}>
            <Text style={styles.errorText}>{t("couldNotLoadOrders")}</Text>
            <RotateCcw size={14} color={palette.destructive} />
          </Pressable>
        )}

        {!isLoading && !error && (orders?.length === 0 || !orders) && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Package size={32} color={palette.primary} />
            </View>
            <Text style={styles.emptyTitle}>{t("noOrdersYet")}</Text>
            <Button
              title={t("continueShopping")}
              variant="primary"
              size="lg"
              onPress={() => router.push("/(tabs)/")}
              style={styles.emptyButton}
            />
          </View>
        )}

        {!isLoading && !error && orders && orders.length > 0 && (
          <View style={isDesktop ? styles.gridDesktop : styles.list}>
            {orders.map((order) => (
              <View
                key={order.id}
                style={[styles.card, shadows.card]}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderId}>
                      {t("orderId", { id: order.id.slice(-6).toUpperCase() })}
                    </Text>
                    <Text style={styles.storeName}>
                      {order.storeName ?? t("storesTitle")}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusBg(order.status) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: statusColor(order.status) },
                      ]}
                    >
                      {order.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>{t("orderTotal")}</Text>
                    <Text style={styles.metaValue}>{formatSAR(order.total)}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>{t("paymentStatus")}</Text>
                    <Text style={[styles.metaValue, { color: paymentColor(order.paymentStatus) }]}>
                      {order.paymentStatus}
                    </Text>
                  </View>
                </View>

                <Text style={styles.date}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
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
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
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
    backgroundColor: palette.card,
    borderRadius: radii["2xl"],
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    width: "100%",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  orderId: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.foreground,
  },
  storeName: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: palette.mutedForeground,
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.full,
  },
  statusText: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    textTransform: "capitalize",
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: palette.mutedForeground,
  },
  metaValue: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: palette.foreground,
    marginTop: 2,
  },
  date: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: palette.mutedForeground,
    marginTop: spacing.sm,
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
