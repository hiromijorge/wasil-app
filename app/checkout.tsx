import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TopBar } from "../src/components/TopBar";
import { Input } from "../src/components/Input";
import { Card } from "../src/components/Card";
import { AddressAutocomplete } from "../src/components/AddressAutocomplete";
import { type GeoLocation } from "../src/components/LocationButton";
import { palette, fonts, spacing, radii, shadows } from "../src/lib/theme";
import { formatSAR } from "../src/lib/format";
import { supabase } from "../src/lib/supabase";
import { useCart } from "../src/lib/cart-context";
import { useAuth } from "../src/lib/auth-context";
import { useTranslation } from "../src/lib/i18n";
import { useStores } from "../src/hooks/useStores";
import { useProduct } from "../src/hooks/useProduct";
import { useCreateOrder } from "../src/hooks/useCreateOrder";
import { useAddresses } from "../src/hooks/useAddresses";
import { usePlatformConfig } from "../src/hooks/usePlatformConfig";
import type { Database } from "../src/lib/database.types";

type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];

type DeliveryType = "pickup" | "delivery";
type PaymentMethod = "bank_transfer" | "cash";

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { plan, buyNowProductId, buyNowQty } = useLocalSearchParams<{
    plan?: string;
    buyNowProductId?: string;
    buyNowQty?: string;
  }>();
  const { items, clearCart } = useCart();
  const { session, profile, user } = useAuth();
  const { t } = useTranslation();
  const { createOrder } = useCreateOrder();
  const { data: storesData = [] } = useStores();
  const { data: config } = usePlatformConfig();
  const { data: buyNowProduct, isLoading: buyNowLoading } = useProduct(buyNowProductId);

  const isBuyNow = Boolean(buyNowProductId && buyNowProduct);
  const checkoutItems = useMemo(() => {
    if (!isBuyNow || !buyNowProduct) return items;
    return [{ product: buyNowProduct, quantity: Number(buyNowQty) || 1 }];
  }, [isBuyNow, buyNowProduct, buyNowQty, items]);

  const checkoutSubtotal = useMemo(
    () => checkoutItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [checkoutItems],
  );

  const storeMap = useMemo(
    () => new Map(storesData.map((s) => [s.id, s])),
    [storesData]
  );

  const planPrice = plan === "growth" ? 300 : plan === "premium" ? 500 : plan === "starter" ? 100 : 0;
  const isPlanCheckout = Boolean(plan && planPrice > 0);

  const [phone, setPhone] = useState("+967");
  const [address, setAddress] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState<GeoLocation | null>(null);
  const [contactName, setContactName] = useState(profile?.full_name ?? "");
  const [buildingFloor, setBuildingFloor] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryTypes, setDeliveryTypes] = useState<Record<string, DeliveryType>>({});
  const [paymentMethods, setPaymentMethods] = useState<Record<string, PaymentMethod>>({});
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  const cashThreshold = config?.cod_high_value_threshold_sar ?? 300;

  const { data: savedAddresses = [] } = useAddresses(user?.id);

  if (buyNowProductId && buyNowLoading) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  const groups = useMemo(() => {
    if (isPlanCheckout) return [];
    const map = new Map<string, typeof checkoutItems>();
    checkoutItems.forEach((item) => {
      const list = map.get(item.product.storeId) ?? [];
      list.push(item);
      map.set(item.product.storeId, list);
    });
    return Array.from(map.entries())
      .map(([storeId, groupItems]) => {
        const store = storeMap.get(storeId);
        return {
          store,
          items: groupItems,
          subtotal: groupItems.reduce((s, i) => s + i.product.price * i.quantity, 0),
          deliveryType: deliveryTypes[storeId] ?? "delivery",
          deliveryFee: store?.deliveryFee ?? 0,
          paymentMethod: paymentMethods[storeId] ?? "bank_transfer",
          orderTotal: groupItems.reduce((s, i) => s + i.product.price * i.quantity, 0) + (store?.deliveryFee ?? 0),
        };
      })
      .filter((g): g is typeof g & { store: NonNullable<typeof g.store> } => !!g.store);
  }, [checkoutItems, deliveryTypes, isPlanCheckout]);

  const hasDelivery = !isPlanCheckout && groups.some((g) => g.deliveryType === "delivery");

  useEffect(() => {
    if (!hasDelivery || selectedAddressId) return;
    const defaultAddr = savedAddresses.find((a) => a.is_default);
    if (defaultAddr) {
      setSelectedAddressId(defaultAddr.id);
      setAddress(defaultAddr.address);
      setDeliveryLocation(
        defaultAddr.lat && defaultAddr.lng
          ? { address: defaultAddr.address, lat: Number(defaultAddr.lat), lng: Number(defaultAddr.lng) }
          : null,
      );
      setBuildingFloor(defaultAddr.building_floor ?? "");
      setContactName(defaultAddr.contact_name ?? profile?.full_name ?? "");
      if (defaultAddr.contact_phone && phone === "+967") {
        setPhone(defaultAddr.contact_phone);
      }
    }
  }, [hasDelivery, savedAddresses, selectedAddressId, profile?.full_name, phone]);

  const deliveryTotal = useMemo(
    () => groups.reduce((s, g) => s + (g.deliveryType === "delivery" ? g.deliveryFee : 0), 0),
    [groups],
  );

  const grandTotal = isPlanCheckout ? planPrice : checkoutSubtotal + deliveryTotal;

  const setDeliveryType = (storeId: string, type: DeliveryType) => {
    setDeliveryTypes((prev) => ({ ...prev, [storeId]: type }));
    if (type === "pickup") {
      setPaymentMethods((prev) => ({ ...prev, [storeId]: "bank_transfer" }));
    }
  };

  const setPaymentMethod = (storeId: string, method: PaymentMethod) => {
    setPaymentMethods((prev) => ({ ...prev, [storeId]: method }));
  };

  const handlePlaceOrder = async () => {
    if (!session) {
      Alert.alert("Sign in required", "Please sign in to complete your order.");
      router.push("/auth");
      return;
    }
    if (!isPlanCheckout && !phone.trim()) {
      Alert.alert("Phone required", "Please enter your phone number.");
      return;
    }
    setPlacing(true);

    if (isPlanCheckout) {
      // Plan purchase is handled via subscription charges in the merchant dashboard.
      setPlacing(false);
      router.push("/order-success");
      return;
    }

    try {
      const created: string[] = [];
      for (const g of groups) {
        const orderId = await createOrder({
          storeId: g.store.id,
          items: g.items,
          deliveryType: g.deliveryType,
          deliveryFeeSar: g.deliveryType === "delivery" ? g.deliveryFee : 0,
          subtotalSar: g.subtotal,
          phone,
          address: g.deliveryType === "delivery" ? address : undefined,
          deliveryLocation: g.deliveryType === "delivery" ? deliveryLocation : undefined,
          deliveryDetails:
            g.deliveryType === "delivery"
              ? { contactName, buildingFloor }
              : undefined,
          notes,
          paymentMethod: g.paymentMethod,
        });
        created.push(orderId);
      }

      if (!isBuyNow) clearCart();
      router.push({
        pathname: "/order-success",
        params: { ids: created.join(",") },
      });
    } catch (e: any) {
      Alert.alert("Order failed", e.message || String(e));
    } finally {
      setPlacing(false);
    }
  };

  return (
    <View style={styles.container}>
      <TopBar
        title="Checkout"
        showBack
        onBack={() => {
          if (isPlanCheckout) {
            router.push("/plans");
          } else {
            router.back();
          }
        }}
        showCart
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: spacing.xl },
        ]}
      >
        <Text style={styles.heading}>{t("checkoutTitle")}</Text>
        <Text style={styles.subheading}>
          {isPlanCheckout ? t("subscriptionSummary") : t("checkoutSubtitle")}
        </Text>

        {isPlanCheckout ? (
          <Card padding="lg" radius="3xl" style={styles.card}>
            <Text style={styles.cardTitle}>
              {plan?.charAt(0).toUpperCase()}
              {plan?.slice(1)} plan
            </Text>
            <Text style={styles.cardPrice}>{formatSAR(planPrice)}</Text>
          </Card>
        ) : (
          <>
            {groups.map((g) => (
              <Card key={g.store.id} padding="lg" radius="3xl" style={styles.card}>
                <View style={styles.storeRow}>
                  <View style={styles.storeImageWrap}>
                    <Image
                      source={typeof g.store.image === "string" ? { uri: g.store.image } : g.store.image}
                      style={styles.storeImage}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.storeText}>
                    <Text style={styles.storeName}>{g.store.name}</Text>
                    <Text style={styles.storeMeta}>
                      {t("itemsCountShort", { count: g.items.reduce((s, i) => s + i.quantity, 0) })}
                    </Text>
                  </View>
                </View>

                <View style={styles.items}>
                  {g.items.map(({ product, quantity }) => (
                    <View key={product.id} style={styles.itemRow}>
                      <View style={styles.itemImageWrap}>
                        <Image
                          source={typeof product.image === "string" ? { uri: product.image } : product.image}
                          style={styles.itemImage}
                          resizeMode="cover"
                        />
                      </View>
                      <View style={styles.itemText}>
                        <Text style={styles.itemName} numberOfLines={2}>
                          {product.name}
                        </Text>
                        <Text style={styles.itemMeta}>
                          {formatSAR(product.price)} × {quantity}
                        </Text>
                      </View>
                      <Text style={styles.itemTotal}>
                        {formatSAR(product.price * quantity)}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.deliveryToggle}>
                  <Pressable
                    style={[
                      styles.toggleButton,
                      g.deliveryType === "pickup" && styles.toggleButtonActive,
                    ]}
                    onPress={() => setDeliveryType(g.store.id, "pickup")}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        g.deliveryType === "pickup" && styles.toggleTextActive,
                      ]}
                    >
                      {t("pickup")}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.toggleButton,
                      g.deliveryType === "delivery" && styles.toggleButtonActive,
                    ]}
                    onPress={() => setDeliveryType(g.store.id, "delivery")}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        g.deliveryType === "delivery" && styles.toggleTextActive,
                      ]}
                    >
                      {t("delivery")}
                    </Text>
                  </Pressable>
                </View>

                {g.deliveryType === "delivery" && (
                  <Text style={styles.deliveryNote}>
                    {t("deliveryFeeLabel", { fee: formatSAR(g.deliveryFee) })}
                  </Text>
                )}

                {g.deliveryType === "delivery" && (
                  <View style={styles.paymentBlock}>
                    <Text style={styles.paymentLabel}>{t("paymentMethod")}</Text>
                    <View style={styles.paymentToggle}>
                      <Pressable
                        style={[
                          styles.toggleButton,
                          g.paymentMethod === "bank_transfer" && styles.toggleButtonActive,
                          g.orderTotal > cashThreshold && styles.toggleButtonDisabled,
                        ]}
                        onPress={() => setPaymentMethod(g.store.id, "bank_transfer")}
                        disabled={g.orderTotal > cashThreshold}
                      >
                        <Text
                          style={[
                            styles.toggleText,
                            g.paymentMethod === "bank_transfer" && styles.toggleTextActive,
                            g.orderTotal > cashThreshold && styles.toggleTextDisabled,
                          ]}
                        >
                          {t("bankTransfer")}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.toggleButton,
                          g.paymentMethod === "cash" && styles.toggleButtonActive,
                          g.orderTotal > cashThreshold && styles.toggleButtonDisabled,
                        ]}
                        onPress={() =>
                          g.orderTotal <= cashThreshold && setPaymentMethod(g.store.id, "cash")
                        }
                        disabled={g.orderTotal > cashThreshold}
                      >
                        <Text
                          style={[
                            styles.toggleText,
                            g.paymentMethod === "cash" && styles.toggleTextActive,
                            g.orderTotal > cashThreshold && styles.toggleTextDisabled,
                          ]}
                        >
                          {t("cashOnDelivery")}
                        </Text>
                      </Pressable>
                    </View>
                    {g.orderTotal > cashThreshold ? (
                      <Text style={styles.paymentHint}>
                        {t("codHighValue", { amount: formatSAR(cashThreshold) })}
                      </Text>
                    ) : g.paymentMethod === "cash" ? (
                      <Text style={styles.paymentHint}>{t("codHint")}</Text>
                    ) : null}
                  </View>
                )}
              </Card>
            ))}
          </>
        )}

        <Card padding="lg" radius="3xl" style={styles.card}>
          <Text style={styles.cardTitle}>{t("customerDetails")}</Text>

          <Input
            label={t("phoneLabel")}
            placeholder={t("phonePlaceholder")}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          {!isPlanCheckout && groups.some((g) => g.deliveryType === "delivery") && (
            <View style={styles.addressBlock}>
              {savedAddresses.length > 0 && (
                <View style={styles.savedAddresses}>
                  <Text style={styles.savedAddressesTitle}>{t("myAddresses")}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.addressChips}>
                      {savedAddresses.map((addr) => (
                        <Pressable
                          key={addr.id}
                          onPress={() => {
                            setSelectedAddressId(addr.id);
                            setAddress(addr.address);
                            setDeliveryLocation(
                              addr.lat && addr.lng
                                ? { address: addr.address, lat: Number(addr.lat), lng: Number(addr.lng) }
                                : null,
                            );
                            setBuildingFloor(addr.building_floor ?? "");
                            setContactName(addr.contact_name ?? profile?.full_name ?? "");
                            if (addr.contact_phone) setPhone(addr.contact_phone);
                          }}
                          style={[
                            styles.addressChip,
                            selectedAddressId === addr.id && styles.addressChipActive,
                          ]}
                          accessibilityRole="button"
                        >
                          <Text
                            style={[
                              styles.addressChipText,
                              selectedAddressId === addr.id && styles.addressChipTextActive,
                            ]}
                          >
                            {addr.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
              <AddressAutocomplete
                label={t("addressLabel")}
                placeholder={t("addressPlaceholder")}
                address={address}
                location={deliveryLocation}
                onChange={(addr, loc) => {
                  setAddress(addr);
                  setDeliveryLocation(loc);
                }}
              />
              <Input
                label={t("contactNameLabel")}
                placeholder={t("contactNamePlaceholder")}
                value={contactName}
                onChangeText={setContactName}
              />
              <Input
                label={t("buildingFloorLabel")}
                placeholder={t("buildingFloorPlaceholder")}
                value={buildingFloor}
                onChangeText={setBuildingFloor}
              />
            </View>
          )}

          <Input
            label={t("notesLabel")}
            placeholder={t("notesPlaceholder")}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
            style={styles.textArea}
          />
        </Card>

        <Card padding="lg" radius="3xl" style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t("subtotal")}</Text>
            <Text style={styles.totalValue}>{formatSAR(isPlanCheckout ? planPrice : checkoutSubtotal)}</Text>
          </View>
          {!isPlanCheckout && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t("deliveryFee")}</Text>
              <Text style={styles.totalValue}>{formatSAR(deliveryTotal)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>{t("total")}</Text>
            <Text style={styles.grandTotalValue}>{formatSAR(grandTotal)}</Text>
          </View>
        </Card>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, spacing.md) },
        ]}
      >
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>{t("total")}</Text>
          <Text style={styles.footerTotalValue}>{formatSAR(grandTotal)}</Text>
        </View>
        <Pressable
          style={[styles.placeButton, placing && styles.placeButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={placing}
        >
          <Text style={styles.placeButtonText}>
            {placing
              ? t("placing")
              : isPlanCheckout
              ? t("subscribe")
              : t("placeOrder")}
          </Text>
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
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  heading: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 24,
    color: palette.foreground,
  },
  subheading: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
    marginTop: 2,
  },
  card: {
    gap: spacing.sm,
    marginTop: spacing.lg,
    // Container styling is handled by Card.
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: palette.foreground,
  },
  cardPrice: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 28,
    color: palette.primary,
    letterSpacing: -0.025,
  },
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  storeImageWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: palette.surface,
  },
  storeImage: {
    width: "100%",
    height: "100%",
  },
  storeText: {
    flex: 1,
    gap: 2,
  },
  storeName: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: palette.foreground,
  },
  storeMeta: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: palette.mutedForeground,
  },
  items: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  itemImageWrap: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: palette.surface,
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  itemText: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.foreground,
    lineHeight: 17,
  },
  itemMeta: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: palette.mutedForeground,
  },
  itemTotal: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: palette.foreground,
  },
  deliveryToggle: {
    flexDirection: "row",
    gap: spacing.xs,
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    padding: 4,
    marginTop: spacing.sm,
  },
  toggleButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: radii.lg,
  },
  toggleButtonActive: {
    backgroundColor: palette.card,
    ...shadows.card,
  },
  toggleText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.mutedForeground,
  },
  toggleTextActive: {
    color: palette.foreground,
  },
  deliveryNote: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: palette.success,
    marginTop: spacing.xs,
  },
  paymentBlock: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  paymentLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.foreground,
  },
  paymentToggle: {
    flexDirection: "row",
    gap: spacing.xs,
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    padding: 4,
  },
  paymentHint: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: palette.mutedForeground,
  },
  toggleButtonDisabled: {
    opacity: 0.5,
  },
  toggleTextDisabled: {
    color: palette.mutedForeground,
  },
  textArea: {
    minHeight: 70,
  },
  addressBlock: {
    gap: spacing.md,
  },
  savedAddresses: {
    gap: spacing.sm,
  },
  savedAddressesTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.foreground,
  },
  addressChips: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  addressChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
  },
  addressChipActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  addressChipText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: palette.foreground,
  },
  addressChipTextActive: {
    color: palette.primaryForeground,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  grandTotalLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: palette.foreground,
  },
  grandTotalValue: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 22,
    color: palette.primary,
  },
  scrollView: {
    flex: 1,
  },
  footer: {
    backgroundColor: palette.card,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  footerTotal: {
    flex: 1,
    gap: spacing.xs,
  },
  footerTotalLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: palette.mutedForeground,
  },
  footerTotalValue: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: palette.foreground,
  },
  placeButton: {
    flex: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.primary,
    borderRadius: radii.xl,
    paddingVertical: 12,
  },
  placeButtonDisabled: {
    opacity: 0.7,
  },
  placeButtonText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: palette.primaryForeground,
  },
});
