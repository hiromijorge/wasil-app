import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  Switch,
  ActivityIndicator,
  Modal,
  Alert,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  LayoutDashboard,
  ShoppingBag,
  Truck,
  Wallet,
  CreditCard,
  User,
  MessageCircle,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  Plus,
  X,
  Upload,
  Package,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../src/lib/supabase";
import { useMerchantStore } from "../src/hooks/useMerchantStore";
import { useMerchantOrders } from "../src/hooks/useMerchantOrders";
import { useMerchantPayouts } from "../src/hooks/useMerchantPayouts";
import { useMerchantSubscription } from "../src/hooks/useMerchantSubscription";
import { useBankAccount } from "../src/hooks/useBankAccount";
import { useMerchantConversations } from "../src/hooks/useMerchantConversations";
import { formatSAR } from "../src/lib/demo-data";
import { useTranslation, type TranslationKey } from "../src/lib/i18n";
import { palette, fonts, spacing, radii, shadows } from "../src/lib/theme";
import { Button } from "../src/components/Button";
import { Input } from "../src/components/Input";
import { LangSwitcher } from "../src/components/LangSwitcher";
import { DashboardHeader, DashboardPage } from "../src/components/DashboardLayout";
import type { Database } from "../src/lib/database.types";

const TABS = [
  { key: "dashboard", label: "dashboardTab" as TranslationKey, Icon: LayoutDashboard },
  { key: "orders", label: "ordersTab" as TranslationKey, Icon: ShoppingBag },
  { key: "deliveries", label: "deliveriesTab" as TranslationKey, Icon: Truck },
  { key: "messages", label: "messagesTab" as TranslationKey, Icon: MessageCircle },
  { key: "payouts", label: "payoutsTab" as TranslationKey, Icon: Wallet },
  { key: "billing", label: "billingTab" as TranslationKey, Icon: CreditCard },
  { key: "profile", label: "profileTab" as TranslationKey, Icon: User },
] as const;

