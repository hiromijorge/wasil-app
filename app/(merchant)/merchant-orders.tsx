import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  StyleSheet,
} from "react-native";
import { RefreshCw, ArrowLeft, ShoppingBag } from "lucide-react-native";
import { MerchantShell } from "../../src/components/MerchantShell";
import { useMerchantStore } from "../../src/hooks/useMerchantStore";
import { useMerchantOrders } from "../../src/hooks/useMerchantOrders";
import { useMerchantConversations } from "../../src/hooks/useMerchantConversations";
import { formatSAR } from "../../src/lib/format";
import { useTranslation } from "../../src/lib/i18n";
import { supabase } from "../../src/lib/supabase";
import { palette, fonts, spacing, shadows } from "../../src/lib/theme";
import { Button } from "../../src/components/Button";
import {
  nextStatus,
  statusColor,
  statusBg,
  orderStatusLabelKey,
  timeAgo,
  merchantStyles,
  type OrderRow,
  type OrderStatus,
} from "./_components";

type OrderFilter = "all" | "active" | "completed" | "cancelled";

const ORDER_FILTERS: { key: OrderFilter; label: import("../../src/lib/i18n").TranslationKey }[] = [
  { key: "all", label: "all" },
  { key: "active", label: "active" },
  { key: "completed", label: "completed" },
  { key: "cancelled", label: "cancelled" },
];

function matchesOrderFilter(status: OrderStatus, filter: OrderFilter) {
  if (filter === "all") return true;
  if (filter === "active") return !["completed", "cancelled"].includes(status);
  return status === filter;
}

export default function MerchantOrdersTab() {
  const { t } = useTranslation();
  const { data: store } = useMerchantStore();
  const {
    data: orders,
    isLoading: ordersLoading,
    refresh: refreshOrders,
    updateStatus,
  } = useMerchantOrders(store?.id);
  const { refresh: refreshConversations } = useMerchantConversations();

  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [subTab, setSubTab] = useState<"orders" | "deliveries">("orders");
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshOrders(), refreshConversations()]);
    setRefreshing(false);
  };

  const handleStatus = async (order: OrderRow, status: OrderStatus) => {
    await updateStatus(order.id, status);
    if (selectedOrder?.id === order.id) {
      setSelectedOrder({ ...order, status });
    }
  };

  const handleAssignDriver = async (order: OrderRow, driverName: string) => {
    await supabase.from("orders").update({ notes: driverName }).eq("id", order.id);
    await refreshOrders();
  };

  if (selectedOrder) {
    return (
      <MerchantShell>
        <OrderDetail
          order={selectedOrder}
          onBack={() => setSelectedOrder(null)}
          onStatus={handleStatus}
        />
      </MerchantShell>
    );
  }

  return (
    <MerchantShell>
      <View style={merchantStyles.tabContent}>
        <View style={merchantStyles.tabHeader}>
          <View>
            <Text style={merchantStyles.tabTitle}>{t("ordersTab")}</Text>
            <Text style={merchantStyles.tabSubtitle}>
              {t("manageOrdersAndDeliveries")}
            </Text>
          </View>
        </View>

        <View style={merchantStyles.segmentedControl}>
          <Pressable
            style={[
              merchantStyles.segmentButton,
              subTab === "orders" && merchantStyles.segmentButtonActive,
            ]}
            onPress={() => setSubTab("orders")}
          >
            <Text
              style={[
                merchantStyles.segmentText,
                subTab === "orders" && merchantStyles.segmentTextActive,
              ]}
            >
              {t("ordersTab")}
            </Text>
          </Pressable>
          <Pressable
            style={[
              merchantStyles.segmentButton,
              subTab === "deliveries" && merchantStyles.segmentButtonActive,
            ]}
            onPress={() => setSubTab("deliveries")}
          >
            <Text
              style={[
                merchantStyles.segmentText,
                subTab === "deliveries" && merchantStyles.segmentTextActive,
              ]}
            >
              {t("deliveriesTab")}
            </Text>
          </Pressable>
        </View>

        {subTab === "orders" ? (
          <OrdersList
            orders={orders}
            loading={ordersLoading}
            onSelect={setSelectedOrder}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        ) : (
          <DeliveriesList
            orders={orders}
            loading={ordersLoading}
            onSelect={setSelectedOrder}
            onStatus={handleStatus}
            onAssignDriver={handleAssignDriver}
            store={store}
          />
        )}
      </View>
    </MerchantShell>
  );
}

