import { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  useWindowDimensions,
  ScrollView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Minus, Plus, ShoppingBag } from "lucide-react-native";
import { useCart } from "../lib/cart-context";
import { formatSAR } from "../lib/format";
import { palette, fonts, spacing, radii, shadows } from "../lib/theme";
import { Button } from "./Button";

export function CartDrawer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const DRAWER_WIDTH = Math.min(width * 0.9, 420);
  const { items, itemCount, subtotal, isOpen, closeCart, updateQuantity, removeItem } = useCart();

  const translateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 40,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: DRAWER_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  const handleCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  return (
    <View
      style={[StyleSheet.absoluteFill, { display: isOpen ? "flex" : "none" }]}
      pointerEvents={isOpen ? "auto" : "none"}
    >
      <Animated.View
        style={[styles.overlay, { opacity }]}
        pointerEvents={isOpen ? "auto" : "none"}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={closeCart} />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          {
            width: DRAWER_WIDTH,
            paddingTop: insets.top + spacing.md,
            paddingBottom: Math.max(insets.bottom + spacing.md, spacing.lg),
            transform: [{ translateX }],
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Cart</Text>
          <Pressable style={styles.closeButton} onPress={closeCart}>
            <X size={18} color={palette.foreground} />
          </Pressable>
        </View>

        {items.length === 0 ? (
          <View style={styles.empty}>
            <ShoppingBag size={48} color={palette.mutedForeground} />
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyText}>
              Add products from your favorite stores and they’ll appear here.
            </Text>
            <Button title="Continue shopping" onPress={closeCart} style={styles.emptyButton} />
          </View>
        ) : (
          <>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scroll}
            >
              {items.map(({ product, quantity }) => (
                <View key={product.id} style={styles.item}>
                  <View style={styles.imageWrapper}>
                    <Image
                      source={typeof product.image === "string" ? { uri: product.image } : product.image}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={styles.details}>
                    <Text style={styles.name} numberOfLines={2}>
                      {product.name}
                    </Text>
                    <Text style={styles.unitPrice}>
                      {formatSAR(product.price)} / item
                    </Text>
                    <View style={styles.stepper}>
                      <Pressable
                        style={styles.stepperButton}
                        onPress={() => updateQuantity(product.id, quantity - 1)}
                      >
                        <Minus size={14} color={palette.mutedForeground} />
                      </Pressable>
                      <Text style={styles.quantity}>{quantity}</Text>
                      <Pressable
                        style={styles.stepperButton}
                        onPress={() => updateQuantity(product.id, quantity + 1)}
                      >
                        <Plus size={14} color={palette.mutedForeground} />
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.right}>
                    <Text style={styles.lineTotal}>
                      {formatSAR(product.price * quantity)}
                    </Text>
                    <Pressable onPress={() => removeItem(product.id)}>
                      <Text style={styles.remove}>Remove</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.footer}>
              <View style={styles.row}>
                <Text style={styles.footerLabel}>Subtotal</Text>
                <Text style={styles.footerValue}>{formatSAR(subtotal)}</Text>
              </View>
              <Text style={styles.footerHint}>
                {itemCount} items · Delivery calculated at checkout
              </Text>
              <Button
                title="Checkout"
                size="lg"
                onPress={handleCheckout}
                style={styles.checkoutButton}
              />
            </View>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(35, 51, 56, 0.4)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: palette.card,
    shadowColor: "#233338",
    shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 10,
    borderLeftWidth: 1,
    borderLeftColor: palette.border,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: palette.foreground,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: palette.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: palette.foreground,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
    textAlign: "center",
    lineHeight: 18,
  },
  emptyButton: {
    marginTop: spacing.md,
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radii["2xl"],
    backgroundColor: palette.background,
  },
  imageWrapper: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: palette.surface,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  details: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.foreground,
    lineHeight: 17,
  },
  unitPrice: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: palette.mutedForeground,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radii.lg,
    backgroundColor: palette.card,
  },
  stepperButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  quantity: {
    width: 26,
    textAlign: "center",
    fontFamily: fonts.sansBold,
    fontSize: 12,
    color: palette.foreground,
  },
  right: {
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  lineTotal: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: palette.foreground,
  },
  remove: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: palette.destructive,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: palette.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerLabel: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.mutedForeground,
  },
  footerValue: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: palette.foreground,
  },
  footerHint: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: palette.mutedForeground,
  },
  checkoutButton: {
    marginTop: spacing.sm,
  },
});
