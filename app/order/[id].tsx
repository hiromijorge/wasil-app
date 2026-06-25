import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Package,
  MapPin,
  Phone,
  MessageCircle,
  Upload,
  CheckCircle,
  Store,
  Truck,
  ClipboardList,
  CreditCard,
  XCircle,
  Banknote,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { TopBar } from "../../src/components/TopBar";
import { Button } from "../../src/components/Button";
import { useOrder } from "../../src/hooks/useOrder";
import { useCustomerOrders } from "../../src/hooks/useCustomerOrders";
import { useReceiptBank } from "../../src/hooks/useReceiptBank";
import { useOrderReview, useCreateReview, useUpdateReview } from "../../src/hooks/useReviews";
import { ReviewForm } from "../../src/components/ReviewForm";
import { useAuth } from "../../src/lib/auth-context";

import { useTranslation, type TranslationKey } from "../../src/lib/i18n";
import { formatSAR } from "../../src/lib/format";
import { supabase } from "../../src/lib/supabase";
import { palette, fonts, typography, spacing, radii, shadows } from "../../src/lib/theme";

const ORDER_STEPS: OrderStatus[] = [
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

type OrderStatus =
  | "new"
  | "paid"
  | "preparing"
  | "ready"
  | "driver_assigned"
  | "picked_up"
  | "on_the_way"
  | "delivered"
  | "completed"
  | "cancelled"
  | "disputed";

function orderStatusKey(status: OrderStatus): TranslationKey {
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

function statusColor(status: OrderStatus) {
  switch (status) {
    case "completed":
    case "paid":
      return palette.success;
    case "cancelled":
    case "disputed":
      return palette.destructive;
    case "delivered":
      return palette.success;
    default:
      return palette.warning;
  }
}

function statusBg(status: OrderStatus) {
  switch (status) {
    case "completed":
    case "paid":
      return "#e9f7ef";
    case "cancelled":
    case "disputed":
      return "#fdecec";
    case "delivered":
      return "#e9f7ef";
    default:
      return "#fff3e0";
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

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { data: order, isLoading, error, refetch } = useOrder(id);
  const { data: bank } = useReceiptBank();
  const { refetch: refetchList } = useCustomerOrders();
  const { user } = useAuth();

  const [receipt, setReceipt] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const { data: existingReview } = useOrderReview(order?.id);
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();
  const canReview = Boolean(order && (order.status === "completed" || order.status === "delivered"));

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setReceipt(result.assets[0].uri);
    }
  };

  const handleSubmitReceipt = async () => {
    if (!receipt || !order) return;
    setUploading(true);
    try {
      const path = `orders/${order.id}-${Date.now()}.jpg`;
      const file = await (await fetch(receipt)).blob();
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(path, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("receipts").getPublicUrl(path);
      const { error: updateError } = await supabase
        .from("orders")
        .update({ payment_receipt_url: data.publicUrl })
        .eq("id", order.id);
      if (updateError) throw updateError;
      setReceipt(null);
      await refetch();
      await refetchList();
    } catch (e: any) {
      Alert.alert(t("uploadFailed"), e.message || String(e));
    }
    setUploading(false);
  };

  const handleCancel = async () => {
    if (!order || !user) return;
    if (!["new", "paid"].includes(order.status)) {
      Alert.alert(t("tryAgain"), t("cannotCancelOrder"));
      return;
    }
    Alert.prompt(
      t("cancelOrderTitle"),
      t("cancelOrderMessage"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("cancelOrder"),
          style: "destructive",
          onPress: async (reason?: string) => {
            setCancelling(true);
            try {
              const { error } = await supabase.rpc("customer_cancel_order", {
                p_order_id: order.id,
                p_reason: reason || cancelReason || null,
              });
              if (error) throw error;
              await refetch();
              await refetchList();
              Alert.alert(t("orderCancelled"), t("refundPending"));
            } catch (e: any) {
              Alert.alert(t("tryAgain"), e.message || String(e));
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
      "plain-text",
      cancelReason,
    );
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!order || !user) return;
    try {
      if (existingReview) {
        await updateReview.mutateAsync({
          id: existingReview.id,
          updates: { rating, comment: comment.trim() || null },
        });
      } else {
        await createReview.mutateAsync({
          order_id: order.id,
          store_id: order.store_id,
          customer_id: user.id,
          rating,
          comment: comment.trim() || null,
        });
      }
      Alert.alert(t("thankYouForReview"), t("reviewSubmitted"));
    } catch (e: any) {
      Alert.alert(t("tryAgain"), e.message || String(e));
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={[styles.container, styles.center, { padding: spacing.lg }]}>
        <Text style={styles.notFound}>{t("orderNotFound")}</Text>
        <Button
          title={t("goBack")}
          variant="outline"
          onPress={() => router.back()}
          style={{ marginTop: spacing.md }}
        />
      </View>
    );
  }

  const items = (order.items as any[] | undefined) ?? [];
  const deliveryLocation = (order.delivery_location as { address?: string; lat?: number; lng?: number } | null) ?? null;
  const deliveryDetails = (order.delivery_details as Record<string, string> | null) ?? null;
  const stepIndex = ORDER_STEPS.indexOf(order.status as OrderStatus);
  const isCod = order.payment_method === "cash";
  const canUploadReceipt = !isCod && order.customer_payment_status !== "verified";

  return (
    <View style={styles.container}>
      <TopBar showBack showCart />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.xl,
        }}
      >
        {/* Header */}
        <View style={[styles.headerCard, shadows.card]}>
          <View style={styles.headerRow}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${palette.primary}15` },
              ]}
            >
              <Package size={24} color={palette.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.orderId}>
                {t("orderId", { id: order.id.slice(-6).toUpperCase() })}
              </Text>
              <Text style={styles.storeName}>
                {order.stores?.name ?? t("storesTitle")}
              </Text>
            </View>
          </View>
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusBg(order.status as OrderStatus) },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: statusColor(order.status as OrderStatus) },
                ]}
              >
                {t(orderStatusKey(order.status as OrderStatus))}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isCod
                    ? (order.customer_payment_status === "verified"
                        ? `${palette.success}20`
                        : `${palette.warning}20`)
                    : paymentBg(order.customer_payment_status),
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color: isCod
                      ? (order.customer_payment_status === "verified"
                          ? palette.success
                          : palette.warning)
                      : paymentColor(order.customer_payment_status),
                  },
                ]}
              >
                {isCod
                  ? order.customer_payment_status === "verified"
                    ? t("paymentVerified")
                    : t("cashOnDelivery")
                  : order.customer_payment_status === "verified"
                  ? t("paymentVerified")
                  : order.customer_payment_status === "rejected"
                  ? t("paymentRejected")
                  : t("pendingPayment")}
              </Text>
            </View>
          </View>
          <Text style={styles.date}>
            {new Date(order.created_at).toLocaleDateString()}
          </Text>
        </View>

        {/* Timeline */}
        {order.status !== "cancelled" && order.status !== "disputed" && (
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.cardTitle}>{t("orderStatusTimeline")}</Text>
            {ORDER_STEPS.map((step, index) => {
              const active = stepIndex >= index;
              const isCurrent = stepIndex === index;
              return (
                <View key={step} style={styles.stepRow}>
                  <View style={styles.stepLineWrap}>
                    <View
                      style={[
                        styles.stepDot,
                        active && styles.stepDotActive,
                        isCurrent && styles.stepDotCurrent,
                      ]}
                    />
                    {index !== ORDER_STEPS.length - 1 && (
                      <View
                        style={[
                          styles.stepLine,
                          stepIndex > index && styles.stepLineActive,
                        ]}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      active && styles.stepLabelActive,
                      isCurrent && styles.stepLabelCurrent,
                    ]}
                  >
                    {t(orderStatusKey(step))}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Store card */}
        <View style={[styles.card, shadows.card]}>
          <View style={styles.storeRow}>
            <Store size={18} color={palette.primary} />
            <Text style={styles.storeLabel}>{order.stores?.name}</Text>
          </View>
          <Button
            title={t("messageSeller")}
            variant="outline"
            size="sm"
            onPress={() => router.push(`/chat/${order.store_id}`)}
            style={{ marginTop: spacing.sm }}
          />
        </View>

        {/* Items */}
        <View style={[styles.card, shadows.card]}>
          <Text style={styles.cardTitle}>{t("orderItems")}</Text>
          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Image
                source={
                  typeof item.image === "string" && item.image
                    ? { uri: item.image }
                    : require("../../assets/icon.png")
                }
                style={styles.itemImage}
                resizeMode="cover"
              />
              <View style={styles.itemText}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>
                  {formatSAR(Number(item.price_sar))} × {item.quantity}
                </Text>
              </View>
              <Text style={styles.itemTotal}>
                {formatSAR(Number(item.price_sar) * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Delivery details */}
        {order.delivery_type === "delivery" && (
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.cardTitle}>{t("orderDeliveryDetails")}</Text>
            <View style={styles.detailRow}>
              <MapPin size={16} color={palette.primary} />
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>{t("addressLabel")}</Text>
                <Text style={styles.detailValue}>
                  {deliveryLocation?.address ?? order.address ?? "—"}
                </Text>
              </View>
            </View>
            {deliveryDetails?.contact_name && (
              <View style={styles.detailRow}>
                <ClipboardList size={16} color={palette.mutedForeground} />
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>{t("contactNameLabel")}</Text>
                  <Text style={styles.detailValue}>
                    {deliveryDetails.contact_name}
                  </Text>
                </View>
              </View>
            )}
            {deliveryDetails?.building_floor && (
              <View style={styles.detailRow}>
                <Truck size={16} color={palette.mutedForeground} />
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>{t("buildingFloorLabel")}</Text>
                  <Text style={styles.detailValue}>
                    {deliveryDetails.building_floor}
                  </Text>
                </View>
              </View>
            )}
            {order.phone && (
              <View style={styles.detailRow}>
                <Phone size={16} color={palette.mutedForeground} />
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>{t("phoneLabel")}</Text>
                  <Text style={styles.detailValue}>{order.phone}</Text>
                </View>
              </View>
            )}
            {order.notes && (
              <View style={styles.detailRow}>
                <MessageCircle size={16} color={palette.mutedForeground} />
                <View style={styles.detailText}>
                  <Text style={styles.detailLabel}>{t("notesLabel")}</Text>
                  <Text style={styles.detailValue}>{order.notes}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Payment */}
        <View style={[styles.card, shadows.card]}>
          <Text style={styles.cardTitle}>{t("orderPayment")}</Text>

          {isCod ? (
            <View style={styles.codBox}>
              <View style={styles.codHeader}>
                <Banknote size={20} color={palette.success} />
                <Text style={styles.codTitle}>{t("cashOnDelivery")}</Text>
              </View>
              <Text style={styles.codHint}>{t("codHint")}</Text>
            </View>
          ) : (
            <>
              {canUploadReceipt && bank && (
                <View style={styles.bankCard}>
                  <View style={styles.bankHeader}>
                    <CreditCard size={18} color={palette.primary} />
                    <Text style={styles.bankTitle}>{t("payByBankTransfer")}</Text>
                  </View>
                  <Text style={styles.bankHint}>{t("bankTransferHint")}</Text>
                  <View style={styles.bankRow}>
                    <Text style={styles.bankKey}>{t("bankName")}</Text>
                    <Text style={styles.bankValue}>{bank.bank_name}</Text>
                  </View>
                  <View style={styles.bankRow}>
                    <Text style={styles.bankKey}>{t("accountNumber")}</Text>
                    <Text style={styles.bankValue}>{bank.account_number}</Text>
                  </View>
                  <View style={styles.bankRow}>
                    <Text style={styles.bankKey}>{t("accountHolder")}</Text>
                    <Text style={styles.bankValue}>{bank.account_holder}</Text>
                  </View>
                  <View style={styles.bankRow}>
                    <Text style={styles.bankKey}>{t("transferAmount")}</Text>
                    <Text style={[styles.bankValue, styles.bankAmount]}>
                      {formatSAR(Number(order.total))}
                    </Text>
                  </View>
                  <View style={styles.bankRow}>
                    <Text style={styles.bankKey}>{t("transferReference")}</Text>
                    <Text style={styles.bankValue}>
                      WASIL-{order.id.slice(-6).toUpperCase()}
                    </Text>
                  </View>
                </View>
              )}

              {order.payment_receipt_url && (
                <View style={styles.proofWrap}>
                  <Text style={styles.proofLabel}>{t("paymentReceipt")}</Text>
                  <Image
                    source={{ uri: order.payment_receipt_url }}
                    style={styles.proofImage}
                  />
                </View>
              )}

              {canUploadReceipt && (
                <>
                  <Pressable
                    onPress={handlePickImage}
                    style={styles.uploadBox}
                    accessibilityRole="button"
                  >
                    {receipt ? (
                      <Image source={{ uri: receipt }} style={styles.preview} />
                    ) : (
                      <>
                        <Upload size={24} color={palette.primary} />
                        <Text style={styles.uploadText}>
                          {t("tapToUploadReceipt")}
                        </Text>
                      </>
                    )}
                  </Pressable>
                  <Button
                    title={uploading ? t("uploading") : t("submitReceipt")}
                    onPress={handleSubmitReceipt}
                    loading={uploading}
                    disabled={!receipt || uploading}
                    style={{ marginTop: spacing.md }}
                  />
                </>
              )}
            </>
          )}

          {order.customer_payment_status === "verified" && (
            <View style={styles.verifiedBox}>
              <CheckCircle size={20} color={palette.success} />
              <Text style={styles.verifiedText}>{t("paymentVerified")}</Text>
            </View>
          )}
        </View>

        {/* Total */}
        <View style={[styles.card, shadows.card]}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t("orderSubtotal")}</Text>
            <Text style={styles.totalValue}>
              {formatSAR(Number(order.subtotal_sar))}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t("orderDeliveryFee")}</Text>
            <Text style={styles.totalValue}>
              {formatSAR(Number(order.delivery_fee_sar))}
            </Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>{t("orderTotal")}</Text>
            <Text style={styles.grandTotalValue}>
              {formatSAR(Number(order.total))}
            </Text>
          </View>
        </View>

        {canReview && (
          <ReviewForm
            initialRating={existingReview?.rating ?? 0}
            initialComment={existingReview?.comment ?? ""}
            onSubmit={handleReviewSubmit}
            loading={createReview.isPending || updateReview.isPending}
          />
        )}

        {order.status === "cancelled" && (
          <View style={[styles.card, shadows.card, { borderColor: palette.destructive }]}>
            <View style={styles.cancelledHeader}>
              <XCircle size={20} color={palette.destructive} />
              <Text style={styles.cancelledTitle}>{t("orderCancelled")}</Text>
            </View>
            {order.cancellation_reason && (
              <Text style={styles.cancelledReason}>{order.cancellation_reason}</Text>
            )}
            {order.refund_status && (
              <View style={[styles.refundBadge, { backgroundColor: `${palette.warning}15` }]}>
                <Text style={[styles.refundText, { color: palette.warning }]}>
                  {order.refund_status === "pending"
                    ? t("refundPending")
                    : order.refund_status === "processing"
                      ? t("refundProcessing")
                      : order.refund_status === "completed"
                        ? t("refundCompleted")
                        : order.refund_status === "failed"
                          ? t("refundFailed")
                          : order.refund_status}
                </Text>
              </View>
            )}
          </View>
        )}

        {order.customer_id === user?.id && ["new", "paid"].includes(order.status) && (
          <Button
            title={t("cancelOrder")}
            variant="outline"
            onPress={handleCancel}
            loading={cancelling}
            style={{ borderColor: palette.destructive }}
            textStyle={{ color: palette.destructive }}
          />
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
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  notFound: {
    ...typography.pageTitle,
    textAlign: "center",
  },
  headerCard: {
    backgroundColor: palette.card,
    borderRadius: radii["2xl"],
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    gap: spacing.md,
    ...shadows.card,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  orderId: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: palette.foreground,
  },
  storeName: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
  },
  badgeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  statusText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    textTransform: "capitalize",
  },
  date: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: palette.mutedForeground,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: radii["2xl"],
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    gap: spacing.md,
    ...shadows.card,
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: palette.foreground,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    height: 44,
  },
  stepLineWrap: {
    width: 18,
    height: "100%",
    alignItems: "center",
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.border,
    borderWidth: 2,
    borderColor: palette.border,
  },
  stepDotActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  stepDotCurrent: {
    backgroundColor: palette.card,
    borderColor: palette.primary,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: palette.border,
    marginVertical: 2,
    minHeight: 20,
  },
  stepLineActive: {
    backgroundColor: palette.primary,
  },
  stepLabel: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
  },
  stepLabelActive: {
    fontFamily: fonts.sansSemiBold,
    color: palette.foreground,
  },
  stepLabelCurrent: {
    fontFamily: fonts.sansSemiBold,
    color: palette.primary,
  },
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  storeLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: palette.foreground,
    flex: 1,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: palette.background,
  },
  itemText: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: palette.foreground,
  },
  itemMeta: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: palette.mutedForeground,
  },
  itemTotal: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: palette.foreground,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  detailText: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: palette.mutedForeground,
  },
  detailValue: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.foreground,
    lineHeight: 20,
  },
  bankCard: {
    padding: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.sm,
  },
  bankHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  bankTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: palette.foreground,
  },
  bankHint: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: palette.mutedForeground,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  bankRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  bankKey: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: palette.mutedForeground,
  },
  bankValue: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.foreground,
  },
  bankAmount: {
    color: palette.primary,
    fontSize: 15,
  },
  proofWrap: {
    gap: spacing.sm,
  },
  proofLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: palette.mutedForeground,
  },
  proofImage: {
    width: "100%",
    height: 180,
    borderRadius: radii.xl,
  },
  uploadBox: {
    height: 140,
    borderRadius: radii.xl,
    borderWidth: 2,
    borderColor: palette.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.background,
    overflow: "hidden",
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  uploadText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: palette.primary,
    marginTop: spacing.sm,
  },
  verifiedBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: "rgba(76,175,80,0.1)",
  },
  verifiedText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.success,
  },
  codBox: {
    borderRadius: radii.lg,
    backgroundColor: "rgba(76,175,80,0.1)",
    padding: spacing.md,
    gap: spacing.xs,
  },
  codHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  codTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: palette.foreground,
  },
  codHint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
    lineHeight: 18,
  },
  cancelledHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  cancelledTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: palette.destructive,
  },
  cancelledReason: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
  },
  refundBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
  },
  refundText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  totalLabel: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.mutedForeground,
  },
  totalValue: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: palette.foreground,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: palette.border,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
  },
  grandTotalLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: palette.foreground,
  },
  grandTotalValue: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: palette.primary,
  },
});