type TabKey = (typeof TABS)[number]["key"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderStatus = OrderRow["status"];
type PayoutRow = Database["public"]["Tables"]["payouts"]["Row"];
type SubscriptionChargeRow = Database["public"]["Tables"]["subscription_charges"]["Row"];

const PICKUP_FLOW: OrderStatus[] = ["new", "paid", "preparing", "ready", "completed"];
const DELIVERY_FLOW: OrderStatus[] = [
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

function nextStatus(current: OrderStatus, deliveryType: "delivery" | "pickup"): OrderStatus | null {
  const flow = deliveryType === "delivery" ? DELIVERY_FLOW : PICKUP_FLOW;
  const idx = flow.indexOf(current);
  if (idx === -1 || idx >= flow.length - 1) return null;
  return flow[idx + 1];
}

function statusColor(status: OrderStatus) {
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

function statusBg(status: OrderStatus) {
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

export default function MerchantDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { data: store, isLoading: storeLoading } = useMerchantStore();
  const storeId = store?.id;

  const {
    data: orders,
    isLoading: ordersLoading,
    refresh: refreshOrders,
    updateStatus,
  } = useMerchantOrders(storeId);
  const { data: payouts, isLoading: payoutsLoading, refresh: refreshPayouts } = useMerchantPayouts(storeId);
  const { data: charges, isLoading: chargesLoading, refresh: refreshCharges } = useMerchantSubscription(storeId);
  const { data: conversations, isLoading: conversationsLoading, refresh: refreshConversations } = useMerchantConversations();
  const { data: bankAccount } = useBankAccount();

  const [tab, setTab] = useState<TabKey>("dashboard");
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [open, setOpen] = useState(store?.open ?? true);
  const [refreshing, setRefreshing] = useState(false);
  const [productModal, setProductModal] = useState(false);

  useEffect(() => {
    if (store) setOpen(store.open);
  }, [store]);

  const handleToggleOpen = async (value: boolean) => {
    setOpen(value);
    if (store?.id) {
      await supabase.from("stores").update({ open: value }).eq("id", store.id);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshOrders(), refreshPayouts(), refreshCharges(), refreshConversations()]);
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

  const newOrdersCount = orders.filter((o) => o.status === "new").length;
  const ordersToday = orders.filter(
    (o) => new Date(o.created_at).toDateString() === new Date().toDateString()
  ).length;

  const currentCharge = charges[0];
  const isOverdue =
    currentCharge?.status === "overdue" ||
    (currentCharge?.status === "unpaid" &&
      new Date() > new Date(new Date(currentCharge.period_end).getTime() + 7 * 24 * 60 * 60 * 1000));

  const renderTab = () => {
    if (selectedOrder) {
      return (
        <OrderDetail
          order={selectedOrder}
          onBack={() => setSelectedOrder(null)}
          onStatus={handleStatus}
        />
      );
    }

    switch (tab) {
      case "dashboard":
        return (
          <DashboardTab
            orders={orders}
            ordersToday={ordersToday}
            newOrdersCount={newOrdersCount}
            onAddProduct={() => setProductModal(true)}
          />
        );
      case "orders":
        return (
          <OrdersTab
            orders={orders}
            loading={ordersLoading}
            onSelect={setSelectedOrder}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        );
      case "deliveries":
        return (
          <DeliveriesTab
            orders={orders}
            loading={ordersLoading}
            onSelect={setSelectedOrder}
            onStatus={handleStatus}
            onAssignDriver={handleAssignDriver}
            store={store}
          />
        );
      case "messages":
        return (
          <MessagesTab
            conversations={conversations}
            loading={conversationsLoading}
          />
        );
      case "payouts":
        return <PayoutsTab payouts={payouts} loading={payoutsLoading} />;
      case "billing":
        return (
          <BillingTab
            charges={charges}
            loading={chargesLoading}
            bankAccount={bankAccount}
            storeId={storeId}
            isOverdue={isOverdue}
            onRefresh={refreshCharges}
          />
        );
      case "profile":
        return <ProfileTab store={store as any} />;
      default:
        return null;
    }
  };

  if (storeLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DashboardHeader
        overline={t("merchantConsole")}
        title={store?.name ?? t("store")}
        right={
          <View style={styles.openSwitch}>
            <LangSwitcher />
            <Switch
              value={open}
              onValueChange={handleToggleOpen}
              disabled={storeLoading || !store}
              trackColor={{ false: palette.mutedForeground, true: palette.success }}
              thumbColor={palette.card}
            />
            <Text style={[styles.openText, { color: open ? palette.success : palette.mutedForeground }]}>
              {open ? t("open") : t("closed")}
            </Text>
          </View>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 96 + insets.bottom,
        }}
      >
        <DashboardPage>
          {isOverdue && (
            <View style={[styles.restrictionBanner, { marginBottom: spacing.md }]}>
              <AlertCircle size={18} color={palette.destructive} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.restrictionTitle}>{t("subscriptionOverdue")}</Text>
                <Text style={styles.restrictionMessage}>
                  {t("subscriptionOverdueMessage")}
                </Text>
                <Pressable onPress={() => setTab("billing")}>
                  <Text style={styles.restrictionLink}>{t("payNow")}</Text>
                </Pressable>
              </View>
            </View>
          )}

          {renderTab()}
        </DashboardPage>
      </ScrollView>

      <View style={[styles.bottomNav, { bottom: insets.bottom + spacing.md }]}>
        {TABS.map(({ key, label, Icon }) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => {
                setTab(key);
                setSelectedOrder(null);
              }}
            >
              <View style={styles.navIconWrapper}>
                <Icon size={20} color={active ? palette.primaryForeground : palette.mutedForeground} />
                {key === "orders" && newOrdersCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{newOrdersCount}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.navLabel, { color: active ? palette.primaryForeground : palette.mutedForeground }]}>
                {t(label)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <AddProductModal visible={productModal} onClose={() => setProductModal(false)} />
    </View>
  );
}

function DashboardTab({
  orders,
  ordersToday,
  newOrdersCount,
  onAddProduct,
}: {
  orders: OrderRow[];
  ordersToday: number;
  newOrdersCount: number;
  onAddProduct: () => void;
}) {
  const { t } = useTranslation();
  const chartData = [42, 58, 47, 71, 65, 88, 96];
  const days = [t("mon"), t("tue"), t("wed"), t("thu"), t("fri"), t("sat"), t("sun")];

  return (
    <View style={styles.tabContent}>
      <View>
        <Text style={styles.tabTitle}>{t("welcomeBack")}</Text>
        <Text style={styles.tabSubtitle}>{t("performanceToday")}</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard icon="👁️" tint="#e6f7f5" label={t("viewsToday")} value="124" trend="+12%" />
        <StatCard icon="💬" tint="#f0f7e6" label={t("messages")} value="38" trend="+5%" />
        <StatCard icon="📦" tint="#fff7e6" label={t("ordersToday")} value={String(ordersToday)} trend="+22%" />
      </View>

      <View style={[styles.card, shadows.card]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>{t("weeklyTraffic")}</Text>
            <Text style={styles.cardSubtitle}>{t("last7Days")}</Text>
          </View>
          <View style={styles.growthPill}>
            <Text style={styles.growthText}>+18%</Text>
          </View>
        </View>
        <View style={styles.chart}>
          {chartData.map((h, i) => (
            <View key={i} style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  { height: `${h}%`, backgroundColor: `rgba(0, 91, 87, ${0.3 + h / 150})` },
                ]}
              />
              <Text style={styles.barLabel}>{days[i]}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.card, shadows.card]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{t("recentActivity")}</Text>
        </View>
        {orders.slice(0, 4).map((o) => (
          <View key={o.id} style={styles.activityRow}>
            <View style={styles.activityIcon}>
              <Package size={16} color={palette.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.activityText}>
                {t("order")} {formatSAR(Number(o.total))} — {o.status}
              </Text>
              <Text style={styles.activityTime}>{timeAgo(o.created_at)}</Text>
            </View>
          </View>
        ))}
        {orders.length === 0 && (
          <Text style={styles.emptyText}>{t("noOrdersYet")}</Text>
        )}
      </View>

      <Button title={`+ ${t("addProduct")}`} variant="primary" size="lg" onPress={onAddProduct} />
    </View>
  );
}

function OrdersTab({
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
  if (loading) return <ActivityIndicator color={palette.primary} style={{ marginTop: 40 }} />;

  return (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <View>
          <Text style={styles.tabTitle}>{t("ordersTab")}</Text>
          <Text style={styles.tabSubtitle}>{orders.length} {t("ordersTab").toLowerCase()}</Text>
        </View>
        <Pressable onPress={onRefresh} style={styles.refreshButton} disabled={refreshing}>
          <RefreshCw size={16} color={palette.foreground} />
        </Pressable>
      </View>

      {orders.length === 0 && <Text style={styles.emptyText}>{t("noOrdersYet")}</Text>}

      {orders.map((o) => (
        <Pressable key={o.id} style={[styles.orderCard, shadows.card]} onPress={() => onSelect(o)}>
          <View style={styles.orderRow}>
            <View>
              <Text style={styles.orderId}>{o.id.slice(-6).toUpperCase()}</Text>
              <Text style={styles.orderTotal}>{formatSAR(Number(o.total))}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusBg(o.status) }]}>
              <Text style={[styles.statusText, { color: statusColor(o.status) }]}>{o.status}</Text>
            </View>
          </View>
          <View style={styles.orderMeta}>
            <Text style={styles.orderMetaText}>
              {(o.items as any[])?.reduce((s, i) => s + (i.quantity || 1), 0)} {t("items")}
            </Text>
            <Text style={styles.orderMetaText}>·</Text>
            <Text style={styles.orderMetaText}>{o.delivery_type === "delivery" ? t("delivery") : t("pickup")}</Text>
            <Text style={styles.orderMetaText}>·</Text>
            <Text style={styles.orderMetaText}>{timeAgo(o.created_at)}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

type StoreRow = Database["public"]["Tables"]["stores"]["Row"];

function DeliveriesTab({
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
  store?: StoreRow | null;
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
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>{t("deliveriesTab")}</Text>
      {deliveryOrders.length === 0 && <Text style={styles.emptyText}>{t("noDeliveryOrders")}</Text>}

      {deliveryOrders.map((o) => (
        <View key={o.id} style={[styles.orderCard, shadows.card]}>
          <Pressable onPress={() => onSelect(o)}>
            <View style={styles.orderRow}>
              <View>
                <Text style={styles.orderId}>{o.id.slice(-6).toUpperCase()}</Text>
                <Text style={styles.orderTotal}>{formatSAR(Number(o.total))}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusBg(o.status) }]}>
                <Text style={[styles.statusText, { color: statusColor(o.status) }]}>{o.status}</Text>
              </View>
            </View>
          </Pressable>

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
                  title={broadcasting === o.id ? t("broadcasting") : t("broadcastDrivers")}
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

function MessagesTab({
  conversations,
  loading,
}: {
  conversations: import("../src/hooks/useMerchantConversations").Conversation[];
  loading: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();

  if (loading) return <ActivityIndicator color={palette.primary} style={{ marginTop: 40 }} />;

  return (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>{t("messagesTab")}</Text>
      {conversations.length === 0 && (
        <Text style={styles.emptyText}>{t("noMessagesYet")}</Text>
      )}
      {conversations.map((c) => (
        <Pressable
          key={c.customer_id}
          onPress={() => router.push(`/merchant-chat/${c.customer_id}`)}
          style={[styles.orderCard, shadows.card]}
          accessibilityRole="button"
        >
          <View style={styles.orderRow}>
            <View>
              <Text style={styles.orderId}>{c.customer_name}</Text>
              <Text style={styles.orderMetaText} numberOfLines={1}>
                {c.last_message.content}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              {c.unread_count > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{c.unread_count}</Text>
                </View>
              )}
              <Text style={styles.orderMetaText}>
                {new Date(c.last_message.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function PayoutsTab({ payouts, loading }: { payouts: PayoutRow[]; loading: boolean }) {
  const { t } = useTranslation();
  if (loading) return <ActivityIndicator color={palette.primary} style={{ marginTop: 40 }} />;

  const pending = payouts.filter((p) => p.status === "pending");
  const released = payouts.filter((p) => p.status === "released");
  const pendingTotal = pending.reduce((s, p) => s + Number(p.net_sar), 0);

  return (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>{t("payoutsTab")}</Text>

      <View style={[styles.card, shadows.card, { marginBottom: spacing.md }]}>
        <Text style={styles.cardSubtitle}>{t("pendingBalance")}</Text>
        <Text style={styles.bigAmount}>{formatSAR(pendingTotal)}</Text>
      </View>

      <Text style={styles.sectionTitle}>{t("pending")}</Text>
      {pending.length === 0 && <Text style={styles.emptyText}>{t("noPendingPayouts")}</Text>}
      {pending.map((p) => (
        <View key={p.id} style={[styles.orderCard, shadows.card]}>
          <View style={styles.orderRow}>
            <Text style={styles.orderId}>{p.id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.orderTotal}>{formatSAR(Number(p.net_sar))}</Text>
          </View>
          <Text style={styles.orderMetaText}>{t("commission")}: {formatSAR(Number(p.commission_sar))}</Text>
          <Text style={styles.orderMetaText}>{t("planFee")}: {formatSAR(Number(p.plan_fee_deduction_sar))}</Text>
        </View>
      ))}

      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>{t("released")}</Text>
      {released.length === 0 && <Text style={styles.emptyText}>{t("noReleasedPayouts")}</Text>}
      {released.map((p) => (
        <View key={p.id} style={[styles.orderCard, shadows.card, { opacity: 0.7 }]}>
          <View style={styles.orderRow}>
            <Text style={styles.orderId}>{p.id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.orderTotal}>{formatSAR(Number(p.net_sar))}</Text>
          </View>
          <Text style={styles.orderMetaText}>{t("released")} {p.released_at ? timeAgo(p.released_at) : ""}</Text>
        </View>
      ))}
    </View>
  );
}

function BillingTab({
  charges,
  loading,
  bankAccount,
  storeId,
  isOverdue,
  onRefresh,
}: {
  charges: SubscriptionChargeRow[];
  loading: boolean;
  bankAccount: any;
  storeId?: string;
  isOverdue: boolean;
  onRefresh: () => void;
}) {
  const { t } = useTranslation();
  const [receipt, setReceipt] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setReceipt(result.assets[0].uri);
    }
  };

  const handlePay = async () => {
    if (!receipt || !storeId || !charges[0]) return;
    setUploading(true);
    try {
      const path = `${storeId}/plan-${charges[0].id}-${Date.now()}.jpg`;
      const file = await (await fetch(receipt)).blob();
      const { error: uploadError } = await supabase.storage.from("receipts").upload(path, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("receipts").getPublicUrl(path);
      await supabase
        .from("subscription_charges")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", charges[0].id);
      Alert.alert(t("paymentSubmittedTitle"), t("paymentSubmittedMessage"));
      setReceipt(null);
      onRefresh();
    } catch (e) {
      Alert.alert(t("uploadFailed"), String(e));
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <ActivityIndicator color={palette.primary} style={{ marginTop: 40 }} />;

  const current = charges[0];

  return (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>{t("billingTab")}</Text>

      {current && (
        <View style={[styles.card, shadows.card]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>{t("currentPlanFee")}</Text>
              <Text style={styles.cardSubtitle}>
                {current.period_start} - {current.period_end}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusBg(current.status as any) }]}>
              <Text style={[styles.statusText, { color: statusColor(current.status as any) }]}>
                {current.status}
              </Text>
            </View>
          </View>
          <Text style={styles.bigAmount}>{formatSAR(Number(current.amount_sar))}</Text>

          {current.status !== "paid" && (
            <>
              <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
                <Text style={styles.label}>{t("bankName")}</Text>
                <Text style={styles.value}>{bankAccount?.bankName}</Text>
                <Text style={styles.label}>{t("accountNumber")}</Text>
                <Text style={styles.value}>{bankAccount?.accountNumber}</Text>
                <Text style={styles.label}>{t("accountHolder")}</Text>
                <Text style={styles.value}>{bankAccount?.accountHolder}</Text>
              </View>

              <Pressable onPress={handleUpload} style={styles.uploadBox}>
                {receipt ? (
                  <Image source={{ uri: receipt }} style={styles.uploadPreview} />
                ) : (
                  <>
                    <Upload size={24} color={palette.primary} />
                    <Text style={styles.uploadText}>{t("uploadTransferReceipt")}</Text>
                  </>
                )}
              </Pressable>

              <Button
                title={uploading ? t("submitting") : t("submitPayment")}
                variant="primary"
                size="lg"
                loading={uploading}
                disabled={!receipt}
                onPress={handlePay}
                style={{ marginTop: spacing.md }}
              />
            </>
          )}
        </View>
      )}

      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>{t("history")}</Text>
      {charges.length === 0 && <Text style={styles.emptyText}>{t("noBillingHistory")}</Text>}
      {charges.slice(1).map((c) => (
        <View key={c.id} style={[styles.orderCard, shadows.card]}>
          <View style={styles.orderRow}>
            <Text style={styles.orderId}>
              {c.period_start} - {c.period_end}
            </Text>
            <Text style={styles.orderTotal}>{formatSAR(Number(c.amount_sar))}</Text>
          </View>
          <Text style={styles.orderMetaText}>{t("status")}: {c.status}</Text>
        </View>
      ))}
    </View>
  );
}

function ProfileTab({ store }: { store: any }) {
  const { t } = useTranslation();
  if (!store) return <Text style={styles.emptyText}>{t("noStoreData")}</Text>;

  return (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>{t("profileTab")}</Text>
      <View style={[styles.card, shadows.card]}>
        <View style={styles.field}>
          <Text style={styles.label}>{t("storeNameLabel")}</Text>
          <Text style={styles.value}>{store.name}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>{t("categoryLabel")}</Text>
          <Text style={styles.value}>{store.category}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>{t("locationLabel")}</Text>
          <Text style={styles.value}>{store.location}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>{t("hoursLabel")}</Text>
          <Text style={styles.value}>{store.hours}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>{t("deliveryFeeLabel")}</Text>
          <Text style={styles.value}>{formatSAR(Number(store.delivery_fee ?? store.deliveryFee))}</Text>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>{t("planLabel")}</Text>
          <Text style={styles.value}>{store.plan_id ?? t("free")}</Text>
        </View>
      </View>
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
  const next = nextStatus(order.status, order.delivery_type as any);

  return (
    <View style={styles.tabContent}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <ArrowLeft size={18} color={palette.primary} />
        <Text style={styles.backText}>{t("backToOrders")}</Text>
      </Pressable>

      <View style={[styles.card, shadows.card]}>
        <View style={styles.orderRow}>
          <View>
            <Text style={styles.orderId}>{order.id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.bigAmount}>{formatSAR(Number(order.total))}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBg(order.status) }]}>
            <Text style={[styles.statusText, { color: statusColor(order.status) }]}>{order.status}</Text>
          </View>
        </View>

        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          <Text style={styles.label}>{t("phoneLabel")}</Text>
          <Text style={styles.value}>{order.phone}</Text>
          {order.address && (
            <>
              <Text style={styles.label}>{t("addressLabel")}</Text>
              <Text style={styles.value}>{order.address}</Text>
            </>
          )}
          {order.notes && (
            <>
              <Text style={styles.label}>{t("notesLabel")}</Text>
              <Text style={styles.value}>{order.notes}</Text>
            </>
          )}
        </View>
      </View>

      <View style={[styles.card, shadows.card]}>
        <Text style={styles.cardTitle}>{t("items")}</Text>
        {items.map((item: any, idx: number) => (
          <View key={idx} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMeta}>
                {formatSAR(item.price_sar ?? item.price)} × {item.quantity}
              </Text>
            </View>
            <Text style={styles.itemTotal}>
              {formatSAR((item.price_sar ?? item.price) * item.quantity)}
            </Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.itemRow}>
          <Text style={styles.itemName}>{t("subtotal")}</Text>
          <Text style={styles.itemTotal}>{formatSAR(Number(order.subtotal))}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.itemName}>{t("deliveryFee")}</Text>
          <Text style={styles.itemTotal}>{formatSAR(Number(order.delivery_fee))}</Text>
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

function AddProductModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("addProduct")}</Text>
            <Pressable onPress={onClose}>
              <X size={20} color={palette.foreground} />
            </Pressable>
          </View>
          <View style={styles.uploadBox}>
            <Plus size={24} color={palette.primary} />
            <Text style={styles.uploadText}>{t("uploadProductPhoto")}</Text>
          </View>
          <Input label={t("productName")} placeholder="e.g. Panadol Extra" />
          <Input label={t("priceSAR")} placeholder="20" keyboardType="numeric" />
          <Input label={t("category")} placeholder="Pharmacy" />
          <Input label={t("description")} placeholder="Short description" multiline />
          <Button title={t("saveProduct")} variant="primary" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

function StatCard({
  icon,
  tint,
  label,
  value,
  trend,
}: {
  icon: string;
  tint: string;
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <View style={[styles.statCard, shadows.card, { backgroundColor: palette.card }]}>
      <View style={[styles.statIcon, { backgroundColor: tint }]}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statRow}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTrend}>{trend}</Text>
      </View>
    </View>
  );
}

function timeAgo(iso?: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  center: { alignItems: "center", justifyContent: "center" },
  openSwitch: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  openText: { fontFamily: fonts.sansSemiBold, fontSize: 12 },
  restrictionBanner: {
    flexDirection: "row",
    backgroundColor: "#fdecec",
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.destructive,
  },
  restrictionTitle: { fontFamily: fonts.sansBold, color: palette.destructive },
  restrictionMessage: { fontFamily: fonts.sans, fontSize: 12, color: palette.destructive, marginTop: 2 },
  restrictionLink: { fontFamily: fonts.sansBold, color: palette.destructive, marginTop: 4, textDecorationLine: "underline" },
  bottomNav: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.md,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: palette.card,
    borderRadius: radii.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: palette.foreground,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  navItem: { flex: 1, alignItems: "center", gap: 2, paddingVertical: spacing.xs, borderRadius: radii.full },
  navItemActive: { backgroundColor: palette.primary },
  navIconWrapper: { position: "relative" },
  navLabel: { fontFamily: fonts.sansMedium, fontSize: 10 },
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: palette.destructive,
    borderRadius: radii.full,
    minWidth: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontFamily: fonts.sansBold, fontSize: 9, color: palette.destructiveForeground },
  tabContent: { paddingTop: spacing.md, gap: spacing.md },
  tabTitle: { fontFamily: fonts.display, fontSize: 24, color: palette.foreground },
  tabSubtitle: { fontFamily: fonts.sans, fontSize: 13, color: palette.mutedForeground },
  tabHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  refreshButton: {
    padding: spacing.sm,
    backgroundColor: palette.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.border,
  },
  statsGrid: { flexDirection: "row", gap: spacing.md },
  statCard: { flex: 1, borderRadius: radii.xl, padding: spacing.md, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.card, ...shadows.card },
  statIcon: { width: 40, height: 40, borderRadius: radii.lg, alignItems: "center", justifyContent: "center" },
  statLabel: { fontFamily: fonts.sansMedium, fontSize: 11, color: palette.mutedForeground, marginTop: spacing.sm },
  statRow: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm, marginTop: 2 },
  statValue: { fontFamily: fonts.display, fontSize: 22, color: palette.foreground },
  statTrend: { fontFamily: fonts.sansBold, fontSize: 11, color: palette.success },
  card: {
    backgroundColor: palette.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: palette.border,
    ...shadows.card,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.sm },
  cardTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: palette.foreground },
  cardSubtitle: { fontFamily: fonts.sans, fontSize: 12, color: palette.mutedForeground, marginTop: 2 },
  growthPill: { backgroundColor: "#e9f7ef", paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.full },
  growthText: { fontFamily: fonts.sansBold, fontSize: 11, color: palette.success },
  chart: { flexDirection: "row", alignItems: "flex-end", height: 120, gap: 6, marginTop: spacing.md },
  barWrapper: { flex: 1, alignItems: "center" },
  bar: { width: "100%", borderRadius: radii.md },
  barLabel: { fontFamily: fonts.sansMedium, fontSize: 10, color: palette.mutedForeground, marginTop: 4 },
  activityRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: palette.border },
  activityIcon: { width: 32, height: 32, borderRadius: radii.lg, backgroundColor: palette.muted, alignItems: "center", justifyContent: "center" },
  activityText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: palette.foreground },
  activityTime: { fontFamily: fonts.sansMedium, fontSize: 11, color: palette.mutedForeground },
  emptyText: { fontFamily: fonts.sansMedium, fontSize: 13, color: palette.mutedForeground, textAlign: "center", marginTop: spacing.md },
  orderCard: { backgroundColor: palette.card, borderRadius: radii.lg, padding: spacing.md, borderWidth: 1, borderColor: palette.border, marginBottom: spacing.sm, ...shadows.card },
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
  backButton: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  backText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: palette.primary },
  itemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.sm },
  itemName: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: palette.foreground },
  itemMeta: { fontFamily: fonts.sansMedium, fontSize: 12, color: palette.mutedForeground },
  itemTotal: { fontFamily: fonts.sansBold, fontSize: 14, color: palette.foreground },
  divider: { height: 1, backgroundColor: palette.border, marginVertical: spacing.sm },
  bigAmount: { fontFamily: fonts.display, fontSize: 28, color: palette.foreground, marginTop: spacing.sm },
  sectionTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: palette.foreground },
  label: { fontFamily: fonts.sansMedium, fontSize: 11, color: palette.mutedForeground, marginTop: spacing.sm },
  value: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: palette.foreground },
  field: { marginBottom: spacing.sm },
  uploadBox: {
    height: 120,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: palette.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
    overflow: "hidden",
  },
  uploadPreview: { width: "100%", height: "100%" },
  uploadText: { fontFamily: fonts.sansMedium, fontSize: 13, color: palette.mutedForeground, marginTop: spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center", padding: spacing.lg },
  modalContent: { backgroundColor: palette.card, borderRadius: radii.lg, padding: spacing.lg, width: "100%", maxWidth: 400 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  modalTitle: { fontFamily: fonts.display, fontSize: 18, color: palette.foreground },
  modalInput: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: palette.foreground,
    marginBottom: spacing.md,
  },
});
