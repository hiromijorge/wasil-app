import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Minus, Plus, ChevronLeft, Check, RotateCcw } from "lucide-react-native";
import { TopBar } from "../../src/components/TopBar";
import { ProductCard } from "../../src/components/ProductCard";
import { ProductCardSkeleton } from "../../src/components/Skeleton";
import { palette, fonts, spacing, radii, shadows } from "../../src/lib/theme";
import { formatSAR } from "../../src/lib/demo-data";
import { slugify } from "../../src/lib/slugify";
import { useCart } from "../../src/lib/cart-context";
import { useTranslation } from "../../src/lib/i18n";
import { useProduct } from "../../src/hooks/useProduct";
import { useStore } from "../../src/hooks/useStore";
import { useProducts } from "../../src/hooks/useProducts";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { addItem } = useCart();

  const {
    data: product,
    isLoading: productLoading,
    error: productError,
    refetch: refetchProduct,
  } = useProduct(id);

  const storeId = product?.storeId;
  const {
    data: store,
    isLoading: storeLoading,
    error: storeError,
  } = useStore(storeId);

  const {
    data: storeProducts = [],
    isLoading: relatedLoading,
    error: relatedError,
    refetch: refetchRelated,
  } = useProducts({ storeId });

  const related = useMemo(
    () => storeProducts.filter((p) => p.id !== id).slice(0, 4),
    [storeProducts, id]
  );

  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    if (!product) return;
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  if (productLoading || storeLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (productError || !product) {
    return (
      <View style={[styles.container, styles.center, { padding: spacing.lg }]}>
        <Text style={styles.name}>{t("productNotFound")}</Text>
        <Pressable style={styles.backLink} onPress={() => refetchProduct()}>
          <RotateCcw size={14} color={palette.primary} />
          <Text style={styles.backLinkText}>{t("tryAgain")}</Text>
        </Pressable>
      </View>
    );
  }

  if (storeError || !store) {
    return (
      <View style={[styles.container, styles.center, { padding: spacing.lg }]}>
        <Text style={styles.name}>{t("storeInfoUnavailable")}</Text>
        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <ChevronLeft size={14} color={palette.primary} />
          <Text style={styles.backLinkText}>{t("goBack")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar showBack showCart />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 120 },
        ]}
      >
        <Pressable
          style={styles.backLink}
          onPress={() => router.push(`/store/${slugify(store.name)}`)}
        >
          <ChevronLeft size={14} color={palette.mutedForeground} />
          <Text style={styles.backLinkText}>{t("backToStore", { store: store.name })}</Text>
        </Pressable>

        <View style={styles.columns}>
          <View style={[styles.imageCard, shadows.card]}>
            <Image
              source={typeof product.image === "string" ? { uri: product.image } : product.image}
              style={styles.image}
              resizeMode="cover"
            />
          </View>

          <View style={styles.info}>
            {store.restrictionActive && (
              <View style={styles.restrictionBanner}>
                <Text style={styles.restrictionTitle}>{t("storeRestricted")}</Text>
                <Text style={styles.restrictionText}>
                  {store.restrictionReason || t("storeRestrictedReason")}
                </Text>
              </View>
            )}

            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {store.categoryEmoji} {store.category}
              </Text>
            </View>

            <Text style={styles.name}>{product.name}</Text>
            <Text style={styles.price}>{formatSAR(product.price)}</Text>

            <Text style={styles.description}>{product.description}</Text>

            <Pressable
              style={styles.storeCard}
              onPress={() => router.push(`/store/${slugify(store.name)}`)}
            >
              <View style={styles.storeImageWrap}>
                <Image
                  source={typeof store.image === "string" ? { uri: store.image } : store.image}
                  style={styles.storeImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.storeText}>
                <Text style={styles.storeName}>{store.name}</Text>
                <Text style={styles.storeMeta}>
                  <Text style={styles.star}>★</Text> {store.rating} · 📍 {store.location}
                </Text>
              </View>
              <Text style={styles.storeAction}>{t("viewStore")}</Text>
            </Pressable>

            <View style={styles.quantityRow}>
              <Text style={styles.quantityLabel}>{t("quantity")}</Text>
              <View style={styles.quantityStepper}>
                <Pressable
                  style={styles.stepperButton}
                  onPress={() => setQty((q) => Math.max(1, q - 1))}
                >
                  <Minus size={16} color={palette.mutedForeground} />
                </Pressable>
                <Text style={styles.quantity}>{qty}</Text>
                <Pressable
                  style={styles.stepperButton}
                  onPress={() => setQty((q) => q + 1)}
                >
                  <Plus size={16} color={palette.mutedForeground} />
                </Pressable>
              </View>
            </View>

            <Pressable
              style={[
                styles.addButton,
                added && styles.addButtonSuccess,
                store.restrictionActive && styles.addButtonDisabled,
              ]}
              onPress={handleAdd}
              disabled={store.restrictionActive}
            >
              {added ? (
                <Check size={18} color={palette.primaryForeground} />
              ) : null}
              <Text style={styles.addButtonText}>
                {store.restrictionActive
                  ? t("storeRestricted")
                  : added
                  ? t("addedToCart")
                  : t("addToCart")}
              </Text>
            </Pressable>
          </View>
        </View>

        {(related.length > 0 || relatedLoading) && store && (
          <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>{t("moreFromStore", { store: store.name })}</Text>

            {relatedError && (
              <Pressable style={styles.errorRow} onPress={() => refetchRelated()}>
                <Text style={styles.errorText}>{t("couldNotLoadRelated")}</Text>
                <RotateCcw size={14} color={palette.destructive} />
              </Pressable>
            )}

            <View style={styles.productGrid}>
              {relatedLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <View key={`rel-skel-${i}`} style={styles.productGridItem}>
                    <ProductCardSkeleton />
                  </View>
                ))}
              {!relatedLoading &&
                related.map((p) => (
                  <View key={p.id} style={styles.productGridItem}>
                    <ProductCard product={p} />
                  </View>
                ))}
            </View>
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  backLinkText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: palette.mutedForeground,
  },
  columns: {
    gap: spacing.lg,
  },
  imageCard: {
    backgroundColor: palette.card,
    borderRadius: radii["3xl"],
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    overflow: "hidden",
    aspectRatio: 1,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  info: {
    gap: spacing.sm,
  },
  restrictionBanner: {
    backgroundColor: "rgba(195,86,56,0.1)",
    borderWidth: 1,
    borderColor: "rgba(195,86,56,0.3)",
    borderRadius: radii["2xl"],
    padding: spacing.md,
    gap: spacing.xs,
  },
  restrictionTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 13,
    color: palette.destructive,
  },
  restrictionText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: palette.destructive,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: palette.primarySoft,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.full,
  },
  categoryText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: palette.primary,
  },
  name: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 28,
    color: palette.foreground,
    letterSpacing: -0.025,
    lineHeight: 32,
  },
  price: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 28,
    color: palette.primary,
    letterSpacing: -0.025,
  },
  description: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: palette.mutedForeground,
    marginTop: spacing.xs,
  },
  storeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    borderRadius: radii["2xl"],
    padding: spacing.sm,
    marginTop: spacing.sm,
    ...shadows.card,
  },
  storeImageWrap: {
    width: 52,
    height: 52,
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
  star: {
    color: palette.warning,
  },
  storeAction: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: palette.primary,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  quantityLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.mutedForeground,
  },
  quantityStepper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radii.xl,
    backgroundColor: palette.card,
  },
  stepperButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  quantity: {
    width: 32,
    textAlign: "center",
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: palette.foreground,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: palette.primary,
    borderRadius: radii["2xl"],
    paddingVertical: 14,
    marginTop: spacing.sm,
    ...shadows.card,
  },
  addButtonSuccess: {
    backgroundColor: palette.success,
  },
  addButtonDisabled: {
    backgroundColor: palette.muted,
  },
  addButtonText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: palette.primaryForeground,
  },
  relatedSection: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  relatedTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: palette.foreground,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  productGridItem: {
    width: "47%",
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
