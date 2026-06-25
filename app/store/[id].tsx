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
import { MessageCircle, RotateCcw } from "lucide-react-native";
import { TopBar } from "../../src/components/TopBar";
import { Card } from "../../src/components/Card";
import { ProductCard } from "../../src/components/ProductCard";
import { ProductCardSkeleton } from "../../src/components/Skeleton";
import { palette, fonts, spacing, radii, shadows } from "../../src/lib/theme";
import { useStore } from "../../src/hooks/useStore";
import { useProducts } from "../../src/hooks/useProducts";
import { useTranslation } from "../../src/lib/i18n";

export default function StoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const {
    data: store,
    isLoading: storeLoading,
    error: storeError,
    refetch: refetchStore,
  } = useStore(id);

  const {
    data: items = [],
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useProducts({ storeId: store?.id });

  if (storeLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (storeError || !store) {
    return (
      <View style={[styles.container, styles.center, { padding: spacing.lg }]}>
        <Text style={styles.name}>{t("storeNotFound")}</Text>
        <Pressable style={styles.backLink} onPress={() => refetchStore()}>
          <RotateCcw size={14} color={palette.primary} />
          <Text style={styles.backLinkText}>{t("tryAgain")}</Text>
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
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        {/* Cover */}
        <View style={styles.coverWrapper}>
          <Image
            source={typeof store.image === "string" ? { uri: store.image } : store.image}
            style={styles.coverImage}
            resizeMode="cover"
          />
          <View style={styles.coverGradient} />
        </View>

        <View style={styles.content}>
          <Card padding="lg" radius="3xl" shadow="lift" style={styles.headerCard}>
            <View style={styles.badgeRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {store.categoryEmoji} {store.category}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  store.open ? styles.statusOpen : styles.statusClosed,
                ]}
              >
                <View style={[styles.dot, store.open ? styles.dotOpen : styles.dotClosed]} />
                <Text style={styles.statusText}>
                  {store.open ? t("openNowShort") : t("closed")}
                </Text>
              </View>
            </View>

            <Text style={styles.name}>{store.name}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.meta}>📍 {store.location}</Text>
              <Text style={styles.meta}>🕒 {store.hours}</Text>
              <Text style={styles.meta}>
                <Text style={styles.star}>★</Text> {store.rating}{" "}
                <Text style={styles.reviews}>({store.reviews} reviews)</Text>
              </Text>
            </View>

            <Pressable
              style={styles.messageButton}
              onPress={() => router.push(`/chat/${store.id}`)}
            >
              <MessageCircle size={18} color={palette.primaryForeground} />
              <Text style={styles.messageButtonText}>{t("messageSeller")}</Text>
            </Pressable>
          </Card>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("allProducts")}</Text>
              <Text style={styles.sectionSubtitle}>
                {productsLoading ? "..." : t("itemsCount", { count: items.length })}
              </Text>
            </View>

            {productsError && (
              <Pressable style={styles.errorRow} onPress={() => refetchProducts()}>
                <Text style={styles.errorText}>{t("couldNotLoadProducts")}</Text>
                <RotateCcw size={14} color={palette.destructive} />
              </Pressable>
            )}

            <View style={styles.productGrid}>
              {productsLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <View key={`prod-skel-${i}`} style={styles.productGridItem}>
                    <ProductCardSkeleton />
                  </View>
                ))}
              {!productsLoading &&
                items.map((p) => (
                  <View key={p.id} style={styles.productGridItem}>
                    <ProductCard product={p} />
                  </View>
                ))}
            </View>
          </View>

        </View>
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
  },
  coverWrapper: {
    marginHorizontal: -spacing.lg,
    height: 200,
    position: "relative",
    overflow: "hidden",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverGradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(35,51,56,0.2)",
  },
  content: {
    marginTop: -48,
  },
  headerCard: {
    gap: spacing.sm,
    // Container styling is handled by Card.
  },
  badgeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: palette.primarySoft,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.full,
  },
  categoryText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    color: palette.primary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.full,
  },
  statusOpen: {
    backgroundColor: "rgba(76,175,80,0.1)",
  },
  statusClosed: {
    backgroundColor: "rgba(195,86,56,0.1)",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  dotOpen: {
    backgroundColor: palette.success,
  },
  dotClosed: {
    backgroundColor: palette.destructive,
  },
  statusText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    color: palette.foreground,
  },
  name: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 26,
    color: palette.foreground,
    letterSpacing: -0.025,
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  meta: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.mutedForeground,
  },
  star: {
    color: palette.warning,
  },
  reviews: {
    color: palette.mutedForeground,
  },
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: palette.primary,
    marginTop: spacing.sm,
    paddingVertical: 12,
    borderRadius: radii["2xl"],
    ...shadows.card,
  },
  messageButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: palette.primaryForeground,
  },
  section: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: palette.foreground,
  },
  sectionSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: palette.mutedForeground,
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
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  backLinkText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.primary,
  },
});
