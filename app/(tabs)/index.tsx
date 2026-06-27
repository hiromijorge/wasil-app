import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, ChevronRight, RotateCcw, Package, Truck } from "lucide-react-native";
import { TopBar } from "../../src/components/TopBar";
import { StoreCard } from "../../src/components/StoreCard";
import { ProductCard } from "../../src/components/ProductCard";
import { Card } from "../../src/components/Card";
import { StoreCardSkeleton, ProductCardSkeleton } from "../../src/components/Skeleton";
import { palette, fonts, spacing, radii, shadows } from "../../src/lib/theme";
import { stores as demoStores, products as demoProducts, categories } from "../../src/lib/demo-data";
import { useStores } from "../../src/hooks/useStores";
import { useProducts } from "../../src/hooks/useProducts";
import { useTranslation } from "../../src/lib/i18n";

const MD_BREAKPOINT = 768;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= MD_BREAKPOINT;
  const { t } = useTranslation();
  const [cat, setCat] = useState("all");

  const categoryFilter = cat === "all" ? undefined : cat;
  const {
    data: storesData = demoStores,
    isLoading: storesLoading,
    error: storesError,
    refetch: refetchStores,
  } = useStores({ category: categoryFilter });

  const {
    data: productsData = demoProducts,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useProducts();

  const filteredStores = storesData;
  const popular = productsData.slice(0, 6);
  const heroStores = storesData.slice(0, 4);
  const statsLoaded = !storesLoading && !productsLoading;

  return (
    <View style={styles.container}>
      <TopBar showCart />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={styles.gridBg} />
          <View style={styles.heroContainer}>
            <View style={[styles.heroContent, isDesktop && styles.heroContentDesktop]}>
              <View style={styles.heroText}>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>{t("liveIn")}</Text>
                </View>

                <Text style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}>
                  {t("heroTitle")}{"\n"}
                  <Text style={styles.heroTitleAccent}>{t("heroTitleAccent")}</Text>
                </Text>
                <Text style={[styles.heroSubtitle, isDesktop && styles.heroSubtitleDesktop]}>
                  {t("heroSubtitle")}
                </Text>

                <Card
                  padding="md"
                  style={[styles.searchCard, isDesktop && styles.searchCardDesktop]}
                >
                  <Pressable
                    style={styles.searchCardInner}
                    onPress={() => router.push("/(tabs)/search")}
                    accessibilityRole="button"
                  >
                    <View style={styles.searchIconCircle}>
                      <Search size={16} color={palette.primary} />
                    </View>
                    <Text style={styles.searchPlaceholder}>{t("searchPlaceholder")}</Text>
                    <Text style={styles.searchAction}>{t("searchAction")}</Text>
                  </Pressable>
                </Card>

                <View style={styles.statsRow}>
                  <Stat n={statsLoaded ? `${storesData.length}+` : "—"} l={t("localStores")} />
                  <Stat n={statsLoaded ? `${productsData.length}+` : "—"} l={t("products")} />
                  <Stat n="4.8★" l={t("avgRating")} />
                </View>
              </View>

              {isDesktop && (
                <View style={styles.heroCollage}>
                  {(heroStores.length > 0 ? heroStores : demoStores.slice(0, 4)).map((s, i) => (
                    <View
                      key={`hero-${s.id}`}
                      style={[
                        styles.collageItem,
                        i % 2 === 1 && styles.collageItemOffset,
                      ]}
                    >
                      <Image
                        source={typeof s.image === "string" ? { uri: s.image } : s.image}
                        style={styles.collageImage}
                        resizeMode="cover"
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Wasil Send CTA */}
          <Card
            padding="md"
            radius="xl"
            style={styles.sendCard}
          >
            <Pressable
              onPress={() => router.push("/send")}
              style={styles.sendCardInner}
              accessibilityRole="button"
            >
              <View style={[styles.sendIconCircle, { backgroundColor: `${palette.primary}15` }]}>
                <Package size={24} color={palette.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sendCardTitle}>{t("sendTitle")}</Text>
                <Text style={styles.sendCardSubtitle}>{t("sendSubtitle")}</Text>
              </View>
              <Truck size={20} color={palette.primary} />
            </Pressable>
          </Card>

          {/* Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categories}
          >
            {categories.map((c) => {
              const active = cat === c.id;
              return (
                <Pressable
                  key={c.id}
                  style={[
                    styles.categoryChip,
                    active && styles.categoryChipActive,
                  ]}
                  onPress={() => setCat(c.id)}
                >
                  <Text style={styles.categoryEmoji}>{c.emoji}</Text>
                  <Text
                    style={[
                      styles.categoryLabel,
                      active && styles.categoryLabelActive,
                    ]}
                  >
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Stores */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>{t("storesNearYou")}</Text>
                <Text style={styles.sectionSubtitle}>
                  {filteredStores.length === 1
                    ? t("storeCount", { count: filteredStores.length })
                    : t("storeCountPlural", { count: filteredStores.length })}
                </Text>
              </View>
              <Pressable onPress={() => router.push("/(tabs)/stores")}>
                <Text style={styles.seeAll}>{t("seeAll")}</Text>
              </Pressable>
            </View>

            {storesError && (
              <ErrorRetry message="Could not load stores" onRetry={refetchStores} />
            )}

            <View style={styles.storeGrid}>
              {storesLoading &&
                Array.from({ length: isDesktop ? 4 : 2 }).map((_, i) => (
                  <View key={`store-skel-${i}`} style={[styles.storeGridItem, { width: isDesktop ? "23.5%" : "100%" }]}>
                    <StoreCardSkeleton />
                  </View>
                ))}
              {!storesLoading &&
                filteredStores.slice(0, 4).map((s) => (
                  <View key={s.id} style={[styles.storeGridItem, { width: "100%" }]}>
                    <StoreCard store={s} variant="compact" />
                  </View>
                ))}
            </View>
          </View>

          {/* Popular Products */}
          <View style={styles.section}>
            <SectionHeader title={t("popularProducts")} subtitle={t("trendingThisWeek")} />

            {productsError && (
              <ErrorRetry message="Could not load products" onRetry={refetchProducts} />
            )}

            <View style={styles.productGrid}>
              {productsLoading &&
                Array.from({ length: isDesktop ? 6 : 4 }).map((_, i) => (
                  <View key={`prod-skel-${i}`} style={[styles.productGridItem, { width: isDesktop ? "15%" : "47%" }]}>
                    <ProductCardSkeleton />
                  </View>
                ))}
              {!productsLoading &&
                popular.map((p) => (
                  <View key={p.id} style={[styles.productGridItem, { width: isDesktop ? "15%" : "47%" }]}>
                    <ProductCard product={p} />
                  </View>
                ))}
            </View>
          </View>

          {/* Merchant CTA */}
          <View style={styles.merchantCta}>
            <View style={styles.merchantCtaContent}>
              <View style={styles.merchantBadge}>
                <Text style={styles.merchantBadgeText}>{t("forMerchants")}</Text>
              </View>
              <Text style={styles.merchantTitle}>
                {t("merchantCtaTitle")}
              </Text>
              <Text style={styles.merchantSubtitle}>
                {t("merchantCtaSubtitle")}
              </Text>
              <View style={styles.merchantActions}>
                <Pressable
                  style={styles.merchantPrimary}
                  onPress={() => router.push("/merchant-dashboard")}
                >
                  <Text style={styles.merchantPrimaryText}>{t("openDashboard")}</Text>
                </Pressable>
                <Pressable
                  style={styles.merchantSecondary}
                  onPress={() => router.push("/plans")}
                >
                  <Text style={styles.merchantSecondaryText}>{t("seePricing")}</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.glow1} />
            <View style={styles.glow2} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <View>
      <Text style={styles.statNumber}>{n}</Text>
      <Text style={styles.statLabel}>{l}</Text>
    </View>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Pressable style={styles.errorRow} onPress={onRetry}>
      <Text style={styles.errorText}>{message}</Text>
      <RotateCcw size={14} color={palette.destructive} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scroll: {
    paddingBottom: 100,
  },
  heroSection: {
    position: "relative",
    overflow: "hidden",
  },
  gridBg: {
    ...StyleSheet.absoluteFill,
    opacity: 0.6,
    // Radial grid simulated via repeated radial gradient is not supported in RN.
    // Using a subtle primary-tinted overlay instead.
    backgroundColor: "rgba(31, 116, 116, 0.02)",
  },
  heroContainer: {
    width: "100%",
    maxWidth: 1152,
    alignSelf: "center",
  },
  heroContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    flexDirection: "column",
    alignItems: "stretch",
    gap: spacing.lg,
  },
  heroContentDesktop: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroText: {
    flex: 1,
    gap: spacing.md,
  },
  liveBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: palette.primarySoft,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.full,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: palette.primary,
  },
  liveText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: palette.primary,
  },
  heroTitle: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 32,
    lineHeight: 36,
    color: palette.foreground,
    letterSpacing: -0.025,
  },
  heroTitleDesktop: {
    fontSize: 56,
    lineHeight: 60,
  },
  heroTitleAccent: {
    fontFamily: fonts.displaySemiBold,
    fontStyle: "italic",
    color: palette.primary,
  },
  heroSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: palette.mutedForeground,
    maxWidth: 340,
  },
  heroSubtitleDesktop: {
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 420,
  },
  searchCard: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  searchCardDesktop: {
    maxWidth: 420,
  },
  searchCardInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchIconCircle: {
    width: 32,
    height: 32,
    borderRadius: radii.lg,
    backgroundColor: palette.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  searchPlaceholder: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.mutedForeground,
  },
  searchAction: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: palette.primary,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.xl,
  },
  statNumber: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: palette.foreground,
  },
  statLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: palette.mutedForeground,
  },
  heroCollage: {
    width: "45%",
    maxWidth: 520,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  collageItem: {
    flex: 1,
    minWidth: "45%",
    aspectRatio: 1,
    borderRadius: 36,
    overflow: "hidden",
    ...shadows.lift,
  },
  collageItemOffset: {
    marginTop: 14,
  },
  collageImage: {
    width: "100%",
    height: "100%",
  },
  content: {
    width: "100%",
    maxWidth: 1152,
    alignSelf: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  sendCard: {
    // Container styling is handled by Card.
  },
  sendCardInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  sendIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  sendCardTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: palette.foreground,
  },
  sendCardSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: palette.mutedForeground,
    marginTop: 2,
  },
  categories: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: `${palette.border}80`,
    backgroundColor: palette.card,
  },
  categoryChipActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.foreground,
  },
  categoryLabelActive: {
    color: palette.primaryForeground,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.sm,
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
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: palette.foreground,
    letterSpacing: -0.025,
  },
  sectionSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: palette.mutedForeground,
  },
  seeAll: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.primary,
  },
  storeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  storeGridItem: {},
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  productGridItem: {
    width: "47%",
  },
  merchantCta: {
    position: "relative",
    overflow: "hidden",
    borderRadius: radii["3xl"],
    backgroundColor: palette.primary,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  merchantCtaContent: {
    position: "relative",
    zIndex: 1,
    gap: spacing.sm,
  },
  merchantBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.full,
  },
  merchantBadgeText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: palette.primaryForeground,
  },
  merchantTitle: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 22,
    color: palette.primaryForeground,
    letterSpacing: -0.025,
  },
  merchantSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: palette.primaryForeground,
    opacity: 0.9,
    lineHeight: 18,
  },
  merchantActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  merchantPrimary: {
    backgroundColor: palette.card,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.xl,
  },
  merchantPrimaryText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.primary,
  },
  merchantSecondary: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.xl,
  },
  merchantSecondaryText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: palette.primaryForeground,
  },
  glow1: {
    position: "absolute",
    right: -48,
    bottom: -48,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  glow2: {
    position: "absolute",
    right: 40,
    top: 40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});
