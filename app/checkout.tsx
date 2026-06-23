import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TopBar } from "../src/components/TopBar";
import { Input } from "../src/components/Input";
import { palette, fonts, spacing, radii, shadows } from "../src/lib/theme";
import { formatSAR } from "../src/lib/demo-data";
import { supabase } from "../src/lib/supabase";
import { useCart } from "../src/lib/cart-context";
import { useAuth } from "../src/lib/auth-context";
import { useTranslation } from "../src/lib/i18n";
import { useStores } from "../src/hooks/useStores";
import { useCreateOrder } from "../src/hooks/useCreateOrder";

type DeliveryType = "pickup" | "delivery";

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { plan } = useLocalSearchParams<{ plan?: string }>();
  const { items, subtotal, clearCart } = useCart();
  const { session } = useAuth();
  const { t } = useTranslation();
  const { createOrder } = useCreateOrder();
  const { data: storesData = [] } = useStores();

  const storeMap = useMemo(
    () => new Map(storesData.map((s) => [s.id, s])),
    [storesData]
  );

  const planPrice = plan === "growth" ? 300 : plan === "premium" ? 500 : plan === "starter" ? 100 : 0;
  const isPlanCheckout = Boolean(plan && planPrice > 0);

  const [phone, setPhone] = useState("+967");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryTypes, setDeliveryTypes] = useState<Record<string, DeliveryType>>({});
  const [placing, setPlacing] = useState(false);

  const groups = useMemo(() => {
    if (isPlanCheckout) return [];
    const map = new Map<string, typeof items>();
    items.forEach((item) => {
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
        };
      })
      .filter((g): g is typeof g & { store: NonNullable<typeof g.store> } => !!g.store);
  }, [items, deliveryTypes, isPlanCheckout]);

  const deliveryTotal = useMemo(
    () => groups.reduce((s, g) => s + (g.deliveryType === "delivery" ? g.deliveryFee : 0), 0),
    [groups],
  );

  const grandTotal = isPlanCheckout ? planPrice : subtotal + deliveryTotal;

  const setDeliveryType = (storeId: string, type: DeliveryType) => {
    setDeliveryTypes((prev) => ({ ...prev, [storeId]: type }));
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
          notes,
        });
        created.push(orderId);
      }

      clearCart();
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
        onBack={() => router.push(isPlanCheckout ? "/(tabs)/plans" : "/(tabs)/")}
        showCart
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 160 },
        ]}
      >
        <Text style={styles.heading}>{t("checkoutTitle")}</Text>
        <Text style={styles.subheading}>
          {isPlanCheckout ? t("subscriptionSummary") : t("checkoutSubtitle")}
        </Text>

        {isPlanCheckout ? (
          <View style={[styles.card, shadows.card]}>
            <Text style={styles.cardTitle}>
              {plan?.charAt(0).toUpperCase()}
              {plan?.slice(1)} plan
            </Text>
            <Text style={styles.cardPrice}>{formatSAR(planPrice)}</Text>
          </View>
        ) : (
          <>
            {groups.map((g) => (
              <View key={g.store.id} style={[styles.card, shadows.card]}>
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
              </View>
            ))}
          </>
        )}

        <View style={[styles.card, shadows.card]}>
          <Text style={styles.cardTitle}>{t("customerDetails")}</Text>

          <Input
            label={t("phoneLabel")}
            placeholder={t("phonePlaceholder")}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          {!isPlanCheckout && groups.some((g) => g.deliveryType === "delivery") && (
            <Input
              label={t("addressLabel")}
              placeholder={t("addressPlaceholder")}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              style={styles.textArea}
            />
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
        </View>

        <View style={[styles.card, shadows.card]}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t("subtotal")}</Text>
            <Text style={styles.totalValue}>{formatSAR(isPlanCheckout ? planPrice : subtotal)}</Text>
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
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom + 80, 100) },
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
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    borderRadius: radii["3xl"],
    padding: spacing.lg,
    gap: spacing.sm,
    marginTop: spacing.lg,
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
  textArea: {
    minHeight: 70,
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
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
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
