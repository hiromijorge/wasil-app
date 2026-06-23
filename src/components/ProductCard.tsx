import { useState } from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import { palette, fonts, spacing, radii, shadows } from "../lib/theme";
import { formatSAR, type Product } from "../lib/demo-data";
import { useCart } from "../lib/cart-context";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = (e?: any) => {
    e?.stopPropagation?.();
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push(`/product/${product.id}`)}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={typeof product.image === "string" ? { uri: product.image } : product.image}
          style={styles.image}
          resizeMode="cover"
        />
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        {product.storeName ? (
          <Text style={styles.storeName}>{product.storeName}</Text>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.price}>{formatSAR(product.price)}</Text>
          <Pressable
            style={[
              styles.addButton,
              added && styles.addButtonSuccess,
            ]}
            onPress={handleAdd}
            hitSlop={8}
          >
            {added ? (
              <Check size={14} color={palette.primaryForeground} />
            ) : (
              <Text style={styles.addText}>+</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: palette.card,
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    overflow: "hidden",
    ...shadows.card,
  },
  pressed: {
    opacity: 0.96,
    transform: [{ translateY: 1 }],
  },
  imageWrapper: {
    aspectRatio: 1,
    backgroundColor: palette.surface,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  body: {
    padding: spacing.sm,
    gap: 2,
  },
  name: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.foreground,
    lineHeight: 17,
    minHeight: 34,
  },
  storeName: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: palette.mutedForeground,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  price: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: palette.primary,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: radii.md,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonSuccess: {
    backgroundColor: palette.success,
  },
  addText: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: palette.primary,
    lineHeight: 20,
  },
});
