import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ShoppingBag, Package, Wallet, AlertCircle, ChevronRight } from "lucide-react-native";
import { MerchantShell } from "../../src/components/MerchantShell";
import { useMerchantStore } from "../../src/hooks/useMerchantStore";
import { useMerchantOrders } from "../../src/hooks/useMerchantOrders";
import { useMerchantProducts } from "../../src/hooks/useMerchantProducts";
import { formatSAR } from "../../src/lib/format";
import { useTranslation } from "../../src/lib/i18n";
import { palette, spacing, shadows } from "../../src/lib/theme";
import { Button } from "../../src/components/Button";
import {
  getLast7Days,
  startOfDay,
  StatCard,
  timeAgo,
  orderStatusLabelKey,
  merchantStyles,
} from "./_components";

export default function MerchantDashboardTab() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: store } = useMerchantStore();
  const { data: orders } = useMerchantOrders(store?.id);
  const { data: products } = useMerchantProducts(store?.id);

  const todayStart = startOfDay(new Date());
  const todaysRevenue = orders
    .filter(
      (o) =>
        new Date(o.created_at) >= todayStart &&
        !["cancelled", "disputed"].includes(o.status),
    )
    .reduce((sum, o) => sum + Number(o.total), 0);

  const ordersToday = orders.filter(
    (o) => new Date(o.created_at).toDateString() === new Date().toDateString(),
  ).length;

  const newOrdersCount = orders.filter((o) => o.status === "new").length;

  const days = getLast7Days();
  const maxCount = Math.max(
    1,
    ...days.map(
      (d) =>
        orders.filter(
          (o) => startOfDay(new Date(o.created_at)).getTime() === d.date.getTime(),
        ).length,
    ),
  );
  const weeklyData = days.map((d) => ({
    ...d,
    count: orders.filter(
      (o) => startOfDay(new Date(o.created_at)).getTime() === d.date.getTime(),
    ).length,
  }));

  return (
    <MerchantShell>
      <View style={merchantStyles.tabContent}>
        <View>
          <Text style={merchantStyles.tabTitle}>{t("welcomeBack")}</Text>
          <Text style={merchantStyles.tabSubtitle}>{t("performanceToday")}</Text>
        </View>

        <View style={merchantStyles.statsGrid}>
          <StatCard
            icon={<ShoppingBag size={20} color={palette.primary} />}
            tint={`${palette.primary}12`}
            label={t("ordersToday")}
            value={String(ordersToday)}
          />
          <StatCard
            icon={<Package size={20} color={palette.warning} />}
            tint={`${palette.warning}12`}
            label={t("totalProducts")}
            value={String(products?.length ?? 0)}
          />
          <StatCard
            icon={<Wallet size={20} color={palette.success} />}
            tint={`${palette.success}12`}
            label={t("todaysRevenue")}
            value={formatSAR(todaysRevenue)}
          />
        </View>

        {newOrdersCount > 0 && (
          <Pressable
            onPress={() => router.push("/merchant-orders")}
            style={[merchantStyles.alertCard, { backgroundColor: `${palette.primary}12` }]}
          >
            <View style={merchantStyles.alertIcon}>
              <AlertCircle size={20} color={palette.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={merchantStyles.cardTitle}>{t("pendingOrders")}</Text>
              <Text style={merchantStyles.cardSubtitle}>
                {t("pendingOrdersCount", { count: newOrdersCount })}
              </Text>
            </View>
            <ChevronRight size={18} color={palette.primary} />
          </Pressable>
        )}

        <View style={[merchantStyles.card, shadows.card]}>
          <View style={merchantStyles.cardHeader}>
            <View>
              <Text style={merchantStyles.cardTitle}>{t("weeklyOrders")}</Text>
              <Text style={merchantStyles.cardSubtitle}>{t("last7Days")}</Text>
            </View>
          </View>
          <View style={merchantStyles.chart}>
            {weeklyData.map((d, i) => (
              <View key={i} style={merchantStyles.barWrapper}>
                <View
                  style={[
                    merchantStyles.bar,
                    {
                      height: `${(d.count / maxCount) * 100}%`,
                      backgroundColor: d.count > 0 ? palette.primary : palette.muted,
                    },
                  ]}
                />
                <Text style={merchantStyles.barLabel}>{d.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[merchantStyles.card, shadows.card]}>
          <View style={merchantStyles.cardHeader}>
            <Text style={merchantStyles.cardTitle}>{t("recentActivity")}</Text>
          </View>
          {orders.slice(0, 4).map((o) => (
            <View key={o.id} style={merchantStyles.activityRow}>
              <View style={merchantStyles.activityIcon}>
                <Package size={16} color={palette.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={merchantStyles.activityText}>
                  {t("order")} {formatSAR(Number(o.total))} —{" "}
                  {t(orderStatusLabelKey(o.status))}
                </Text>
                <Text style={merchantStyles.activityTime}>{timeAgo(o.created_at)}</Text>
              </View>
            </View>
          ))}
          {orders.length === 0 && (
            <Text style={merchantStyles.emptyText}>{t("noMerchantOrdersYet")}</Text>
          )}
        </View>

        <Button
          title={`+ ${t("addProduct")}`}
          variant="primary"
          size="lg"
          onPress={() => router.push("/merchant-products")}
        />
      </View>
    </MerchantShell>
  );
}