function OrdersList({
  orders,
  loading,
  onSelect,
  onRefresh,
  refreshing,
}: {
  orders: OrderRow[];
  loading: boolean;
  onSelect: (o: OrderRow) => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<OrderFilter>("all");

  if (loading) return <ActivityIndicator color={palette.primary} style={{ marginTop: 40 }} />;

  const filtered = orders.filter((o) => matchesOrderFilter(o.status, filter));

  return (
    <View style={merchantStyles.tabContent}>
      <View style={merchantStyles.tabHeader}>
        <View>
          <Text style={merchantStyles.tabTitle}>{t("ordersTab")}</Text>
          <Text style={merchantStyles.tabSubtitle}>
            {orders.length} {t("ordersTab").toLowerCase()}
          </Text>
        </View>
        <Pressable
          onPress={onRefresh}
          style={merchantStyles.refreshButton}
          disabled={refreshing}
        >
          <RefreshCw size={16} color={palette.foreground} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={merchantStyles.filterChips}
      >
        {ORDER_FILTERS.map(({ key, label }) => {
          const active = filter === key;
          return (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              style={[
                merchantStyles.filterChip,
                active && merchantStyles.filterChipActive,
              ]}
              accessibilityRole="button"
            >
              <Text
                style={[
                  merchantStyles.filterChipText,
                  active && merchantStyles.filterChipTextActive,
                ]}
              >
                {t(label)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {orders.length === 0 && (
        <View style={[merchantStyles.emptyState, shadows.card]}>
          <View style={merchantStyles.emptyIconCircle}>
            <ShoppingBag size={28} color={palette.primary} />
          </View>
          <Text style={merchantStyles.emptyTitle}>{t("noMerchantOrdersYet")}</Text>
          <Text style={merchantStyles.emptySubtitle}>
            {t("ordersWillAppearHere")}
          </Text>
        </View>
      )}

      {orders.length > 0 && filtered.length === 0 && (
        <Text style={merchantStyles.emptyText}>{t("noOrdersInFilter")}</Text>
      )}

      {filtered.map((o) => (
        <Pressable
          key={o.id}
          style={[merchantStyles.orderCard, shadows.card]}
          onPress={() => onSelect(o)}
        >
          <View style={merchantStyles.orderRow}>
            <View>
              <Text style={merchantStyles.orderId}>
                {o.id.slice(-6).toUpperCase()}
              </Text>
              <Text style={merchantStyles.orderTotal}>
                {formatSAR(Number(o.total))}
              </Text>
            </View>
            <View
              style={[
                merchantStyles.statusBadge,
                { backgroundColor: statusBg(o.status) },
              ]}
            >
              <Text
                style={[
                  merchantStyles.statusText,
                  { color: statusColor(o.status) },
                ]}
              >
                {t(orderStatusLabelKey(o.status))}
              </Text>
            </View>
          </View>
          {o.payment_method === "cash" && (
            <View style={[merchantStyles.codBadge, { marginTop: spacing.sm }]}>
              <Text style={merchantStyles.codBadgeText}>
                {t("cashOnDelivery")}
              </Text>
            </View>
          )}
          <View style={merchantStyles.orderMeta}>
            <Text style={merchantStyles.orderMetaText}>
              {(o.items as any[])?.reduce(
                (s, i) => s + (i.quantity || 1),
                0,
              )}{" "}
              {t("items")}
            </Text>
            <Text style={merchantStyles.orderMetaText}>·</Text>
            <Text style={merchantStyles.orderMetaText}>
              {o.delivery_type === "delivery" ? t("delivery") : t("pickup")}
            </Text>
            <Text style={merchantStyles.orderMetaText}>·</Text>
            <Text style={merchantStyles.orderMetaText}>
              {timeAgo(o.created_at)}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function DeliveriesList({
  orders,
  loading,
  onSelect,
  onStatus,
  onAssignDriver,
  store,
}: {
  orders: OrderRow[];
  loading: boolean;
  onSelect: (o: OrderRow) => void;
  onStatus: (o: OrderRow, s: OrderStatus) => void;
  onAssignDriver: (o: OrderRow, name: string) => void;
  store?: import("./_components").StoreRow | null;
}) {
  const { t } = useTranslation();
  const [assigning, setAssigning] = useState<string | null>(null);
  const [driverName, setDriverName] = useState("");
  const [broadcasting, setBroadcasting] = useState<string | null>(null);
  const deliveryOrders = orders.filter((o) => o.delivery_type === "delivery");

  const handleBroadcast = async (order: OrderRow) => {
    setBroadcasting(order.id);
    try {
      const { error } = await supabase.from("deliveries").insert({
        order_id: order.id,
        store_id: order.store_id,
        driver_id: null,
        status: "assigned",
        fee: Number(order.delivery_fee_sar),
        delivery_fee_sar: Number(order.delivery_fee_sar),
        customer_phone: order.phone,
        customer_address: order.address,
        pickup_location: store?.location ? { address: store.location } : null,
        delivery_location: order.address ? { address: order.address } : null,
      });
      if (error) throw error;
      await onStatus(order, "driver_assigned");
    } catch (e: any) {
      Alert.alert("Broadcast failed", e.message || String(e));
    } finally {
      setBroadcasting(null);
    }
  };

  if (loading) return <ActivityIndicator color={palette.primary} style={{ marginTop: 40 }} />;

  return (
    <View style={merchantStyles.tabContent}>
      <Text style={merchantStyles.tabTitle}>{t("deliveriesTab")}</Text>
      {deliveryOrders.length === 0 && (
        <Text style={merchantStyles.emptyText}>{t("noDeliveryOrders")}</Text>
      )}

      {deliveryOrders.map((o) => (
        <View key={o.id} style={[merchantStyles.orderCard, shadows.card]}>
          <Pressable onPress={() => onSelect(o)}>
            <View style={merchantStyles.orderRow}>
              <View>
                <Text style={merchantStyles.orderId}>
                  {o.id.slice(-6).toUpperCase()}
                </Text>
                <Text style={merchantStyles.orderTotal}>
                  {formatSAR(Number(o.total))}
                </Text>
              </View>
              <View
                style={[
                  merchantStyles.statusBadge,
                  { backgroundColor: statusBg(o.status) },
                ]}
              >
                <Text
                  style={[
                    merchantStyles.statusText,
                    { color: statusColor(o.status) },
                  ]}
                >
                  {o.status}
                </Text>
              </View>
            </View>
          </Pressable>

          {o.payment_method === "cash" && (
            <View style={[merchantStyles.codBadge, { marginBottom: spacing.sm }]}>
              <Text style={merchantStyles.codBadgeText}>
                {t("cashOnDelivery")}
              </Text>
            </View>
          )}

          <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
            {o.status === "ready" && (
              <>
                <Button
                  title={t("assignOwnDriver")}
                  variant="outline"
                  size="sm"
                  onPress={() => setAssigning(o.id)}
                />
                <Button
                  title={
                    broadcasting === o.id ? t("broadcasting") : t("broadcastDrivers")
                  }
                  variant="secondary"
                  size="sm"
                  loading={broadcasting === o.id}
                  onPress={() => handleBroadcast(o)}
                />
              </>
            )}
            {o.status === "driver_assigned" && (
              <Button
                title={t("markPickedUp")}
                variant="primary"
                size="sm"
                onPress={() => onStatus(o, "picked_up")}
              />
            )}
            {o.status === "picked_up" && (
              <Button
                title={t("driverOnTheWay")}
                variant="primary"
                size="sm"
                onPress={() => onStatus(o, "on_the_way")}
              />
            )}
            {o.status === "on_the_way" && (
              <Button
                title={t("markDelivered")}
                variant="primary"
                size="sm"
                onPress={() => onStatus(o, "delivered")}
              />
            )}
          </View>

          <Modal visible={assigning === o.id} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{t("assignDriver")}</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder={t("driverNamePlaceholder")}
                  value={driverName}
                  onChangeText={setDriverName}
                />
                <Button
                  title={t("assign")}
                  variant="primary"
                  onPress={async () => {
                    await onAssignDriver(o, driverName);
                    await onStatus(o, "driver_assigned");
                    setAssigning(null);
                    setDriverName("");
                  }}
                />
                <Button
                  title={t("cancel")}
                  variant="ghost"
                  onPress={() => setAssigning(null)}
                  style={{ marginTop: spacing.sm }}
                />
              </View>
            </View>
          </Modal>
        </View>
      ))}
    </View>
  );
}

function OrderDetail({
  order,
  onBack,
  onStatus,
}: {
  order: OrderRow;
  onBack: () => void;
  onStatus: (o: OrderRow, s: OrderStatus) => void;
}) {
  const { t } = useTranslation();
  const items = (order.items as any[]) ?? [];
  const next = nextStatus(
    order.status,
    order.delivery_type as any,
    order.payment_method ?? "bank_transfer",
  );

  return (
    <View style={merchantStyles.tabContent}>
      <Pressable onPress={onBack} style={merchantStyles.backButton}>
        <ArrowLeft size={18} color={palette.primary} />
        <Text style={merchantStyles.backText}>{t("backToOrders")}</Text>
      </Pressable>

      <View style={[merchantStyles.card, shadows.card]}>
        <View style={merchantStyles.orderRow}>
          <View>
            <Text style={merchantStyles.orderId}>
              {order.id.slice(-6).toUpperCase()}
            </Text>
            <Text style={merchantStyles.bigAmount}>
              {formatSAR(Number(order.total))}
            </Text>
          </View>
          <View
            style={[
              merchantStyles.statusBadge,
              { backgroundColor: statusBg(order.status) },
            ]}
          >
            <Text
              style={[
                merchantStyles.statusText,
                { color: statusColor(order.status) },
              ]}
            >
              {order.status}
            </Text>
          </View>
        </View>

        {order.payment_method === "cash" && (
          <View style={merchantStyles.codBadge}>
            <Text style={merchantStyles.codBadgeText}>
              {t("cashOnDelivery")}
            </Text>
          </View>
        )}

        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          <Text style={merchantStyles.label}>{t("phoneLabel")}</Text>
          <Text style={merchantStyles.value}>{order.phone}</Text>
          {order.address && (
            <>
              <Text style={merchantStyles.label}>{t("addressLabel")}</Text>
              <Text style={merchantStyles.value}>{order.address}</Text>
            </>
          )}
          {order.notes && (
            <>
              <Text style={merchantStyles.label}>{t("notesLabel")}</Text>
              <Text style={merchantStyles.value}>{order.notes}</Text>
            </>
          )}
        </View>
      </View>

      <View style={[merchantStyles.card, shadows.card]}>
        <Text style={merchantStyles.cardTitle}>{t("items")}</Text>
        {items.map((item: any, idx: number) => (
          <View key={idx} style={merchantStyles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={merchantStyles.itemName}>{item.name}</Text>
              <Text style={merchantStyles.itemMeta}>
                {formatSAR(item.price_sar ?? item.price)} × {item.quantity}
              </Text>
            </View>
            <Text style={merchantStyles.itemTotal}>
              {formatSAR((item.price_sar ?? item.price) * item.quantity)}
            </Text>
          </View>
        ))}
        <View style={merchantStyles.divider} />
        <View style={merchantStyles.itemRow}>
          <Text style={merchantStyles.itemName}>{t("subtotal")}</Text>
          <Text style={merchantStyles.itemTotal}>
            {formatSAR(Number(order.subtotal))}
          </Text>
        </View>
        <View style={merchantStyles.itemRow}>
          <Text style={merchantStyles.itemName}>{t("deliveryFee")}</Text>
          <Text style={merchantStyles.itemTotal}>
            {formatSAR(Number(order.delivery_fee))}
          </Text>
        </View>
      </View>

      {next && (
        <Button
          title={t("markAs", { status: next.replace(/_/g, " ") })}
          variant="primary"
          size="lg"
          onPress={() => onStatus(order, next)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: palette.card,
    borderRadius: 12,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: palette.foreground,
    marginBottom: spacing.md,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    padding: spacing.md,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: palette.foreground,
    marginBottom: spacing.md,
  },
});
